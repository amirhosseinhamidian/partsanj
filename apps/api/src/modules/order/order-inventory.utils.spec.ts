import { jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import {
  OrderInventoryStatus,
  OrderPaymentStatus,
  OrderStatus,
  PaymentAttemptStatus,
  Prisma,
  ProductStatus,
  StockStatus,
} from '../../generated/prisma/client.js';
import {
  expireOrderIfDue,
  releaseOrderInventory,
  reserveOrderInventory,
} from './order-inventory.utils.js';

type TransactionMock = {
  product: {
    updateMany: jest.Mock;
    update: jest.Mock;
  };
  order: {
    updateMany: jest.Mock;
  };
  orderItem: {
    findMany: jest.Mock;
  };
  paymentAttempt: {
    updateMany: jest.Mock;
  };
};

function createTransactionMock(): TransactionMock {
  return {
    product: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    order: {
      updateMany: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
    paymentAttempt: {
      updateMany: jest.fn(),
    },
  };
}

function asTransaction(mock: TransactionMock): Prisma.TransactionClient {
  return mock as unknown as Prisma.TransactionClient;
}

describe('order inventory utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reserveOrderInventory', () => {
    it('aggregates duplicate product items and reserves their total quantity', async () => {
      const transaction = createTransactionMock();

      transaction.product.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });

      await reserveOrderInventory(asTransaction(transaction), [
        {
          productId: 'product-1',
          productName: 'لنت ترمز',
          quantity: 2,
        },
        {
          productId: 'product-1',
          productName: 'لنت ترمز',
          quantity: 3,
        },
      ]);

      expect(transaction.product.updateMany).toHaveBeenCalledTimes(2);

      expect(transaction.product.updateMany).toHaveBeenNthCalledWith(1, {
        where: {
          id: 'product-1',
          status: ProductStatus.ACTIVE,
          isPublished: true,
          stockStatus: StockStatus.IN_STOCK,
          stockQuantity: {
            gte: 5,
          },
        },
        data: {
          stockQuantity: {
            decrement: 5,
          },
        },
      });

      expect(transaction.product.updateMany).toHaveBeenNthCalledWith(2, {
        where: {
          id: 'product-1',
          stockStatus: StockStatus.IN_STOCK,
          stockQuantity: 0,
        },
        data: {
          stockStatus: StockStatus.OUT_OF_STOCK,
        },
      });
    });

    it('rejects the reservation when the conditional stock update does not match', async () => {
      const transaction = createTransactionMock();

      transaction.product.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        reserveOrderInventory(asTransaction(transaction), [
          {
            productId: 'product-1',
            productName: 'فیلتر روغن',
            quantity: 4,
          },
        ]),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(transaction.product.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('releaseOrderInventory', () => {
    it('releases a reserved order exactly once and restores aggregated quantities', async () => {
      const transaction = createTransactionMock();
      const releasedAt = new Date('2026-07-13T10:00:00.000Z');

      transaction.order.updateMany.mockResolvedValueOnce({ count: 1 });
      transaction.orderItem.findMany.mockResolvedValueOnce([
        {
          productId: 'product-1',
          productName: 'لنت ترمز',
          quantity: 2,
        },
        {
          productId: 'product-1',
          productName: 'لنت ترمز',
          quantity: 1,
        },
      ]);
      transaction.product.update.mockResolvedValueOnce({ id: 'product-1' });
      transaction.product.updateMany.mockResolvedValueOnce({ count: 1 });

      const released = await releaseOrderInventory(
        asTransaction(transaction),
        'order-1',
        releasedAt,
      );

      expect(released).toBe(true);

      expect(transaction.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'order-1',
          inventoryStatus: OrderInventoryStatus.RESERVED,
        },
        data: {
          inventoryStatus: OrderInventoryStatus.RELEASED,
          inventoryReleasedAt: releasedAt,
        },
      });

      expect(transaction.product.update).toHaveBeenCalledTimes(1);
      expect(transaction.product.update).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
        },
        data: {
          stockQuantity: {
            increment: 3,
          },
        },
      });

      expect(transaction.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          stockStatus: StockStatus.OUT_OF_STOCK,
          stockQuantity: {
            gt: 0,
          },
        },
        data: {
          stockStatus: StockStatus.IN_STOCK,
        },
      });
    });

    it('does not restore stock when the reservation was already released or committed', async () => {
      const transaction = createTransactionMock();

      transaction.order.updateMany.mockResolvedValueOnce({ count: 0 });

      const released = await releaseOrderInventory(
        asTransaction(transaction),
        'order-1',
        new Date(),
      );

      expect(released).toBe(false);
      expect(transaction.orderItem.findMany).not.toHaveBeenCalled();
      expect(transaction.product.update).not.toHaveBeenCalled();
      expect(transaction.product.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('expireOrderIfDue', () => {
    it('expires an unpaid order, releases its inventory and expires active payment attempts', async () => {
      const transaction = createTransactionMock();
      const expiredAt = new Date('2026-07-13T10:30:00.000Z');
      const graceCutoff = new Date('2026-07-13T10:20:00.000Z');

      transaction.order.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 1 });

      transaction.orderItem.findMany.mockResolvedValueOnce([
        {
          productId: 'product-1',
          productName: 'فیلتر هوا',
          quantity: 2,
        },
      ]);

      transaction.product.update.mockResolvedValueOnce({ id: 'product-1' });
      transaction.product.updateMany.mockResolvedValueOnce({ count: 1 });
      transaction.paymentAttempt.updateMany.mockResolvedValueOnce({ count: 1 });

      const expired = await expireOrderIfDue(asTransaction(transaction), 'order-1', expiredAt, {
        activePaymentGraceCutoff: graceCutoff,
      });

      expect(expired).toBe(true);

      expect(transaction.order.updateMany).toHaveBeenNthCalledWith(1, {
        where: {
          id: 'order-1',
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: {
            in: [OrderPaymentStatus.UNPAID, OrderPaymentStatus.PENDING, OrderPaymentStatus.FAILED],
          },
          expiresAt: {
            lte: expiredAt,
          },
          OR: [
            {
              paymentAttempts: {
                none: {
                  status: {
                    in: [
                      PaymentAttemptStatus.CREATED,
                      PaymentAttemptStatus.REDIRECTED,
                      PaymentAttemptStatus.CALLBACK_RECEIVED,
                    ],
                  },
                },
              },
            },
            {
              expiresAt: {
                lte: graceCutoff,
              },
            },
          ],
        },
        data: {
          status: OrderStatus.EXPIRED,
          paymentStatus: OrderPaymentStatus.UNPAID,
        },
      });

      expect(transaction.paymentAttempt.updateMany).toHaveBeenCalledWith({
        where: {
          orderId: 'order-1',
          status: {
            in: [
              PaymentAttemptStatus.CREATED,
              PaymentAttemptStatus.REDIRECTED,
              PaymentAttemptStatus.CALLBACK_RECEIVED,
            ],
          },
        },
        data: {
          status: PaymentAttemptStatus.EXPIRED,
        },
      });
    });

    it('does nothing when another process has already changed the order state', async () => {
      const transaction = createTransactionMock();

      transaction.order.updateMany.mockResolvedValueOnce({ count: 0 });

      const expired = await expireOrderIfDue(asTransaction(transaction), 'order-1', new Date());

      expect(expired).toBe(false);
      expect(transaction.orderItem.findMany).not.toHaveBeenCalled();
      expect(transaction.paymentAttempt.updateMany).not.toHaveBeenCalled();
    });
  });
});
