import 'server-only';

import { ApiRequestError } from '@/lib/api/api-error';
import { nestApiWithResponse, type NestApiResponse } from '@/lib/api/nest-api';
import { getAccessToken } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export const PRODUCT_INTERACTION_API_PATH = '/api/v1/catalog/products';

export async function storefrontInteractionNestApi<T>(
  path: string,
  init: RequestInit = {},
  requireAuth = false,
): Promise<NestApiResponse<T>> {
  const accessToken = await getAccessToken('customer');

  if (requireAuth && !accessToken) {
    throw new ApiRequestError(
      'برای انجام این عملیات باید وارد حساب کاربری شوید',
      401,
      'CUSTOMER_AUTH_REQUIRED',
    );
  }

  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return nestApiWithResponse<T>(path, {
    ...init,

    headers,

    cache: 'no-store',
  });
}

export function createStorefrontInteractionProxyResponse<T>(result: NestApiResponse<T>) {
  const response = NextResponse.json(result.payload, {
    status: result.status,
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
}
