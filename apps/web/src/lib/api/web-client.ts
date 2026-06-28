import type { AuthScope } from '@/lib/auth/auth-cookies';
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export class ClientApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ClientApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const text = await response.text();

  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    const record = isRecord(payload) ? payload : {};

    throw new ClientApiError(
      typeof record.message === 'string' ? record.message : 'درخواست با خطا مواجه شد',
      response.status,
      typeof record.code === 'string' ? record.code : undefined,
    );
  }

  if (isRecord(payload) && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export const webApi = {
  requestOtp(mobile: string) {
    return request<{ retryAfterSeconds?: number }>('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ mobile }),
    });
  },

  verifyOtp(mobile: string, code: string, sessionScope: AuthScope) {
    return request<{
      user: {
        id: string;
        phone: string | null;
        fullName: string | null;
        role: string;
      };
      sessionScope: AuthScope;
    }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        mobile,
        code,
        sessionScope,
      }),
    });
  },

  logout(sessionScope: AuthScope) {
    return request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionScope }),
    });
  },
};
