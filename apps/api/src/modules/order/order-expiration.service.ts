import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderPaymentStatus, OrderStatus } from '../../generated/prisma/client.js';

import {
  createErrorDetails,
  createLogContext,
} from '../../common/logging/logging.utils.js';
import { captureServerException } from '../../common/monitoring/sentry-monitoring.js';
import { PrismaService } from '../database/prisma.service.js';
import { expireOrderIfDue } from './order-inventory.utils.js';

const DEFAULT_SWEEP_INTERVAL_MS = 60_000;
const DEFAULT_SWEEP_BATCH_SIZE = 100;
const DEFAULT_PAYMENT_CALLBACK_GRACE_MINUTES = 10;

@Injectable()
export class OrderExpirationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpirationService.name);
  private sweepTimer: ReturnType<typeof setInterval> | null = null;
  private isSweepRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMs = this.getSweepIntervalMs();

    this.logger.log(
      createLogContext('order_expiration_sweeper_started', {
        intervalMs,
        batchSize: this.getSweepBatchSize(),
        paymentCallbackGraceMinutes: this.getPaymentCallbackGraceMinutes(),
      }),
    );

    void this.expireDueOrders();

    this.sweepTimer = setInterval(() => {
      void this.expireDueOrders();
    }, intervalMs);

    this.sweepTimer.unref();
  }

  onModuleDestroy() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }

    this.logger.log(
      createLogContext('order_expiration_sweeper_stopped'),
    );
  }

  private async expireDueOrders() {
    if (this.isSweepRunning) {
      return;
    }

    this.isSweepRunning = true;

    try {
      const now = new Date();
      const activePaymentGraceCutoff = new Date(
        now.getTime() - this.getPaymentCallbackGraceMinutes() * 60_000,
      );

      const orders = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: {
            in: [OrderPaymentStatus.UNPAID, OrderPaymentStatus.PENDING, OrderPaymentStatus.FAILED],
          },
          expiresAt: {
            lte: now,
          },
        },
        orderBy: {
          expiresAt: 'asc',
        },
        take: this.getSweepBatchSize(),
        select: {
          id: true,
        },
      });

      let expiredCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const order of orders) {
        try {
          const expired = await this.prisma.$transaction((transaction) =>
            expireOrderIfDue(transaction, order.id, now, {
              activePaymentGraceCutoff,
            }),
          );

          if (expired) {
            expiredCount += 1;

            this.logger.log(
              createLogContext('order_expired', {
                orderId: order.id,
              }),
            );
          } else {
            skippedCount += 1;
          }
        } catch (error) {
          failedCount += 1;

          this.logger.error(
            createLogContext('order_expiration_failed', {
              orderId: order.id,
              error: createErrorDetails(error),
            }),
          );

          captureServerException(error, {
            event: 'order_expiration_failed',
            context: {
              orderId: order.id,
            },
          });
        }
      }

      if (orders.length > 0) {
        this.logger.log(
          createLogContext('order_expiration_sweep_completed', {
            candidateCount: orders.length,
            expiredCount,
            skippedCount,
            failedCount,
          }),
        );
      }
    } catch (error) {
      this.logger.error(
        createLogContext('order_expiration_sweep_failed', {
          error: createErrorDetails(error),
        }),
      );

      captureServerException(error, {
        event: 'order_expiration_sweep_failed',
      });
    } finally {
      this.isSweepRunning = false;
    }
  }

  private getSweepIntervalMs() {
    return this.getPositiveIntegerConfig(
      'ORDER_EXPIRATION_SWEEP_INTERVAL_MS',
      DEFAULT_SWEEP_INTERVAL_MS,
    );
  }

  private getSweepBatchSize() {
    return this.getPositiveIntegerConfig(
      'ORDER_EXPIRATION_SWEEP_BATCH_SIZE',
      DEFAULT_SWEEP_BATCH_SIZE,
    );
  }

  private getPaymentCallbackGraceMinutes() {
    return this.getPositiveIntegerConfig(
      'PAYMENT_CALLBACK_GRACE_MINUTES',
      DEFAULT_PAYMENT_CALLBACK_GRACE_MINUTES,
    );
  }

  private getPositiveIntegerConfig(key: string, fallback: number) {
    const rawValue = this.configService.get<string>(key)?.trim();

    if (!rawValue) {
      return fallback;
    }

    const value = Number(rawValue);

    return Number.isSafeInteger(value) && value > 0 ? value : fallback;
  }
}
