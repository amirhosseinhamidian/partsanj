import {
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import {
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { Request, Response } from 'express';
import {
  lastValueFrom,
  of,
  throwError,
} from 'rxjs';

import { HttpLoggingInterceptor } from './http-logging.interceptor.js';

function createContext({
  method = 'POST',
  path = '/api/v1/orders',
  statusCode = 201,
}: {
  method?: string;
  path?: string;
  statusCode?: number;
} = {}) {
  const request = {
    method,
    originalUrl: `${path}?ignored=true`,
    url: `${path}?ignored=true`,
    path,
    baseUrl: '',
    route: {
      path,
    },
    requestId: 'req_test_123',
    user: {
      id: 'user_123',
    },
  } as unknown as Request;

  const response = {
    statusCode,
  } as Response;

  const context = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  return {
    context,
    request,
  };
}

describe('HttpLoggingInterceptor', () => {
  afterEach(() => {
    jest.restoreAllMocks();

    delete process.env.HTTP_LOG_ALL_REQUESTS;
    delete process.env.HTTP_SLOW_REQUEST_MS;
  });

  it('logs successful mutating requests', async () => {
    process.env.NODE_ENV = 'production';
    process.env.HTTP_LOG_ALL_REQUESTS = 'false';
    process.env.HTTP_SLOW_REQUEST_MS = '1000';

    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const interceptor =
      new HttpLoggingInterceptor();
    const { context, request } = createContext();

    await lastValueFrom(
      interceptor.intercept(context, {
        handle: () => of({ ok: true }),
      }),
    );

    expect(request.requestDurationMs).toEqual(
      expect.any(Number),
    );

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'http_request_completed',
        requestId: 'req_test_123',
        method: 'POST',
        path: '/api/v1/orders',
        statusCode: 201,
        userId: 'user_123',
      }),
    );

  });

  it('does not duplicate error logs', async () => {
    process.env.NODE_ENV = 'production';
    process.env.HTTP_LOG_ALL_REQUESTS = 'true';
    process.env.HTTP_SLOW_REQUEST_MS = '1000';

    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const interceptor =
      new HttpLoggingInterceptor();
    const { context, request } = createContext();

    await expect(
      lastValueFrom(
        interceptor.intercept(context, {
          handle: () =>
            throwError(
              () => new Error('test failure'),
            ),
        }),
      ),
    ).rejects.toThrow('test failure');

    expect(request.requestDurationMs).toEqual(
      expect.any(Number),
    );
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

  });

  it('skips the health endpoint', async () => {
    process.env.NODE_ENV = 'development';
    process.env.HTTP_LOG_ALL_REQUESTS = 'true';

    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const interceptor =
      new HttpLoggingInterceptor();
    const { context } = createContext({
      method: 'GET',
      path: '/api/v1/health',
      statusCode: 200,
    });

    await lastValueFrom(
      interceptor.intercept(context, {
        handle: () => of({ status: 'ok' }),
      }),
    );

    expect(logSpy).not.toHaveBeenCalled();

  });
});
