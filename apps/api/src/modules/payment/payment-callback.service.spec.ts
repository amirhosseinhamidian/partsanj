import { jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import {
  OrderInventoryStatus,
  OrderPaymentStatus,
  OrderStatus,
  PaymentAttemptStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { PaymentCallbackService } from './payment-callback.service.js';
import { PaymentProviderRegistry } from './providers/payment-provider.registry.js';

type PrismaMock = {
  paymentAttempt: {
    findFirst: jest.Mock;
    updateMany: jest.Mock;
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
};

type TransactionMock = {
  paymentAttempt: {
    updateMany: jest.Mock;
  };
  order: {
    updateMany: jest.Mock;
  };
};

function createPrismaMock(transaction: TransactionMock): PrismaMock {
  return {
    paymentAttempt: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: TransactionMock) => unknown) =>
      callback(transaction),
    ),
  };
}

function createProviderMock() {
  return {
    parseCallback: jest.fn(),
    verifyPayment: jest.fn(),
  };
}

describe('PaymentCallbackService inventory lifecycle', () => {
  it('commits a reserved inventory exactly when payment verification succeeds', async () => {
    const transaction: TransactionMock = {
      paymentAttempt: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const prisma = createPrismaMock(transaction);
    const provider = createProviderMock();

    provider.parseCallback.mockReturnValue({
      kind: 'approved',
      providerSessionId: 'session-1',
      callbackMetadata: {
        status: 'ok',
      },
    });

    provider.verifyPayment.mockResolvedValue({
      kind: 'verified',
      providerReferenceId: 'reference-1',
      responseMetadata: {
        verified: true,
      },
    });

    prisma.paymentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      orderId: 'order-1',
      amountToman: 1_000_000,
      status: PaymentAttemptStatus.REDIRECTED,
      order: {
        id: 'order-1',
        orderNumber: 1001,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: OrderPaymentStatus.PENDING,
        inventoryStatus: OrderInventoryStatus.RESERVED,
      },
    });

    prisma.paymentAttempt.updateMany.mockResolvedValue({ count: 1 });

    const registry = {
      get: jest.fn().mockReturnValue(provider),
    } as unknown as PaymentProviderRegistry;

    const service = new PaymentCallbackService(prisma as unknown as PrismaService, registry);

    const result = await service.handleCallback('TEST' as never, { session: 'session-1' });

    expect(result).toEqual({
      orderId: 'order-1',
      attemptId: 'attempt-1',
      state: 'paid',
    });

    expect(transaction.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'order-1',
        status: OrderStatus.PENDING_PAYMENT,
        inventoryStatus: OrderInventoryStatus.RESERVED,
      },
      data: expect.objectContaining({
        status: OrderStatus.PAID,
        paymentStatus: OrderPaymentStatus.PAID,
        inventoryStatus: OrderInventoryStatus.COMMITTED,
        inventoryCommittedAt: expect.any(Date),
        paidAt: expect.any(Date),
      }),
    });
  });

  it('returns paid immediately for a repeated verified callback without changing inventory again', async () => {
    const transaction: TransactionMock = {
      paymentAttempt: {
        updateMany: jest.fn(),
      },
      order: {
        updateMany: jest.fn(),
      },
    };

    const prisma = createPrismaMock(transaction);
    const provider = createProviderMock();

    provider.parseCallback.mockReturnValue({
      kind: 'approved',
      providerSessionId: 'session-1',
      callbackMetadata: {},
    });

    prisma.paymentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      orderId: 'order-1',
      amountToman: 1_000_000,
      status: PaymentAttemptStatus.VERIFIED,
      order: {
        id: 'order-1',
        orderNumber: 1001,
        status: OrderStatus.PAID,
        paymentStatus: OrderPaymentStatus.PAID,
        inventoryStatus: OrderInventoryStatus.COMMITTED,
      },
    });

    const registry = {
      get: jest.fn().mockReturnValue(provider),
    } as unknown as PaymentProviderRegistry;

    const service = new PaymentCallbackService(prisma as unknown as PrismaService, registry);

    await expect(
      service.handleCallback('TEST' as never, { session: 'session-1' }),
    ).resolves.toEqual({
      orderId: 'order-1',
      attemptId: 'attempt-1',
      state: 'paid',
    });

    expect(provider.verifyPayment).not.toHaveBeenCalled();
    expect(prisma.paymentAttempt.updateMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a verified payment when the order reservation was already released', async () => {
    const transaction: TransactionMock = {
      paymentAttempt: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const prisma = createPrismaMock(transaction);
    const provider = createProviderMock();

    provider.parseCallback.mockReturnValue({
      kind: 'approved',
      providerSessionId: 'session-1',
      callbackMetadata: {},
    });

    provider.verifyPayment.mockResolvedValue({
      kind: 'verified',
      responseMetadata: {},
    });

    prisma.paymentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      orderId: 'order-1',
      amountToman: 1_000_000,
      status: PaymentAttemptStatus.CALLBACK_RECEIVED,
      order: {
        id: 'order-1',
        orderNumber: 1001,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: OrderPaymentStatus.PENDING,
        inventoryStatus: OrderInventoryStatus.RESERVED,
      },
    });

    const registry = {
      get: jest.fn().mockReturnValue(provider),
    } as unknown as PaymentProviderRegistry;

    const service = new PaymentCallbackService(prisma as unknown as PrismaService, registry);

    await expect(
      service.handleCallback('TEST' as never, { session: 'session-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not verify callbacks for expired or released orders', async () => {
    const transaction: TransactionMock = {
      paymentAttempt: {
        updateMany: jest.fn(),
      },
      order: {
        updateMany: jest.fn(),
      },
    };

    const prisma = createPrismaMock(transaction);
    const provider = createProviderMock();

    provider.parseCallback.mockReturnValue({
      kind: 'approved',
      providerSessionId: 'session-1',
      callbackMetadata: {},
    });

    prisma.paymentAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      orderId: 'order-1',
      amountToman: 1_000_000,
      status: PaymentAttemptStatus.REDIRECTED,
      order: {
        id: 'order-1',
        orderNumber: 1001,
        status: OrderStatus.EXPIRED,
        paymentStatus: OrderPaymentStatus.UNPAID,
        inventoryStatus: OrderInventoryStatus.RELEASED,
      },
    });

    const registry = {
      get: jest.fn().mockReturnValue(provider),
    } as unknown as PaymentProviderRegistry;

    const service = new PaymentCallbackService(prisma as unknown as PrismaService, registry);

    await expect(
      service.handleCallback('TEST' as never, { session: 'session-1' }),
    ).resolves.toEqual({
      orderId: 'order-1',
      attemptId: 'attempt-1',
      state: 'failed',
    });

    expect(provider.verifyPayment).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
