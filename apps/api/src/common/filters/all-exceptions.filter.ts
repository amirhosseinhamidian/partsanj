import { randomUUID } from 'node:crypto';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Prisma } from '../../generated/prisma/client.js';
import { normalizeRequestId, REQUEST_ID_HEADER } from '../http/request-id.js';
import { createErrorDetails } from '../logging/logging.utils.js';
import { captureServerException } from '../monitoring/sentry-monitoring.js';

type ApiErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
  requestId: string;
  timestamp: string;
  path: string;
  details?: unknown;
};

type NormalizedException = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
};

type RequestWithUser = Request & {
  user?: {
    id?: unknown;
    userId?: unknown;
    sub?: unknown;
  };
};

const INTERNAL_ERROR_MESSAGE = 'خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.';

const INVALID_REQUEST_MESSAGE = 'اطلاعات ارسال‌شده معتبر نیست.';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<RequestWithUser>();
    const response = httpContext.getResponse<Response>();

    const requestId = this.resolveRequestId(request);
    const normalizedException = this.normalizeException(exception);
    const path = this.resolveRequestPath(request);

    this.logException(exception, normalizedException, request, requestId, path);

    if (response.headersSent) {
      return;
    }

    const body: ApiErrorResponse = {
      statusCode: normalizedException.statusCode,
      code: normalizedException.code,
      message: normalizedException.message,
      requestId,
      timestamp: new Date().toISOString(),
      path,
      ...(normalizedException.details === undefined
        ? {}
        : {
            details: normalizedException.details,
          }),
    };

    response.setHeader('x-request-id', requestId);
    response.setHeader('cache-control', 'no-store');

    response.status(normalizedException.statusCode).json(body);
  }

  private normalizeException(exception: unknown): NormalizedException {
    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrismaKnownRequestError(exception);
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DATABASE_UNAVAILABLE',
        message: 'سرویس پایگاه داده موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.',
        stack: exception.stack,
      };
    }

    if (
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientValidationError
    ) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'DATABASE_ERROR',
        message: INTERNAL_ERROR_MESSAGE,
        stack: exception.stack,
      };
    }

    if (this.isMalformedJsonError(exception)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_JSON',
        message: 'ساختار JSON ارسال‌شده معتبر نیست.',
        stack: exception instanceof Error ? exception.stack : undefined,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: INTERNAL_ERROR_MESSAGE,
      stack: exception instanceof Error ? exception.stack : undefined,
    };
  }

  private normalizeHttpException(exception: HttpException): NormalizedException {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        statusCode,
        code: this.defaultCodeForStatus(statusCode),
        message: this.normalizeFrameworkMessage(response, statusCode),
        stack: exception.stack,
      };
    }

    if (!this.isRecord(response)) {
      return {
        statusCode,
        code: this.defaultCodeForStatus(statusCode),
        message: this.defaultMessageForStatus(statusCode),
        stack: exception.stack,
      };
    }

    const rawMessage = response.message;
    const responseCode =
      typeof response.code === 'string' && response.code.trim()
        ? response.code.trim()
        : this.defaultCodeForStatus(statusCode);

    if (Array.isArray(rawMessage)) {
      const errors = rawMessage.filter(
        (item): item is string => typeof item === 'string' && Boolean(item.trim()),
      );

      return {
        statusCode,
        code: responseCode === 'BAD_REQUEST' ? 'VALIDATION_ERROR' : responseCode,
        message:
          statusCode === HttpStatus.BAD_REQUEST
            ? INVALID_REQUEST_MESSAGE
            : errors.join('، ') || this.defaultMessageForStatus(statusCode),
        details: {
          errors,
        },
        stack: exception.stack,
      };
    }

    const message =
      typeof rawMessage === 'string' && rawMessage.trim()
        ? this.normalizeFrameworkMessage(rawMessage.trim(), statusCode)
        : this.defaultMessageForStatus(statusCode);

    const details = response.details === undefined ? undefined : response.details;

    return {
      statusCode,
      code: responseCode,
      message,
      ...(details === undefined ? {} : { details }),
      stack: exception.stack,
    };
  }

  private normalizePrismaKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): NormalizedException {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'رکوردی با اطلاعات مشابه قبلاً ثبت شده است.',
          stack: exception.stack,
        };

      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'RELATION_CONSTRAINT_VIOLATION',
          message: 'این عملیات به‌دلیل وابستگی اطلاعات قابل انجام نیست.',
          stack: exception.stack,
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'RESOURCE_NOT_FOUND',
          message: 'اطلاعات درخواستی پیدا نشد.',
          stack: exception.stack,
        };

      case 'P2034':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'TRANSACTION_CONFLICT',
          message: 'اطلاعات هم‌زمان تغییر کرده است. لطفاً دوباره تلاش کنید.',
          stack: exception.stack,
        };

      case 'P2024':
      case 'P1001':
      case 'P1002':
      case 'P1017':
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          code: 'DATABASE_UNAVAILABLE',
          message: 'سرویس پایگاه داده موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.',
          stack: exception.stack,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: INTERNAL_ERROR_MESSAGE,
          stack: exception.stack,
        };
    }
  }

  private logException(
    originalException: unknown,
    normalizedException: NormalizedException,
    request: RequestWithUser,
    requestId: string,
    path: string,
  ): void {
    const baseLog = {
      event: 'request_failed',
      service: 'partsanj-api',
      environment: process.env.NODE_ENV ?? 'development',
      requestId,
      method: request.method,
      path,
      statusCode: normalizedException.statusCode,
      code: normalizedException.code,
      durationMs: request.requestDurationMs,
      userId: this.resolveUserId(request),
    };

    if (normalizedException.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({
        ...baseLog,
        error: createErrorDetails(originalException),
      });

      captureServerException(originalException, {
        event: 'request_failed',
        requestId,
        tags: {
          method: request.method,
          error_code: normalizedException.code,
          status_code: normalizedException.statusCode,
        },
        context: {
          path,
          durationMs: request.requestDurationMs,
        },
      });

      return;
    }

    if (
      normalizedException.statusCode === HttpStatus.CONFLICT ||
      normalizedException.statusCode === HttpStatus.TOO_MANY_REQUESTS ||
      normalizedException.statusCode === HttpStatus.SERVICE_UNAVAILABLE
    ) {
      this.logger.warn(baseLog);
    }
  }

  private resolveRequestId(request: Request): string {
    return (
      normalizeRequestId(request.requestId) ??
      normalizeRequestId(request.header(REQUEST_ID_HEADER)) ??
      randomUUID()
    );
  }

  private resolveRequestPath(request: Request): string {
    if (typeof request.path === 'string' && request.path) {
      return request.path;
    }

    const url = request.originalUrl || request.url || '/';

    return url.split('?')[0] || '/';
  }

  private resolveUserId(request: RequestWithUser): string | undefined {
    const possibleValues = [request.user?.id, request.user?.userId, request.user?.sub];

    for (const value of possibleValues) {
      if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
      }
    }

    return undefined;
  }

  private resolveExceptionStack(exception: unknown): string | undefined {
    return exception instanceof Error ? exception.stack : undefined;
  }

  private normalizeFrameworkMessage(message: string, statusCode: number): string {
    if (/^Cannot\s+[A-Z]+\s+/i.test(message)) {
      return this.defaultMessageForStatus(statusCode);
    }

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return INTERNAL_ERROR_MESSAGE;
    }

    return message;
  }

  private defaultCodeForStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';
      default:
        return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
          ? 'INTERNAL_SERVER_ERROR'
          : `HTTP_${statusCode}`;
    }
  }

  private defaultMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return INVALID_REQUEST_MESSAGE;
      case HttpStatus.UNAUTHORIZED:
        return 'برای انجام این عملیات باید وارد حساب کاربری شوید.';
      case HttpStatus.FORBIDDEN:
        return 'اجازه انجام این عملیات را ندارید.';
      case HttpStatus.NOT_FOUND:
        return 'اطلاعات درخواستی پیدا نشد.';
      case HttpStatus.CONFLICT:
        return 'درخواست با وضعیت فعلی اطلاعات سازگار نیست.';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'امکان پردازش اطلاعات ارسال‌شده وجود ندارد.';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'سرویس موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.';
      default:
        return statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
          ? INTERNAL_ERROR_MESSAGE
          : 'درخواست قابل انجام نیست.';
    }
  }

  private isMalformedJsonError(exception: unknown): boolean {
    if (!(exception instanceof SyntaxError)) {
      return false;
    }

    if (!this.isRecord(exception)) {
      return false;
    }

    return (
      exception.status === HttpStatus.BAD_REQUEST ||
      exception.statusCode === HttpStatus.BAD_REQUEST ||
      exception.type === 'entity.parse.failed'
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
