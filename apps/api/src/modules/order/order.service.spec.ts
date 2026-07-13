import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { OrderService } from './order.service.js';

describe('OrderService', () => {
  it('creates orders inside a serializable transaction', async () => {
    const transactionClient = {} as Prisma.TransactionClient;

    const prisma = {
      $transaction: jest.fn(async (callback: (tx: Prisma.TransactionClient) => unknown) =>
        callback(transactionClient),
      ),
    } as unknown as PrismaService;

    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;

    const service = new OrderService(prisma, configService);
    const expectedResult = {
      id: 'order-1',
    };

    const serviceInternals = service as unknown as {
      createFromCartInTransaction: (
        transaction: Prisma.TransactionClient,
        userId: string,
        dto: { shippingAddressId: string },
      ) => Promise<typeof expectedResult>;
    };

    const createInTransactionSpy = jest
      .spyOn(serviceInternals, 'createFromCartInTransaction')
      .mockResolvedValue(expectedResult);

    const result = await service.createFromCart('user-1', {
      shippingAddressId: 'address-1',
    });

    expect(result).toEqual(expectedResult);
    expect(createInTransactionSpy).toHaveBeenCalledWith(transactionClient, 'user-1', {
      shippingAddressId: 'address-1',
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('uses fifteen minutes when the payment TTL configuration is absent or invalid', () => {
    const prisma = {} as PrismaService;

    const configService = {
      get: jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce('0'),
    } as unknown as ConfigService;

    const service = new OrderService(prisma, configService);

    expect(
      (
        service as unknown as { getPaymentOrderTtlMinutes: () => number }
      ).getPaymentOrderTtlMinutes(),
    ).toBe(15);
    expect(
      (
        service as unknown as { getPaymentOrderTtlMinutes: () => number }
      ).getPaymentOrderTtlMinutes(),
    ).toBe(15);
  });
});
