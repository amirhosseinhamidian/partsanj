import { ApiRequestError } from '@/lib/api/api-error';
import { env } from '@/lib/server/env';

type UnknownRecord = Record<string, unknown>;

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
    return message.filter((item): item is string => typeof item === 'string').join(' ، ');
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

  return typeof payload.code === 'string' ? payload.code : undefined;
}

function createUrl(path: string): string {
  return `${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function nestApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(createUrl(path), {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Nest API connection error:', { path, error });

    throw new ApiRequestError('ارتباط با سرویس اصلی برقرار نشد', 503, 'API_UNAVAILABLE');
  }

  const text = await response.text();
  const payload = parseJsonSafely(text);

  if (!response.ok) {
    throw new ApiRequestError(getErrorMessage(payload), response.status, getErrorCode(payload));
  }

  return payload as T;
}
