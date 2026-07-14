import {
  OrderSmsType,
} from '../../generated/prisma/client.js';
import type { SendLookupSmsInput } from './kavenegar-transactional-sms.service.js';

export type OrderSmsTemplateSource = {
  orderNumber: number;
  payableToman: number;
  shippingRecipientMobile: string;
  shippingCarrier: string | null;
  trackingCode: string | null;
};

type TemplateNames = {
  paymentReminder: string;
  paymentSuccess: string;
  orderShipped: string;
  adminNewPaidOrder: string;
};

export function createOrderSmsLookupInput(
  type: OrderSmsType,
  recipient: string,
  order: OrderSmsTemplateSource,
  templates: TemplateNames,
): SendLookupSmsInput {
  switch (type) {
    case OrderSmsType.CUSTOMER_PAYMENT_REMINDER:
      return {
        recipient,
        template:
          templates.paymentReminder,
        token: toLookupToken(
          order.orderNumber,
        ),
      };

    case OrderSmsType.CUSTOMER_PAYMENT_SUCCESS:
      return {
        recipient,
        template:
          templates.paymentSuccess,
        token: toLookupToken(
          order.orderNumber,
        ),
        token2: toLookupToken(
          order.payableToman,
        ),
      };

    case OrderSmsType.CUSTOMER_ORDER_SHIPPED:
      return {
        recipient,
        template: templates.orderShipped,
        token: toLookupToken(
          order.orderNumber,
        ),
        token2: toLookupToken(
          order.trackingCode ??
            'بدون-کد-رهگیری',
        ),
      };

    case OrderSmsType.ADMIN_NEW_PAID_ORDER:
      return {
        recipient,
        template:
          templates.adminNewPaidOrder,
        token: toLookupToken(
          order.orderNumber,
        ),
        token2: toLookupToken(
          order.payableToman,
        ),
        token3: toLookupToken(
          order.shippingRecipientMobile,
        ),
      };
  }
}

export function toLookupToken(
  value: string | number,
): string {
  const normalized = String(value)
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 100);

  return normalized || '-';
}
