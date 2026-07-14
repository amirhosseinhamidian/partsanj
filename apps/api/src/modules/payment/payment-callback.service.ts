import { ConflictException, Injectable, Logger } from '@nestjs/common';
import {
  OrderInventoryStatus,
  OrderPaymentStatus,
  OrderStatus,
  PaymentAttemptStatus,
} from '../../generated/prisma/client.js';

import {
  createErrorDetails,
  createLogContext,
} from '../../common/logging/logging.utils.js';
import { captureServerException } from '../../common/monitoring/sentry-monitoring.js';
import { OrderSmsOutboxService } from '../order-sms/order-sms-outbox.service.js';
import { PrismaService } from '../database/prisma.service.js';
import type {
  PaymentCallbackDecision,
  PaymentCallbackQuery,
  PaymentProviderCode,
  PaymentVerificationResult,
} from './payment-provider.contract.js';
import { PaymentProviderRegistry } from './providers/payment-provider.registry.js';

export type PaymentCallbackOutcomeState = 'paid' | 'cancelled' | 'failed' | 'pending' | 'invalid';

export type PaymentCallbackOutcome = {
  state: PaymentCallbackOutcomeState;
  orderId?: string;
  attemptId?: string;
};

type VerificationCandidate = {
  id: string;
  orderId: string;
  orderNumber: number;
  amountToman: number;
  providerSessionId: string;
};

@Injectable()
export class PaymentCallbackService {
  private readonly logger = new Logger(PaymentCallbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRegistry: PaymentProviderRegistry,
  
    private readonly orderSmsOutbox: OrderSmsOutboxService,) {}

