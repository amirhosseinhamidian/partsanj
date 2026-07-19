import {
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderInventoryStatus,
  OrderPaymentStatus,
  OrderStatus,
  PaymentAttemptStatus,
  Prisma,
} from '../../generated/prisma/client.js';

import { createErrorDetails, createLogContext } from '../../common/logging/logging.utils.js';
import { captureServerException } from '../../common/monitoring/sentry-monitoring.js';
import { PrismaService } from '../database/prisma.service.js';
import { expireOrderIfDue } from '../order/order-inventory.utils.js';
import type { PaymentProviderCode } from './payment-provider.contract.js';
import { PaymentProviderRegistry } from './providers/payment-provider.registry.js';

type CreatedPaymentAttempt = {
  id: string;
  orderId: string;
  orderNumber: number;
  providerCode: PaymentProviderCode;
  amountToman: number;
};

type CreatePaymentAttemptResult =
  | {
      kind: 'created';
      attempt: CreatedPaymentAttempt;
    }
  | {
      kind: 'expired';
    };

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly providerRegistry: PaymentProviderRegistry,
  ) {}

  async startPayment(userId: string, orderId: string) {
    this.assertPaymentEnabled();

    const providerCode = this.getDefaultProviderCode();

    const provider = this.providerRegistry.get(providerCode);

    provider.ensureReady();

    const callbackUrl = this.getProviderCallbackUrl(providerCode);

    const result = await this.createPaymentAttemptWithRetry(userId, orderId, providerCode);

    if (result.kind === 'expired') {
      throw new ConflictException({
        code: 'ORDER_PAYMENT_EXPIRED',
        message: 'مهلت پرداخت این سفارش به پایان رسیده است',
      });
    }

    const { attempt } = result;

    this.logger.log(
      createLogContext('payment_attempt_created', {
        orderId: attempt.orderId,
        orderNumber: attempt.orderNumber,
        paymentAttemptId: attempt.id,
        provider: attempt.providerCode,
        amountToman: attempt.amountToman,
        userId,
      }),
    );

    try {
      const initiation = await provider.initiatePayment({
        paymentAttemptId: attempt.id,
        orderId: attempt.orderId,
        orderNumber: attempt.orderNumber,
        amountToman: attempt.amountToman,
        callbackUrl,
      });

      const requestMetadata: Prisma.InputJsonObject = initiation.requestMetadata ?? {
        orderId: attempt.orderId,
        orderNumber: attempt.orderNumber,
        amountToman: attempt.amountToman,
      };

      const responseMetadata: Prisma.InputJsonObject = initiation.responseMetadata ?? {
        redirectUrl: initiation.redirectUrl,
      };

      await this.prisma.$transaction(async (transaction) => {
        await transaction.paymentAttempt.update({
          where: {
            id: attempt.id,
          },
          data: {
            status: PaymentAttemptStatus.REDIRECTED,
            providerSessionId: initiation.providerSessionId,
            requestMetadata,
            responseMetadata,
            redirectedAt: new Date(),
          },
        });

        await transaction.order.updateMany({
          where: {
            id: attempt.orderId,
            status: OrderStatus.PENDING_PAYMENT,
          },
          data: {
            paymentStatus: OrderPaymentStatus.PENDING,
          },
        });
      });

      this.logger.log(
        createLogContext('payment_redirect_created', {
          orderId: attempt.orderId,
          orderNumber: attempt.orderNumber,
          paymentAttemptId: attempt.id,
          provider: attempt.providerCode,
          amountToman: attempt.amountToman,
        }),
      );

      return {
        attemptId: attempt.id,
        providerCode: attempt.providerCode,
        redirectUrl: initiation.redirectUrl,
      };
    } catch (error) {
      this.logger.error(
        createLogContext('payment_initiation_failed', {
          orderId: attempt.orderId,
          orderNumber: attempt.orderNumber,
          paymentAttemptId: attempt.id,
          provider: attempt.providerCode,
          amountToman: attempt.amountToman,
          error: createErrorDetails(error),
        }),
      );

      await this.markAttemptAsFailed(attempt.id, attempt.orderId, error);

      throw error;
    }
  }

  private async createPaymentAttemptWithRetry(
    userId: string,
    orderId: string,
    providerCode: PaymentProviderCode,
  ): Promise<CreatePaymentAttemptResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          (transaction) =>
            this.createPaymentAttemptInTransaction(transaction, userId, orderId, providerCode),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        lastError = error;

        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';

        if (isSerializationConflict && attempt === 0) {
          continue;
        }

        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

        if (isUniqueConflict) {
          throw new ConflictException({
            code: 'PAYMENT_ALREADY_IN_PROGRESS',
            message: 'یک تلاش پرداخت فعال برای این سفارش وجود دارد',
          });
        }

        throw error;
      }
    }

    throw lastError;
  }

  private async createPaymentAttemptInTransaction(
    transaction: Prisma.TransactionClient,
    userId: string,
    orderId: string,
    providerCode: PaymentProviderCode,
  ): Promise<CreatePaymentAttemptResult> {
    const now = new Date();

    const order = await transaction.order.findFirst({
      where: {
        id: orderId,
        customerUserId: userId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        inventoryStatus: true,
        payableToman: true,
        expiresAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.PAID || order.paymentStatus === OrderPaymentStatus.PAID) {
      throw new ConflictException({
        code: 'ORDER_ALREADY_PAID',
        message: 'این سفارش قبلاً پرداخت شده است',
      });
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.EXPIRED) {
      throw new ConflictException({
        code: 'ORDER_NOT_PAYABLE',
        message: 'این سفارش قابل پرداخت نیست',
      });
    }

    const activeAttempt = await transaction.paymentAttempt.findFirst({
      where: {
        orderId: order.id,
        status: {
          in: [
            PaymentAttemptStatus.CREATED,
            PaymentAttemptStatus.REDIRECTED,
            PaymentAttemptStatus.CALLBACK_RECEIVED,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    if (activeAttempt) {
      throw new ConflictException({
        code: 'PAYMENT_ALREADY_IN_PROGRESS',
        message: 'یک تلاش پرداخت فعال برای این سفارش وجود دارد',
      });
    }

    if (order.expiresAt && order.expiresAt.getTime() <= now.getTime()) {
      const expired = await expireOrderIfDue(transaction, order.id, now);

      if (!expired) {
        throw new ConflictException({
          code: 'ORDER_STATE_CHANGED',
          message: 'وضعیت سفارش هم‌زمان تغییر کرده است، دوباره تلاش کنید',
        });
      }

      return {
        kind: 'expired',
      };
    }

    if (order.inventoryStatus !== OrderInventoryStatus.RESERVED) {
      throw new ConflictException({
        code: 'ORDER_INVENTORY_NOT_RESERVED',
        message: 'موجودی این سفارش رزرو نشده است و امکان پرداخت آن وجود ندارد',
      });
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new ConflictException({
        code: 'ORDER_NOT_READY_FOR_PAYMENT',
        message: 'وضعیت فعلی سفارش برای پرداخت آنلاین مناسب نیست',
      });
    }

    if (!order.payableToman || order.payableToman <= 0) {
      throw new ConflictException({
        code: 'ORDER_PAYMENT_AMOUNT_INVALID',
        message: 'مبلغ سفارش برای پرداخت آنلاین معتبر نیست',
      });
    }

    const latestAttempt = await transaction.paymentAttempt.findFirst({
      where: {
        orderId: order.id,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
      select: {
        attemptNumber: true,
      },
    });

    const paymentAttempt = await transaction.paymentAttempt.create({
      data: {
        orderId: order.id,
        attemptNumber: (latestAttempt?.attemptNumber ?? 0) + 1,
        providerCode,
        status: PaymentAttemptStatus.CREATED,
        amountToman: order.payableToman,
        requestMetadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          amountToman: order.payableToman,
        },
      },
      select: {
        id: true,
      },
    });

    await transaction.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus: OrderPaymentStatus.PENDING,
      },
    });

    return {
      kind: 'created',
      attempt: {
        id: paymentAttempt.id,
        orderId: order.id,
        orderNumber: order.orderNumber,
        providerCode,
        amountToman: order.payableToman,
      },
    };
  }

  private async markAttemptAsFailed(paymentAttemptId: string, orderId: string, error: unknown) {
    const failure = this.getFailureDetails(error);

    try {
      const changed = await this.prisma.$transaction(async (transaction) => {
        const updateResult = await transaction.paymentAttempt.updateMany({
          where: {
            id: paymentAttemptId,
            status: {
              in: [
                PaymentAttemptStatus.CREATED,
                PaymentAttemptStatus.REDIRECTED,
                PaymentAttemptStatus.CALLBACK_RECEIVED,
              ],
            },
          },
          data: {
            status: PaymentAttemptStatus.FAILED,
            failureCode: failure.code,
            failureMessage: failure.message,
            failedAt: new Date(),
          },
        });

        if (!updateResult.count) {
          return false;
        }

        await transaction.order.updateMany({
          where: {
            id: orderId,
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: OrderPaymentStatus.PENDING,
          },
          data: {
            paymentStatus: OrderPaymentStatus.FAILED,
          },
        });

        return true;
      });

      if (changed) {
        this.logger.warn(
          createLogContext('payment_attempt_marked_failed', {
            orderId,
            paymentAttemptId,
            failureCode: failure.code,
          }),
        );
      }
    } catch (persistenceError) {
      this.logger.error(
        createLogContext('payment_failure_persistence_failed', {
          orderId,
          paymentAttemptId,
          originalFailureCode: failure.code,
          error: createErrorDetails(persistenceError),
        }),
      );

      captureServerException(persistenceError, {
        event: 'payment_failure_persistence_failed',
        tags: {
          original_failure_code: failure.code,
        },
        context: {
          orderId,
          paymentAttemptId,
        },
      });

      // خطای اصلی Provider باید به کاربر برگردد.
    }
  }

  private assertPaymentEnabled() {
    const isEnabled =
      this.configService.get<string>('PAYMENT_ENABLED')?.trim().toLowerCase() === 'true';

    if (!isEnabled) {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_DISABLED',
        message: 'پرداخت آنلاین هنوز فعال نشده است',
      });
    }
  }

  private getDefaultProviderCode(): PaymentProviderCode {
    const providerCode = (this.configService.get<string>('PAYMENT_DEFAULT_PROVIDER') ?? 'ZIBAL')
      .trim()
      .toUpperCase();

    if (providerCode !== 'ZARINPAL' && providerCode !== 'ZIBAL') {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_PROVIDER_UNSUPPORTED',
        message: 'درگاه پرداخت پیش‌فرض پشتیبانی نمی‌شود',
      });
    }

    return providerCode;
  }

  private getFailureDetails(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'object' && response !== null) {
        const responseRecord = response as Record<string, unknown>;

        const code =
          typeof responseRecord.code === 'string'
            ? responseRecord.code
            : `HTTP_${error.getStatus()}`;

        const message =
          typeof responseRecord.message === 'string'
            ? responseRecord.message
            : 'خطا در شروع پرداخت';

        return {
          code,
          message,
        };
      }

      return {
        code: `HTTP_${error.getStatus()}`,
        message: typeof response === 'string' ? response : 'خطا در شروع پرداخت',
      };
    }

    if (error instanceof Error && error.message.trim()) {
      return {
        code: 'PAYMENT_PROVIDER_ERROR',
        message: error.message,
      };
    }

    return {
      code: 'PAYMENT_PROVIDER_ERROR',
      message: 'خطا در شروع پرداخت',
    };
  }

  private getProviderCallbackUrl(providerCode: PaymentProviderCode): string {
    const apiPublicUrl = this.configService.get<string>('API_PUBLIC_URL')?.trim();

    if (!apiPublicUrl) {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_CALLBACK_URL_MISSING',
        message: 'آدرس عمومی API برای Callback پرداخت تنظیم نشده است',
      });
    }

    let callbackPath: string;

    switch (providerCode) {
      case 'ZARINPAL':
        callbackPath = '/api/v1/payments/callbacks/zarinpal';
        break;

      case 'ZIBAL':
        callbackPath = '/api/v1/payments/callbacks/zibal';
        break;
    }

    try {
      return new URL(callbackPath, apiPublicUrl).toString();
    } catch {
      throw new ServiceUnavailableException({
        code: 'PAYMENT_CALLBACK_URL_INVALID',
        message: 'آدرس عمومی API برای Callback معتبر نیست',
      });
    }
  }
}
