import { ApiRequestError } from '@/lib/api/api-error';

type NextFetchRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};

type PublicNestApiInit = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit;
  next?: NextFetchRequestConfig;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getNestApiBaseUrl() {
  const baseUrl = process.env.PARTSANJ_API_URL?.trim();

  if (!baseUrl) {
    throw new Error('NEST_API_URL is not configured');
  }

  return baseUrl.replace(/\/+$/, '');
}

function getNestApiUrl(path: string) {
  if (!path.startsWith('/')) {
    throw new Error('Nest API path must start with "/"');
  }

  return `${getNestApiBaseUrl()}${path}`;
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) {
    return fallback;
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  if (Array.isArray(payload.message)) {
    const messages = payload.message.filter((item): item is string => typeof item === 'string');

    if (messages.length > 0) {
      return messages.join('، ');
    }
  }

  if (typeof payload.error === 'string') {
    return payload.error;
  }

  return fallback;
}

function getErrorCode(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  return typeof payload.code === 'string' ? payload.code : undefined;
}

export async function publicNestApi<T>(path: string, init: PublicNestApiInit = {}): Promise<T> {
  const { headers: initialHeaders, next, ...requestInit } = init;

  const headers = new Headers(initialHeaders);

  headers.set('Accept', 'application/json');

  const shouldDefaultToNoStore = !next && requestInit.cache === undefined;

  const response = await fetch(getNestApiUrl(path), {
    ...requestInit,
    headers,

    ...(next ? { next } : {}),

    ...(shouldDefaultToNoStore
      ? {
          cache: 'no-store' as const,
        }
      : {}),
  } as RequestInit & {
    next?: NextFetchRequestConfig;
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      getErrorMessage(payload, 'دریافت اطلاعات عمومی بلاگ با خطا مواجه شد'),
      response.status,
      getErrorCode(payload),
    );
  }

  return payload as T;
}