  async handleCallback(
    providerCode: PaymentProviderCode,
    query: PaymentCallbackQuery,
  ): Promise<PaymentCallbackOutcome> {
    const provider = this.providerRegistry.get(providerCode);

    const decision = provider.parseCallback(query);

    if (!decision.providerSessionId) {
      return {
        state: 'invalid',
      };
    }

    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: {
        providerCode,
        providerSessionId: decision.providerSessionId,
      },
      select: {
        id: true,
        orderId: true,
        amountToman: true,
        status: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            inventoryStatus: true,
          },
        },
      },
    });

    if (!attempt) {
      return {
        state: 'invalid',
      };
    }

    const identity = {
      orderId: attempt.orderId,
      attemptId: attempt.id,
    };

    this.logger.log(
      createLogContext('payment_callback_received', {
        provider: providerCode,
        orderId: attempt.orderId,
        orderNumber: attempt.order.orderNumber,
        paymentAttemptId: attempt.id,
        callbackDecision: decision.kind,
        currentAttemptStatus: attempt.status,
      }),
    );

    if (
      attempt.status === PaymentAttemptStatus.VERIFIED ||
      attempt.order.status === OrderStatus.PAID ||
      attempt.order.paymentStatus === OrderPaymentStatus.PAID
    ) {
      return {
        ...identity,
        state: 'paid',
      };
    }

    if (attempt.status === PaymentAttemptStatus.CANCELLED) {
      return {
        ...identity,
        state: 'cancelled',
      };
    }

    if (attempt.status === PaymentAttemptStatus.FAILED) {
      return {
        ...identity,
        state: 'failed',
      };
    }

    if (
      attempt.order.status === OrderStatus.CANCELLED ||
      attempt.order.status === OrderStatus.EXPIRED ||
      attempt.order.inventoryStatus !== OrderInventoryStatus.RESERVED
    ) {
      return {
        ...identity,
        state: 'failed',
      };
    }

    if (attempt.status === PaymentAttemptStatus.CALLBACK_RECEIVED) {
      return this.verifyReceivedAttempt(providerCode, {
        id: attempt.id,
        orderId: attempt.orderId,
        orderNumber: attempt.order.orderNumber,
        amountToman: attempt.amountToman,
        providerSessionId: decision.providerSessionId,
      });
    }

    if (decision.kind === 'invalid') {
      return {
        ...identity,
        state: 'invalid',
      };
    }

    if (decision.kind === 'cancelled') {
      return this.markAttemptCancelled(
        providerCode,
        attempt.id,
        attempt.orderId,
        decision,
      );
    }

    const callbackReceived = await this.markCallbackReceived(attempt.id, decision);

    if (!callbackReceived) {
      return this.resolveCurrentOutcome(attempt.id);
    }

    return this.verifyReceivedAttempt(providerCode, {
      id: attempt.id,
      orderId: attempt.orderId,
      orderNumber: attempt.order.orderNumber,
      amountToman: attempt.amountToman,
      providerSessionId: decision.providerSessionId,
    });
  }

  private async markCallbackReceived(
    paymentAttemptId: string,
    decision: Extract<PaymentCallbackDecision, { kind: 'approved' }>,
  ) {
    const result = await this.prisma.paymentAttempt.updateMany({
      where: {
        id: paymentAttemptId,
        status: {
          in: [PaymentAttemptStatus.CREATED, PaymentAttemptStatus.REDIRECTED],
        },
      },
      data: {
        status: PaymentAttemptStatus.CALLBACK_RECEIVED,
        callbackPayload: decision.callbackMetadata,
        callbackReceivedAt: new Date(),
      },
    });

    return result.count === 1;
  }

  private async markAttemptCancelled(
    providerCode: PaymentProviderCode,
    paymentAttemptId: string,
    orderId: string,
    decision: Extract<PaymentCallbackDecision, { kind: 'cancelled' }>,
  ): Promise<PaymentCallbackOutcome> {
    const changed = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.paymentAttempt.updateMany({
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
          status: PaymentAttemptStatus.CANCELLED,
          callbackPayload: decision.callbackMetadata,
          callbackReceivedAt: new Date(),
          cancelledAt: new Date(),
          failureCode: decision.code,
          failureMessage: decision.message,
        },
      });

      if (!result.count) {
        return false;
      }

      await transaction.order.updateMany({
        where: {
          id: orderId,
          status: OrderStatus.PENDING_PAYMENT,
        },
        data: {
          paymentStatus: OrderPaymentStatus.UNPAID,
        },
      });

      return true;
    });

    if (!changed) {
      return this.resolveCurrentOutcome(paymentAttemptId);
    }

    this.logger.log(
      createLogContext('payment_cancelled', {
        provider: providerCode,
        orderId,
        paymentAttemptId,
        failureCode: decision.code,
      }),
    );

    return {
      orderId,
      attemptId: paymentAttemptId,
      state: 'cancelled',
    };
  }

  private async verifyReceivedAttempt(
    providerCode: PaymentProviderCode,
    attempt: VerificationCandidate,
  ): Promise<PaymentCallbackOutcome> {
    const provider = this.providerRegistry.get(providerCode);

    let verification: PaymentVerificationResult;

    try {
      verification = await provider.verifyPayment({
        paymentAttemptId: attempt.id,
        orderId: attempt.orderId,
        orderNumber: attempt.orderNumber,
        amountToman: attempt.amountToman,
        providerSessionId: attempt.providerSessionId,
      });
    } catch (error) {
      this.logger.error(
        createLogContext('payment_verification_request_failed', {
          provider: providerCode,
          orderId: attempt.orderId,
          orderNumber: attempt.orderNumber,
          paymentAttemptId: attempt.id,
          error: createErrorDetails(error),
        }),
      );

      captureServerException(error, {
        event: 'payment_verification_request_failed',
        tags: {
          provider: providerCode,
        },
        context: {
          orderId: attempt.orderId,
          orderNumber: attempt.orderNumber,
          paymentAttemptId: attempt.id,
        },
      });

      return {
        orderId: attempt.orderId,
        attemptId: attempt.id,
        state: 'pending',
      };
    }

    if (verification.kind === 'verified') {
      return this.markAttemptVerified(providerCode, attempt, verification);
    }

    return this.markAttemptFailed(providerCode, attempt, verification);
  }

  private async markAttemptVerified(
    providerCode: PaymentProviderCode,
    attempt: VerificationCandidate,
    verification: Extract<PaymentVerificationResult, { kind: 'verified' }>,
  ): Promise<PaymentCallbackOutcome> {
    const now = new Date();

    const changed = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.paymentAttempt.updateMany({
        where: {
          id: attempt.id,
          status: PaymentAttemptStatus.CALLBACK_RECEIVED,
        },
        data: {
          status: PaymentAttemptStatus.VERIFIED,
          verificationPayload: verification.responseMetadata,
          verifiedAt: now,
          failureCode: null,
          failureMessage: null,
          failedAt: null,
          ...(verification.providerReferenceId
            ? {
                providerReferenceId: verification.providerReferenceId,
              }
            : {}),
          ...(verification.cardPan
            ? {
                providerCardPan: verification.cardPan,
              }
            : {}),
          ...(verification.cardHash
            ? {
                providerCardHash: verification.cardHash,
              }
            : {}),
        },
      });

      if (!result.count) {
        return false;
      }

      const orderResult = await transaction.order.updateMany({
        where: {
          id: attempt.orderId,
          status: OrderStatus.PENDING_PAYMENT,
          inventoryStatus: OrderInventoryStatus.RESERVED,
        },
        data: {
          status: OrderStatus.PAID,
          paymentStatus: OrderPaymentStatus.PAID,
          paidAt: now,

          inventoryStatus: OrderInventoryStatus.COMMITTED,
          inventoryCommittedAt: now,
        },
      });

      if (orderResult.count !== 1) {
        throw new ConflictException({
          code: 'ORDER_PAYMENT_STATE_CHANGED',
          message: 'وضعیت سفارش یا رزرو موجودی برای ثبت پرداخت معتبر نیست',
        });
      }

      await this.orderSmsOutbox.enqueuePaymentSucceeded(
        transaction,
        attempt.orderId,
      );

      return true;
    });

    if (!changed) {
      return this.resolveCurrentOutcome(attempt.id);
    }

    this.logger.log(
      createLogContext('payment_verified', {
        provider: providerCode,
        orderId: attempt.orderId,
        orderNumber: attempt.orderNumber,
        paymentAttemptId: attempt.id,
        providerReferenceId: verification.providerReferenceId,
        amountToman: attempt.amountToman,
      }),
    );

    return {
      orderId: attempt.orderId,
      attemptId: attempt.id,
      state: 'paid',
    };
  }

  private async markAttemptFailed(
    providerCode: PaymentProviderCode,
    attempt: VerificationCandidate,
    verification: Extract<PaymentVerificationResult, { kind: 'failed' }>,
  ): Promise<PaymentCallbackOutcome> {
    const now = new Date();

    const changed = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.paymentAttempt.updateMany({
        where: {
          id: attempt.id,
          status: PaymentAttemptStatus.CALLBACK_RECEIVED,
        },
        data: {
          status: PaymentAttemptStatus.FAILED,
          verificationPayload: verification.responseMetadata,
          failureCode: verification.code,
          failureMessage: verification.message,
          failedAt: now,
        },
      });

      if (!result.count) {
        return false;
      }

      await transaction.order.updateMany({
        where: {
          id: attempt.orderId,
          status: OrderStatus.PENDING_PAYMENT,
        },
        data: {
          paymentStatus: OrderPaymentStatus.FAILED,
        },
      });

      return true;
    });

    if (!changed) {
      return this.resolveCurrentOutcome(attempt.id);
    }

    this.logger.warn(
      createLogContext('payment_verification_rejected', {
        provider: providerCode,
        orderId: attempt.orderId,
        orderNumber: attempt.orderNumber,
        paymentAttemptId: attempt.id,
        failureCode: verification.code,
      }),
    );

    return {
      orderId: attempt.orderId,
      attemptId: attempt.id,
      state: 'failed',
    };
  }

  private async resolveCurrentOutcome(paymentAttemptId: string): Promise<PaymentCallbackOutcome> {
    const attempt = await this.prisma.paymentAttempt.findUnique({
      where: {
        id: paymentAttemptId,
      },
      select: {
        id: true,
        orderId: true,
        status: true,
        order: {
          select: {
            status: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!attempt) {
      return {
        state: 'invalid',
      };
    }

    const identity = {
      orderId: attempt.orderId,
      attemptId: attempt.id,
    };

    if (
      attempt.status === PaymentAttemptStatus.VERIFIED ||
      attempt.order.status === OrderStatus.PAID ||
      attempt.order.paymentStatus === OrderPaymentStatus.PAID
    ) {
      return {
        ...identity,
        state: 'paid',
      };
    }

    if (attempt.status === PaymentAttemptStatus.CANCELLED) {
      return {
        ...identity,
        state: 'cancelled',
      };
    }

    if (
      attempt.status === PaymentAttemptStatus.FAILED ||
      attempt.status === PaymentAttemptStatus.EXPIRED
    ) {
      return {
        ...identity,
        state: 'failed',
      };
    }

    return {
      ...identity,
      state: 'pending',
    };
  }
}
