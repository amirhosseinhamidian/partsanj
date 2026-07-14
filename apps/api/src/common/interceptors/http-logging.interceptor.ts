import { performance } from 'node:perf_hooks';

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { createLogContext } from '../logging/logging.utils.js';

type RequestWithUser = Request & {
  user?: {
    id?: unknown;
    userId?: unknown;
    sub?: unknown;
  };
};

const MUTATING_METHODS = new Set([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

const EXCLUDED_PATHS = new Set([
  '/api/v1/health',
  '/api/v1/health/live',
  '/api/v1/health/ready',
]);

@Injectable()
export class HttpLoggingInterceptor
  implements NestInterceptor
{
  private readonly logger = new Logger(
    HttpLoggingInterceptor.name,
  );

  private readonly isProduction =
    process.env.NODE_ENV === 'production';

  private readonly logAllRequests =
    this.resolveBooleanEnvironmentValue(
      process.env.HTTP_LOG_ALL_REQUESTS,
      !this.isProduction,
    );

  private readonly slowRequestThresholdMs =
    this.resolvePositiveInteger(
      process.env.HTTP_SLOW_REQUEST_MS,
      1_000,
    );

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request =
      httpContext.getRequest<RequestWithUser>();
    const response = httpContext.getResponse<Response>();

    const startedAt = performance.now();
    let responseLogged = false;

    return next.handle().pipe(
      tap({
        next: () => {
          if (responseLogged) {
            return;
          }

          responseLogged = true;

          const durationMs =
            this.resolveDurationMs(startedAt);

          request.requestDurationMs = durationMs;

          this.logCompletedRequest(
            request,
            response,
            durationMs,
          );
        },

        /**
         * خطا را اینجا log نمی‌کنیم؛
         * Global Exception Filter آن را همراه stack و code ثبت می‌کند.
         * فقط زمان سپری‌شده را روی request قرار می‌دهیم تا فیلتر
         * بتواند durationMs را در همان لاگ خطا ثبت کند.
         */
        error: () => {
          request.requestDurationMs =
            this.resolveDurationMs(startedAt);
        },
      }),
    );
  }

  private logCompletedRequest(
    request: RequestWithUser,
    response: Response,
    durationMs: number,
  ): void {
    const method = request.method.toUpperCase();
    const path = this.resolveRequestPath(request);

    if (
      method === 'OPTIONS' ||
      EXCLUDED_PATHS.has(path)
    ) {
      return;
    }

    const logPayload = createLogContext(
      durationMs >= this.slowRequestThresholdMs
        ? 'http_request_slow'
        : 'http_request_completed',
      {
        requestId: request.requestId,
        method,
        path,
        route: this.resolveRoutePath(request),
        statusCode: response.statusCode,
        durationMs,
        userId: this.resolveUserId(request),
      },
    );

    if (
      durationMs >= this.slowRequestThresholdMs
    ) {
      this.logger.warn(logPayload);
      return;
    }

    if (
      this.logAllRequests ||
      MUTATING_METHODS.has(method)
    ) {
      this.logger.log(logPayload);
    }
  }

  private resolveDurationMs(
    startedAt: number,
  ): number {
    return Number(
      (performance.now() - startedAt).toFixed(2),
    );
  }

  private resolveRequestPath(
    request: Request,
  ): string {
    const value =
      request.originalUrl ||
      request.url ||
      request.path ||
      '/';

    return value.split('?')[0] || '/';
  }

  private resolveRoutePath(
    request: Request,
  ): string | undefined {
    const routePath = (
      request.route as
        | {
            path?: unknown;
          }
        | undefined
    )?.path;

    if (typeof routePath !== 'string') {
      return undefined;
    }

    return `${request.baseUrl || ''}${routePath}`;
  }

  private resolveUserId(
    request: RequestWithUser,
  ): string | undefined {
    const possibleValues = [
      request.user?.id,
      request.user?.userId,
      request.user?.sub,
    ];

    for (const value of possibleValues) {
      if (
        typeof value === 'string' ||
        typeof value === 'number'
      ) {
        return String(value);
      }
    }

    return undefined;
  }

  private resolveBooleanEnvironmentValue(
    value: string | undefined,
    fallback: boolean,
  ): boolean {
    const normalized = value?.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }

    return fallback;
  }

  private resolvePositiveInteger(
    value: string | undefined,
    fallback: number,
  ): number {
    const parsed = Number.parseInt(value ?? '', 10);

    if (
      !Number.isFinite(parsed) ||
      parsed <= 0
    ) {
      return fallback;
    }

    return parsed;
  }
}
