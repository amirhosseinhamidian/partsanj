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

type InventoryOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
};

type ExpireOrderOptions = {
  activePaymentGraceCutoff?: Date;
};

type AggregatedInventoryItem = {
  productId: string;
  productName: string;
  quantity: number;
};

export async function reserveOrderInventory(
  transaction: Prisma.TransactionClient,
  items: InventoryOrderItem[],
) {
  const aggregatedItems = aggregateInventoryItems(items);

  for (const item of aggregatedItems) {
    const result = await transaction.product.updateMany({
      where: {
        id: item.productId,
        status: ProductStatus.ACTIVE,
        isPublished: true,
        stockStatus: StockStatus.IN_STOCK,
        stockQuantity: {
          gte: item.quantity,
        },
      },
      data: {
        stockQuantity: {
          decrement: item.quantity,
        },
      },
    });

    if (result.count !== 1) {
      throw new ConflictException({
        code: 'ORDER_INSUFFICIENT_STOCK',
        message: `موجودی «${item.productName}» برای ثبت سفارش کافی نیست`,
        details: {
          productId: item.productId,
          requestedQuantity: item.quantity,
        },
      });
    }

    await transaction.product.updateMany({
      where: {
        id: item.productId,
        stockStatus: StockStatus.IN_STOCK,
        stockQuantity: 0,
      },
      data: {
        stockStatus: StockStatus.OUT_OF_STOCK,
      },
    });
  }
}

export async function expireOrderIfDue(
  transaction: Prisma.TransactionClient,
  orderId: string,
  expiredAt: Date,
  options: ExpireOrderOptions = {},
): Promise<boolean> {
  const expireResult = await transaction.order.updateMany({
    where: {
      id: orderId,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: {
        in: [OrderPaymentStatus.UNPAID, OrderPaymentStatus.PENDING, OrderPaymentStatus.FAILED],
      },
      expiresAt: {
        lte: expiredAt,
      },
      ...(options.activePaymentGraceCutoff
        ? {
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
                  lte: options.activePaymentGraceCutoff,
                },
              },
            ],
          }
        : {}),
    },
    data: {
      status: OrderStatus.EXPIRED,
      paymentStatus: OrderPaymentStatus.UNPAID,
    },
  });

  if (expireResult.count !== 1) {
    return false;
  }

  await releaseOrderInventory(transaction, orderId, expiredAt);

  await transaction.paymentAttempt.updateMany({
    where: {
      orderId,
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

  return true;
}

export async function releaseOrderInventory(
  transaction: Prisma.TransactionClient,
  orderId: string,
  releasedAt: Date,
): Promise<boolean> {
  const claimResult = await transaction.order.updateMany({
    where: {
      id: orderId,
      inventoryStatus: OrderInventoryStatus.RESERVED,
    },
    data: {
      inventoryStatus: OrderInventoryStatus.RELEASED,
      inventoryReleasedAt: releasedAt,
    },
  });

  if (claimResult.count !== 1) {
    return false;
  }

  const orderItems = await transaction.orderItem.findMany({
    where: {
      orderId,
    },
    select: {
      productId: true,
      productName: true,
      quantity: true,
    },
  });

  const aggregatedItems = aggregateInventoryItems(orderItems);

  for (const item of aggregatedItems) {
    await transaction.product.update({
      where: {
        id: item.productId,
      },
      data: {
        stockQuantity: {
          increment: item.quantity,
        },
      },
    });

    await transaction.product.updateMany({
      where: {
        id: item.productId,
        stockStatus: StockStatus.OUT_OF_STOCK,
        stockQuantity: {
          gt: 0,
        },
      },
      data: {
        stockStatus: StockStatus.IN_STOCK,
      },
    });
  }

  return true;
}

function aggregateInventoryItems(items: InventoryOrderItem[]): AggregatedInventoryItem[] {
  const itemsByProductId = new Map<string, AggregatedInventoryItem>();

  for (const item of items) {
    const current = itemsByProductId.get(item.productId);

    if (current) {
      current.quantity += item.quantity;
      continue;
    }

    itemsByProductId.set(item.productId, {
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
    });
  }

  return [...itemsByProductId.values()];
}
