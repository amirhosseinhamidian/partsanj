import 'server-only';

import { randomUUID } from 'node:crypto';

import { headers as nextHeaders } from 'next/headers';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  normalizeRequestId,
  REQUEST_ID_HEADER,
} from '@/lib/api/request-id';
import { env } from '@/lib/server/env';

type UnknownRecord = Record<string, unknown>;

export type NestApiResponse<T> = {
  payload: T;
  headers: Headers;
  status: number;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function parseJsonSafely(value: string): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getErrorMessage(payload: unknown): string {
  if (!isRecord(payload)) {
    return 'درخواست به سرویس اصلی با خطا مواجه شد';
  }

  const message = payload.message;

  if (Array.isArray(message)) {
    return message
      .filter((item): item is string => typeof item === 'string')
      .join(' ، ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'درخواست به سرویس اصلی با خطا مواجه شد';
}

function getErrorCode(payload: unknown): string | undefined {
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
  return `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function resolveOutgoingRequestId(
  outgoingHeaders: Headers,
): Promise<string> {
  const explicitRequestId = normalizeRequestId(
    outgoingHeaders.get(REQUEST_ID_HEADER),
  );

  if (explicitRequestId) {
    return explicitRequestId;
  }

  // در Route Handler یا Server Component، شناسه‌ای که Proxy
  // روی request قرار داده است از اینجا خوانده می‌شود.
  const incomingHeaders = await nextHeaders();
  const incomingRequestId = normalizeRequestId(
    incomingHeaders.get(REQUEST_ID_HEADER),
  );

  return incomingRequestId ?? randomUUID();
}

async function requestNestApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<NestApiResponse<T>> {
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const requestId = await resolveOutgoingRequestId(headers);
  headers.set(REQUEST_ID_HEADER, requestId);

  let response: Response;

  try {
    response = await fetch(createUrl(path), {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Nest API connection error:', {
      path,
      requestId,
      error,
    });

    throw new ApiRequestError(
      'ارتباط با سرویس اصلی برقرار نشد',
      503,
      'API_UNAVAILABLE',
      requestId,
    );
  }

  const text = await response.text();
  const payload = parseJsonSafely(text);

  const responseRequestId =
    normalizeRequestId(
      response.headers.get(REQUEST_ID_HEADER),
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
}

export async function nestApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const result = await requestNestApi<T>(path, init);
  return result.payload;
}

export async function nestApiWithResponse<T>(
  path: string,
  init: RequestInit = {},
): Promise<NestApiResponse<T>> {
  return requestNestApi<T>(path, init);
}
