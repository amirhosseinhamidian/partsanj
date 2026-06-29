import 'server-only';

import { ApiRequestError } from '@/lib/api/api-error';
import { nestApi } from '@/lib/api/nest-api';
import { getAccessToken } from '@/lib/auth/session';

export const ADMIN_CATALOG_API_PATH = '/api/v1/admin/catalog';

export async function adminNestApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await getAccessToken('admin');

  if (!accessToken) {
    throw new ApiRequestError('نشست ادمین معتبر نیست', 401, 'ADMIN_SESSION_MISSING');
  }

  const headers = new Headers(init.headers);

  headers.set('Authorization', `Bearer ${accessToken}`);

  return nestApi<T>(path, {
    ...init,
    headers,
  });
}
