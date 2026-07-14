import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  OrderSmsType,
  Prisma,
  SmsOutboxStatus,
} from '../../generated/prisma/client.js';

type SmsTransaction = Pick<
  Prisma.TransactionClient,
  'order' | 'orderSmsOutbox'
>;

type EnqueuePaymentReminderInput = {
  orderId: string;
  recipient: string;
  createdAt: Date;
};

@Injectable()
export class OrderSmsOutboxService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  async enqueuePaymentReminder(
    transaction: SmsTransaction,
    input: EnqueuePaymentReminderInput,
  ): Promise<void> {
    const dueAt = new Date(
      input.createdAt.getTime() +
        this.getReminderDelayMinutes() *
          60_000,
    );

    await transaction.orderSmsOutbox.createMany({
      data: [
        {
          orderId: input.orderId,
          type: OrderSmsType.CUSTOMER_PAYMENT_REMINDER,
          recipient: input.recipient,
          dueAt,
        },
      ],
      skipDuplicates: true,
    });
  }

  async enqueuePaymentSucceeded(
    transaction: SmsTransaction,
    orderId: string,
  ): Promise<void> {
    const order =
      await transaction.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          shippingRecipientMobile: true,
        },
      });

    if (!order) {
      throw new Error(
        `Order ${orderId} was not found while enqueueing payment SMS`,
      );
    }

    const dueAt = new Date();

    const rows: Prisma.OrderSmsOutboxCreateManyInput[] =
      [
        {
          orderId,
          type: OrderSmsType.CUSTOMER_PAYMENT_SUCCESS,
          recipient:
            order.shippingRecipientMobile,
          dueAt,
        },
        ...this.getAdminMobiles().map(
          (
            recipient,
          ): Prisma.OrderSmsOutboxCreateManyInput => ({
            orderId,
            type: OrderSmsType.ADMIN_NEW_PAID_ORDER,
            recipient,
            dueAt,
          }),
        ),
      ];

    await transaction.orderSmsOutbox.createMany({
      data: rows,
      skipDuplicates: true,
    });

    await transaction.orderSmsOutbox.updateMany({
      where: {
        orderId,
        type: OrderSmsType.CUSTOMER_PAYMENT_REMINDER,
        status: {
          in: [
            SmsOutboxStatus.PENDING,
            SmsOutboxStatus.FAILED,
            SmsOutboxStatus.PROCESSING,
          ],
        },
      },
      data: {
        status: SmsOutboxStatus.CANCELLED,
        lockedAt: null,
        lastError:
          'Order was paid before reminder delivery',
      },
    });
  }

  async enqueueOrderShipped(
    transaction: SmsTransaction,
    orderId: string,
  ): Promise<void> {
    const order =
      await transaction.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          shippingRecipientMobile: true,
        },
      });

    if (!order) {
      throw new Error(
        `Order ${orderId} was not found while enqueueing shipment SMS`,
      );
    }

    await transaction.orderSmsOutbox.createMany({
      data: [
        {
          orderId,
          type: OrderSmsType.CUSTOMER_ORDER_SHIPPED,
          recipient:
            order.shippingRecipientMobile,
          dueAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });
  }

  private getReminderDelayMinutes(): number {
    return this.getPositiveInteger(
      'ORDER_SMS_REMINDER_DELAY_MINUTES',
      7,
    );
  }

  private getAdminMobiles(): string[] {
    const rawValue =
      this.configService.get<string>(
        'ORDER_SMS_ADMIN_MOBILES',
      ) ?? '';

    return [
      ...new Set(
        rawValue
          .split(',')
          .map((value) => value.trim())
          .filter((value) =>
            /^09\d{9}$/.test(value),
          ),
      ),
    ];
  }

  private getPositiveInteger(
    key: string,
    fallback: number,
  ): number {
    const value = Number(
      this.configService.get<string>(key),
    );

    return Number.isSafeInteger(value) &&
      value > 0
      ? value
      : fallback;
  }
}
