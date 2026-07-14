import 'server-only';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  PUBLIC_NEST_API_TIMEOUT_MS,
  runWithTimeoutSignal,
  UpstreamRequestTimeoutError,
} from '@/lib/server/request-timeout';

type NextFetchRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};

type PublicNestApiInit =
  Omit<RequestInit, 'headers'> & {
    headers?: HeadersInit;
    next?: NextFetchRequestConfig;

    /**
     * حداکثر زمان کل درخواست عمومی به Nest.
     */
    timeoutMs?: number;
  };

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getNestApiBaseUrl(): string {
  const baseUrl =
    process.env.PARTSANJ_API_URL?.trim();

  if (!baseUrl) {
    throw new Error(
      'PARTSANJ_API_URL is not configured',
    );
  }

  return baseUrl.replace(/\/+$/, '');
}

function getNestApiUrl(
  path: string,
): string {
  if (!path.startsWith('/')) {
    throw new Error(
      'Nest API path must start with "/"',
    );
  }

  return `${getNestApiBaseUrl()}${path}`;
}

function getSafeLogPath(path: string): string {
  return path.split(/[?#]/, 1)[0] || '/';
}

function getErrorMessage(
  payload: unknown,
  fallback: string,
): string {
  if (!isRecord(payload)) {
    return fallback;
  }

  if (
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  if (Array.isArray(payload.message)) {
    const messages =
      payload.message.filter(
        (item): item is string =>
          typeof item === 'string',
      );

    if (messages.length > 0) {
      return messages.join('، ');
    }
  }

  if (
    typeof payload.error === 'string'
  ) {
    return payload.error;
  }

  return fallback;
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

export async function publicNestApi<T>(
  path: string,
  init: PublicNestApiInit = {},
): Promise<T> {
  const {
    headers: initialHeaders,
    next,
    timeoutMs =
      PUBLIC_NEST_API_TIMEOUT_MS,
    ...requestInit
  } = init;

  const headers = new Headers(
    initialHeaders,
  );

  headers.set('Accept', 'application/json');

  const shouldDefaultToNoStore =
    !next &&
    requestInit.cache === undefined;

  try {
    return await runWithTimeoutSignal(
      {
        timeoutMs,
        signal: requestInit.signal,
      },
      async (signal) => {
        const response = await fetch(
          getNestApiUrl(path),
          {
            ...requestInit,
            headers,
            signal,
            ...(next
              ? {
                  next,
                }
              : {}),
            ...(shouldDefaultToNoStore
              ? {
                  cache:
                    'no-store' as const,
                }
              : {}),
          } as RequestInit & {
            next?: NextFetchRequestConfig;
          },
        );

        const payload: unknown =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new ApiRequestError(
            getErrorMessage(
              payload,
              'دریافت اطلاعات عمومی با خطا مواجه شد',
            ),
            response.status,
            getErrorCode(payload),
          );
        }

        return payload as T;
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
        'Public Nest API request timed out:',
        {
          path: getSafeLogPath(path),
          timeoutMs:
            error.timeoutMs,
        },
      );

      throw new ApiRequestError(
        'دریافت اطلاعات از سرویس اصلی بیش از حد طول کشید',
        504,
        'API_TIMEOUT',
      );
    }

    if (requestInit.signal?.aborted) {
      throw error;
    }

    console.error(
      'Public Nest API connection error:',
      {
        path: getSafeLogPath(path),
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
    );
  }
}
