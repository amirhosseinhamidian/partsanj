import { ArgumentsHost, BadRequestException, ConflictException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';
import type { Request, Response } from 'express';

import { AllExceptionsFilter } from './all-exceptions.filter.js';

type TestContext = {
  host: ArgumentsHost;
  status: ReturnType<typeof jest.fn>;
  json: ReturnType<typeof jest.fn>;
  setHeader: ReturnType<typeof jest.fn>;
};

function createTestContext(): TestContext {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({
    json,
  });
  const setHeader = jest.fn();

  const request = {
    method: 'POST',
    path: '/api/v1/orders',
    originalUrl: '/api/v1/orders?secret=value',
    url: '/api/v1/orders?secret=value',
    header: jest
      .fn()
      .mockImplementation((name: string) =>
        name.toLowerCase() === 'x-request-id' ? 'req_test_123' : undefined,
      ),
    user: {
      id: 'user_123',
    },
  } as unknown as Request;

  const response = {
    headersSent: false,
    status,
    json,
    setHeader,
  } as unknown as Response;

  const host = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return {
    host,
    status,
    json,
    setHeader,
  };
}

describe('AllExceptionsFilter', () => {
  it('preserves business exception code and message', () => {
    const filter = new AllExceptionsFilter();
    const context = createTestContext();

    filter.catch(
      new ConflictException({
        code: 'ORDER_ALREADY_PAID',
        message: 'این سفارش قبلاً پرداخت شده است',
      }),
      context.host,
    );

    expect(context.status).toHaveBeenCalledWith(409);

    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        code: 'ORDER_ALREADY_PAID',
        message: 'این سفارش قبلاً پرداخت شده است',
        requestId: 'req_test_123',
        path: '/api/v1/orders',
      }),
    );
  });

  it('normalizes validation errors', () => {
    const filter = new AllExceptionsFilter();
    const context = createTestContext();

    filter.catch(
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: ['quantity must not be less than 1', 'addressId must be a UUID'],
      }),
      context.host,
    );

    expect(context.status).toHaveBeenCalledWith(400);

    expect(context.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'اطلاعات ارسال‌شده معتبر نیست.',
        details: {
          errors: ['quantity must not be less than 1', 'addressId must be a UUID'],
        },
      }),
    );
  });

  it('does not expose unexpected error details', () => {
    const filter = new AllExceptionsFilter();
    const context = createTestContext();

    filter.catch(
      new Error('DATABASE_URL=postgresql://secret-user:secret-pass@host/db'),
      context.host,
    );

    expect(context.status).toHaveBeenCalledWith(500);

    const responseBody = context.json.mock.calls[0]?.[0];

    expect(responseBody).toEqual(
      expect.objectContaining({
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.',
      }),
    );

    expect(JSON.stringify(responseBody)).not.toContain('secret-pass');
  });

  it('returns request id in response headers', () => {
    const filter = new AllExceptionsFilter();
    const context = createTestContext();

    filter.catch(new BadRequestException('درخواست نامعتبر است'), context.host);

    expect(context.setHeader).toHaveBeenCalledWith('x-request-id', 'req_test_123');

    expect(context.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');
  });
});
