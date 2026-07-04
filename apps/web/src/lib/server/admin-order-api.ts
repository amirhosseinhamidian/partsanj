import { ApiRequestError } from '@/lib/api/api-error';
import { nestApiWithResponse, type NestApiResponse } from '@/lib/api/nest-api';
import { getAccessToken } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export const ADMIN_ORDERS_API_PATH = '/api/v1/admin/orders';

export async function adminOrderNestApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<NestApiResponse<T>> {
  const accessToken = await getAccessToken('admin');

  if (!accessToken) {
    throw new ApiRequestError(
      'برای دسترسی به مدیریت سفارش‌ها باید وارد پنل مدیریت شوید',
      401,
      'ADMIN_AUTH_REQUIRED',
    );
  }

  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${accessToken}`);

  return nestApiWithResponse<T>(path, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

export function createAdminOrderProxyResponse<T>(result: NestApiResponse<T>) {
  const response = NextResponse.json(result.payload, {
    status: result.status,
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
}
