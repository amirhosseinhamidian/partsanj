import 'server-only';

import { randomUUID } from 'node:crypto';

import { headers as nextHeaders } from 'next/headers';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  normalizeRequestId,
  REQUEST_ID_HEADER,
} from '@/lib/api/request-id';
import { env } from '@/lib/server/env';
import {
  NEST_API_TIMEOUT_MS,
  runWithTimeoutSignal,
  UpstreamRequestTimeoutError,
} from '@/lib/server/request-timeout';

type UnknownRecord = Record<string, unknown>;

export type NestApiRequestInit =
  RequestInit & {
    /**
     * حداکثر زمان کل درخواست، شامل دریافت headers
     * و خواندن response body.
     */
    timeoutMs?: number;
  };

export type NestApiResponse<T> = {
  payload: T;
  headers: Headers;
  status: number;
};

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null
  );
}

function parseJsonSafely(
  value: string,
): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getErrorMessage(
  payload: unknown,
): string {
  if (!isRecord(payload)) {
    return 'درخواست به سرویس اصلی با خطا مواجه شد';
  }

  const message = payload.message;

  if (Array.isArray(message)) {
    return message
      .filter(
        (item): item is string =>
          typeof item === 'string',
      )
      .join(' ، ');
  }

  if (
    typeof message === 'string' &&
    message.trim()
  ) {
    return message;
  }

  return 'درخواست به سرویس اصلی با خطا مواجه شد';
}

function getErrorCode(
  payload: unknown,
): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  return typeof payload.code === 'string'
    ? payload.code
    : undefined;
}

function getPayloadRequestId(
  payload: unknown,
): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  return typeof payload.requestId === 'string'
    ? normalizeRequestId(payload.requestId)
    : undefined;
}

function createUrl(path: string): string {
  return `${env.apiUrl}${
    path.startsWith('/') ? path : `/${path}`
  }`;
}

function getSafeLogPath(path: string): string {
  return path.split(/[?#]/, 1)[0] || '/';
}

async function resolveOutgoingRequestId(
  outgoingHeaders: Headers,
): Promise<string> {
  const explicitRequestId =
    normalizeRequestId(
      outgoingHeaders.get(
        REQUEST_ID_HEADER,
      ),
    );

  if (explicitRequestId) {
    return explicitRequestId;
  }

  const incomingHeaders =
    await nextHeaders();

  const incomingRequestId =
    normalizeRequestId(
      incomingHeaders.get(
        REQUEST_ID_HEADER,
      ),
    );

  return incomingRequestId ?? randomUUID();
}

async function requestNestApi<T>(
  path: string,
  init: NestApiRequestInit = {},
): Promise<NestApiResponse<T>> {
  const {
    timeoutMs = NEST_API_TIMEOUT_MS,
    ...requestInit
  } = init;

  const headers = new Headers(
    requestInit.headers,
  );

  headers.set('Accept', 'application/json');

  if (
    requestInit.body &&
    !headers.has('Content-Type')
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  const requestId =
    await resolveOutgoingRequestId(headers);

  headers.set(
    REQUEST_ID_HEADER,
    requestId,
  );

  try {
    return await runWithTimeoutSignal(
      {
        timeoutMs,
        signal: requestInit.signal,
      },
      async (signal) => {
        const response = await fetch(
          createUrl(path),
          {
            ...requestInit,
            headers,
            signal,
            cache: 'no-store',
          },
        );

        const text = await response.text();
        const payload =
          parseJsonSafely(text);

        const responseRequestId =
          normalizeRequestId(
            response.headers.get(
              REQUEST_ID_HEADER,
            ),
          ) ??
          getPayloadRequestId(payload) ??
          requestId;

        if (!response.ok) {
          throw new ApiRequestError(
            getErrorMessage(payload),
            response.status,
            getErrorCode(payload),
            responseRequestId,
          );
        }

        return {
          payload: payload as T,
          headers: response.headers,
          status: response.status,
        };
      },
    );
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (
      error instanceof
      UpstreamRequestTimeoutError
    ) {
      console.error(
        'Nest API request timed out:',
        {
          path: getSafeLogPath(path),
          requestId,
          timeoutMs:
            error.timeoutMs,
        },
      );

      throw new ApiRequestError(
        'پاسخ‌گویی سرویس اصلی بیش از حد طول کشید',
        504,
        'API_TIMEOUT',
        requestId,
      );
    }

    /**
     * لغو صریح caller را به خطای ارتباطی تبدیل نمی‌کنیم.
     */
    if (requestInit.signal?.aborted) {
      throw error;
    }

    console.error(
      'Nest API connection error:',
      {
        path: getSafeLogPath(path),
        requestId,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : {
                name: 'UnknownError',
              },
      },
    );

    throw new ApiRequestError(
      'ارتباط با سرویس اصلی برقرار نشد',
      503,
      'API_UNAVAILABLE',
      requestId,
    );
  }
}

export async function nestApi<T>(
  path: string,
  init: NestApiRequestInit = {},
): Promise<T> {
  const result =
    await requestNestApi<T>(path, init);

  return result.payload;
}

export async function nestApiWithResponse<T>(
  path: string,
  init: NestApiRequestInit = {},
): Promise<NestApiResponse<T>> {
  return requestNestApi<T>(path, init);
}
