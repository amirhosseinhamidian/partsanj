import { randomUUID } from 'node:crypto';

import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  normalizeRequestId,
  REQUEST_ID_HEADER,
} from '../http/request-id.js';

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const requestId =
    normalizeRequestId(request.headers[REQUEST_ID_HEADER]) ??
    randomUUID();

  request.requestId = requestId;

  // سایر بخش‌های برنامه نیز در صورت خواندن header،
  // همان شناسه نهایی را دریافت می‌کنند.
  request.headers[REQUEST_ID_HEADER] = requestId;

  // شناسه در تمام پاسخ‌ها، حتی پاسخ‌های موفق، برگردانده می‌شود.
  response.setHeader(REQUEST_ID_HEADER, requestId);

  next();
}
