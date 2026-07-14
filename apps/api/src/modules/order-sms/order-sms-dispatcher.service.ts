import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  OrderPaymentStatus,
  OrderSmsType,
  OrderStatus,
  SmsOutboxStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { KavenegarTransactionalSmsService } from './kavenegar-transactional-sms.service.js';
import { createOrderSmsLookupInput } from './order-sms-template.js';

const DEFAULT_SWEEP_INTERVAL_MS = 30_000;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_LOCK_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_ATTEMPTS = 5;

@Injectable()
export class OrderSmsDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderSmsDispatcherService.name);

  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  private isSweepRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly kavenegar: KavenegarTransactionalSmsService,
  ) {}

  onModuleInit(): void {
    if (!this.isWorkerEnabled()) {
      this.logger.warn({
        event: 'order_sms_worker_disabled',
      });
      return;
    }

    void this.dispatchDueMessages();

    this.sweepTimer = setInterval(() => {
      void this.dispatchDueMessages();
    }, this.getSweepIntervalMs());

    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  private async dispatchDueMessages(): Promise<void> {
    if (this.isSweepRunning) {
      return;
    }

    this.isSweepRunning = true;

    try {
      const now = new Date();
      const staleLockBefore = new Date(now.getTime() - this.getLockTimeoutMs());

      const candidates = await this.prisma.orderSmsOutbox.findMany({
        where: {
          dueAt: {
            lte: now,
          },
          attempts: {
            lt: this.getMaxAttempts(),
          },
          status: {
            in: [SmsOutboxStatus.PENDING, SmsOutboxStatus.FAILED, SmsOutboxStatus.PROCESSING],
          },
          OR: [
            {
              lockedAt: null,
            },
            {
              lockedAt: {
                lte: staleLockBefore,
              },
            },
          ],
        },
        orderBy: [
          {
            dueAt: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
        take: this.getBatchSize(),
        select: {
          id: true,
        },
      });

      for (const candidate of candidates) {
        await this.processCandidate(candidate.id, now, staleLockBefore);
      }
    } catch (error) {
      this.logger.error({
        event: 'order_sms_sweep_failed',
        error: this.createErrorDetails(error),
      });
    } finally {
      this.isSweepRunning = false;
    }
  }

  private async processCandidate(id: string, now: Date, staleLockBefore: Date): Promise<void> {
    const claim = await this.prisma.orderSmsOutbox.updateMany({
      where: {
        id,
        attempts: {
          lt: this.getMaxAttempts(),
        },
        status: {
          in: [SmsOutboxStatus.PENDING, SmsOutboxStatus.FAILED, SmsOutboxStatus.PROCESSING],
        },
        OR: [
          {
            lockedAt: null,
          },
          {
            lockedAt: {
              lte: staleLockBefore,
            },
          },
        ],
      },
      data: {
        status: SmsOutboxStatus.PROCESSING,
        lockedAt: now,
        attempts: {
          increment: 1,
        },
      },
    });

    if (claim.count !== 1) {
      return;
    }

    const message = await this.prisma.orderSmsOutbox.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        orderId: true,
        type: true,
        recipient: true,
        attempts: true,
        order: {
          select: {
            orderNumber: true,
            payableToman: true,
            shippingRecipientMobile: true,
            shippingCarrier: true,
            trackingCode: true,
            status: true,
            paymentStatus: true,
            expiresAt: true,
            paymentAttempts: {
              select: {
                redirectedAt: true,
                callbackReceivedAt: true,
                verifiedAt: true,
                cancelledAt: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return;
    }

    if (
      message.type === OrderSmsType.CUSTOMER_PAYMENT_REMINDER &&
      !this.canSendPaymentReminder(message.order, new Date())
    ) {
      await this.prisma.orderSmsOutbox.update({
        where: {
          id: message.id,
        },
        data: {
          status: SmsOutboxStatus.CANCELLED,
          lockedAt: null,
          lastError: 'Order is no longer eligible for payment reminder',
        },
      });

      return;
    }

    try {
      const input = createOrderSmsLookupInput(
        message.type,
        message.recipient,
        message.order,
        this.getTemplateNames(),
      );

      const result = await this.kavenegar.sendLookup(input);

      await this.prisma.orderSmsOutbox.update({
        where: {
          id: message.id,
        },
        data: {
          status: SmsOutboxStatus.SENT,
          providerMessageId: result.providerMessageId ?? null,
          sentAt: new Date(),
          lockedAt: null,
          lastError: null,
        },
      });

      this.logger.log({
        event: 'order_sms_sent',
        orderId: message.orderId,
        smsType: message.type,
        recipient: this.maskMobile(message.recipient),
        providerMessageId: result.providerMessageId,
      });
    } catch (error) {
      await this.prisma.orderSmsOutbox.update({
        where: {
          id: message.id,
        },
        data: {
          status: SmsOutboxStatus.FAILED,
          lockedAt: null,
          lastError: this.getErrorMessage(error).slice(0, 500),
        },
      });

      this.logger.error({
        event: 'order_sms_delivery_failed',
        orderId: message.orderId,
        smsType: message.type,
        recipient: this.maskMobile(message.recipient),
        attempt: message.attempts,
        error: this.createErrorDetails(error),
      });
    }
  }

  private canSendPaymentReminder(
    order: {
      status: OrderStatus;
      paymentStatus: OrderPaymentStatus;
      expiresAt: Date | null;
      paymentAttempts: Array<{
        redirectedAt: Date | null;
        callbackReceivedAt: Date | null;
        verifiedAt: Date | null;
        cancelledAt: Date | null;
      }>;
    },
    now: Date,
  ): boolean {
    if (
      order.status !== OrderStatus.PENDING_PAYMENT ||
      !(
        order.paymentStatus === OrderPaymentStatus.UNPAID ||
        order.paymentStatus === OrderPaymentStatus.FAILED
      )
    ) {
      return false;
    }

    if (order.expiresAt && order.expiresAt.getTime() <= now.getTime()) {
      return false;
    }

    const hasGoneToGateway = order.paymentAttempts.some((attempt) =>
      Boolean(
        attempt.redirectedAt ||
        attempt.callbackReceivedAt ||
        attempt.verifiedAt ||
        attempt.cancelledAt,
      ),
    );

    return !hasGoneToGateway;
  }

  private getTemplateNames() {
    return {
      paymentReminder: this.configService.getOrThrow<string>(
        'KAVENEGAR_ORDER_PAYMENT_REMINDER_TEMPLATE',
      ),
      paymentSuccess: this.configService.getOrThrow<string>(
        'KAVENEGAR_ORDER_PAYMENT_SUCCESS_TEMPLATE',
      ),
      orderShipped: this.configService.getOrThrow<string>('KAVENEGAR_ORDER_SHIPPED_TEMPLATE'),
      adminNewPaidOrder: this.configService.getOrThrow<string>(
        'KAVENEGAR_ADMIN_NEW_PAID_ORDER_TEMPLATE',
      ),
    };
  }

  private isWorkerEnabled(): boolean {
    const value = this.configService.get<string>('ORDER_SMS_WORKER_ENABLED')?.trim().toLowerCase();

    return value !== 'false';
  }

  private getSweepIntervalMs(): number {
    return this.getPositiveInteger('ORDER_SMS_SWEEP_INTERVAL_MS', DEFAULT_SWEEP_INTERVAL_MS);
  }

  private getBatchSize(): number {
    return this.getPositiveInteger('ORDER_SMS_SWEEP_BATCH_SIZE', DEFAULT_BATCH_SIZE);
  }

  private getLockTimeoutMs(): number {
    return this.getPositiveInteger('ORDER_SMS_LOCK_TIMEOUT_MS', DEFAULT_LOCK_TIMEOUT_MS);
  }

  private getMaxAttempts(): number {
    return this.getPositiveInteger('ORDER_SMS_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS);
  }

  private getPositiveInteger(key: string, fallback: number): number {
    const value = Number(this.configService.get<string>(key));

    return Number.isSafeInteger(value) && value > 0 ? value : fallback;
  }

  private maskMobile(mobile: string): string {
    if (mobile.length < 7) {
      return '***';
    }

    return `${mobile.slice(0, 4)}***${mobile.slice(-4)}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown SMS delivery error';
  }

  private createErrorDetails(error: unknown): Record<string, unknown> {
    if (!(error instanceof Error)) {
      return {
        name: 'UnknownError',
      };
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
}
