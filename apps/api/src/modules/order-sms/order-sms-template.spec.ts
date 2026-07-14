import {
  describe,
  expect,
  it,
} from '@jest/globals';

import { OrderSmsType } from '../../generated/prisma/client.js';
import {
  createOrderSmsLookupInput,
  toLookupToken,
} from './order-sms-template.js';

const templates = {
  paymentReminder: 'order-reminder',
  paymentSuccess: 'order-paid',
  orderShipped: 'order-shipped',
  adminNewPaidOrder: 'admin-order-paid',
};

const order = {
  orderNumber: 123456,
  payableToman: 1250000,
  shippingRecipientMobile: '09123456789',
  shippingCarrier: 'پست پیشتاز',
  trackingCode: 'TRACK-123',
};

describe('order SMS templates', () => {
  it('removes spaces from lookup tokens', () => {
    expect(
      toLookupToken('پست پیشتاز'),
    ).toBe('پست-پیشتاز');
  });

  it('builds payment-success tokens', () => {
    expect(
      createOrderSmsLookupInput(
        OrderSmsType.CUSTOMER_PAYMENT_SUCCESS,
        '09123456789',
        order,
        templates,
      ),
    ).toEqual({
      recipient: '09123456789',
      template: 'order-paid',
      token: '123456',
      token2: '1250000',
    });
  });

  it('builds admin notification tokens', () => {
    expect(
      createOrderSmsLookupInput(
        OrderSmsType.ADMIN_NEW_PAID_ORDER,
        '09999999999',
        order,
        templates,
      ),
    ).toEqual({
      recipient: '09999999999',
      template: 'admin-order-paid',
      token: '123456',
      token2: '1250000',
      token3: '09123456789',
    });
  });
});
