import { ApiRequestError } from '@/lib/api/api-error';
import { nestApi } from '@/lib/api/nest-api';
import { env } from '@/lib/server/env';

type UnknownRecord = Record<string, unknown>;

export type AuthenticatedUser = {
  id: string;
  phone: string | null;
  fullName: string | null;
  role: string;
};

type LoginTokens = {
  accessToken: string;
  refreshToken: string | null;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function unwrapPayload(payload: unknown): UnknownRecord {
  if (!isRecord(payload)) {
    return {};
  }

  return isRecord(payload.data) ? payload.data : payload;
}

function firstString(record: UnknownRecord, fields: string[]): string | null {
  for (const field of fields) {
    const value = record[field];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return null;
}

function firstId(record: UnknownRecord): string | null {
  const value = record.id ?? record.userId;

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function getRole(record: UnknownRecord): string | null {
  const directRole = firstString(record, ['role']);

  if (directRole) {
    return directRole;
  }

  if (Array.isArray(record.roles)) {
    return record.roles.find((item): item is string => typeof item === 'string') ?? null;
  }

  return null;
}

function mapAuthenticatedUser(payload: unknown): AuthenticatedUser | null {
  const root = unwrapPayload(payload);

  const user = isRecord(root.user) ? root.user : isRecord(root.admin) ? root.admin : root;

  const id = firstId(user);
  const role = getRole(user);

  if (!id || !role) {
    return null;
  }

  return {
    id,
    role,
    phone: firstString(user, ['phone', 'mobile', 'phoneNumber']),
    fullName: firstString(user, ['fullName', 'name']),
  };
}

export function isAdminUser(user: AuthenticatedUser): boolean {
  return user.role === 'ADMIN';
}

export async function requestOtpFromApi(mobile: string) {
  const response = await nestApi<unknown>(env.authRequestOtpPath, {
    method: 'POST',
    body: JSON.stringify({ mobile }),
  });

  const payload = unwrapPayload(response);

  const retryAfterSeconds =
    typeof payload.retryAfterSeconds === 'number'
      ? payload.retryAfterSeconds
      : typeof payload.retryAfter === 'number'
        ? payload.retryAfter
        : undefined;

  return { retryAfterSeconds };
}

export async function getCurrentUserWithToken(accessToken: string): Promise<AuthenticatedUser> {
  const response = await nestApi<unknown>(env.authMePath, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const user = mapAuthenticatedUser(response);

  if (!user) {
    throw new ApiRequestError('پاسخ endpoint اطلاعات کاربر معتبر نیست', 502, 'INVALID_ME_RESPONSE');
  }

  return user;
}

export async function verifyOtpAgainstApi(
  mobile: string,
  code: string,
): Promise<LoginTokens & { user: AuthenticatedUser }> {
  const response = await nestApi<unknown>(env.authVerifyOtpPath, {
    method: 'POST',
    body: JSON.stringify({
      mobile,
      code,
    }),
  });

  const payload = unwrapPayload(response);
  const tokenPayload = isRecord(payload.tokens) ? payload.tokens : payload;

  const accessToken = firstString(tokenPayload, ['accessToken', 'access_token', 'token']);

  const refreshToken = firstString(tokenPayload, ['refreshToken', 'refresh_token']);

  if (!accessToken) {
    throw new ApiRequestError('پاسخ ورود API فاقد accessToken است', 502, 'ACCESS_TOKEN_MISSING');
  }

  const user = await getCurrentUserWithToken(accessToken);

  return {
    accessToken,
    refreshToken,
    user,
  };
}
