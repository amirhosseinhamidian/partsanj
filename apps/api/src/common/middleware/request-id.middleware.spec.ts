import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { requestIdMiddleware } from './request-id.middleware.js';

function createResponse() {
  return {
    setHeader: jest.fn(),
  } as unknown as Response;
}

describe('requestIdMiddleware', () => {
  it('preserves a valid incoming request id', () => {
    const request = {
      headers: {
        'x-request-id': 'req_test_123',
      },
    } as unknown as Request;

    const response = createResponse();
    const next = jest.fn() as unknown as NextFunction;

    requestIdMiddleware(request, response, next);

    expect(request.requestId).toBe('req_test_123');
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'req_test_123',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a request id when the header is missing', () => {
    const request = {
      headers: {},
    } as unknown as Request;

    const response = createResponse();
    const next = jest.fn() as unknown as NextFunction;

    requestIdMiddleware(request, response, next);

    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      request.requestId,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('replaces an invalid incoming request id', () => {
    const request = {
      headers: {
        'x-request-id': 'invalid request id\nlog injection',
      },
    } as unknown as Request;

    const response = createResponse();
    const next = jest.fn() as unknown as NextFunction;

    requestIdMiddleware(request, response, next);

    expect(request.requestId).not.toBe(
      'invalid request id\nlog injection',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
