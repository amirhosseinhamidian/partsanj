import * as Sentry from '@sentry/nestjs';

import { getRequestId } from '../request-context/request-context.js';

type SentryTagValue =
  | string
  | number
  | boolean
  | null
  | undefined;

type CaptureServerExceptionOptions = {
  event: string;
  level?: 'fatal' | 'error' | 'warning';
  requestId?: string;
  tags?: Record<string, SentryTagValue>;
  context?: Record<string, unknown>;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown server exception');
}

export function captureServerException(
  error: unknown,
  options: CaptureServerExceptionOptions,
): string {
  const requestId =
    options.requestId ?? getRequestId();

  return Sentry.withScope((scope) => {
    scope.setLevel(options.level ?? 'error');
    scope.setTag('service', 'partsanj-api');
    scope.setTag('event', options.event);

    if (requestId) {
      scope.setTag('request_id', requestId);
    }

    for (const [key, value] of Object.entries(
      options.tags ?? {},
    )) {
      if (value !== undefined && value !== null) {
        scope.setTag(key, String(value));
      }
    }

    scope.setContext('partsanj', {
      ...(requestId
        ? {
            requestId,
          }
        : {}),
      ...(options.context ?? {}),
    });

    return Sentry.captureException(
      normalizeError(error),
    );
  });
}
