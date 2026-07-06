import type {
  AdminUserDetailResponse,
  AdminUserListQuery,
  AdminUserListResponse,
  UpdateAdminUserInput,
} from './admin-user.types';

const ADMIN_USERS_PROXY_PATH = '/api/admin/users';

type ApiErrorPayload = {
  message?: string | string[];
  code?: string;
};

export class AdminUserApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);

    this.name = 'AdminUserApiError';
  }
}

function createAdminUsersListPath(query: AdminUserListQuery = {}) {
  const params = new URLSearchParams();

  const normalizedQuery = query.q?.trim();

  if (normalizedQuery) {
    params.set('q', normalizedQuery);
  }

  if (query.role) {
    params.set('role', query.role);
  }

  if (typeof query.isActive === 'boolean') {
    params.set('isActive', String(query.isActive));
  }

  if (typeof query.page === 'number') {
    params.set('page', String(query.page));
  }

  if (typeof query.limit === 'number') {
    params.set('limit', String(query.limit));
  }

  const search = params.toString();

  return search ? `${ADMIN_USERS_PROXY_PATH}?${search}` : ADMIN_USERS_PROXY_PATH;
}

function getErrorMessage(payload: ApiErrorPayload | null) {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(' ، ');
  }

  return payload?.message ?? 'عملیات مدیریت کاربران با خطا مواجه شد';
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (response.ok) {
    return payload as T;
  }

  const errorPayload = payload as ApiErrorPayload | null;

  throw new AdminUserApiError(getErrorMessage(errorPayload), response.status, errorPayload?.code);
}

async function adminUsersRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
  });

  return readResponse<T>(response);
}

export function getAdminUsers(query: AdminUserListQuery = {}, signal?: AbortSignal) {
  return adminUsersRequest<AdminUserListResponse>(createAdminUsersListPath(query), {
    signal,
  });
}

export function getAdminUser(userId: string, signal?: AbortSignal) {
  return adminUsersRequest<AdminUserDetailResponse>(
    `${ADMIN_USERS_PROXY_PATH}/${encodeURIComponent(userId)}`,
    {
      signal,
    },
  );
}

export function updateAdminUser(userId: string, input: UpdateAdminUserInput) {
  return adminUsersRequest<AdminUserDetailResponse>(
    `${ADMIN_USERS_PROXY_PATH}/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}
