import { NextResponse } from 'next/server';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  nestApiWithResponse,
  type NestApiResponse,
} from '@/lib/api/nest-api';
import { REQUEST_ID_HEADER } from '@/lib/api/request-id';
import { getAccessToken } from '@/lib/auth/session';

export const PAYMENT_API_PATH = '/api/v1/payments';

export async function paymentNestApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<NestApiResponse<T>> {
  const accessToken = await getAccessToken('customer');

  if (!accessToken) {
    throw new ApiRequestError(
      'برای پرداخت سفارش باید وارد حساب کاربری شوید',
      401,
      'CUSTOMER_AUTH_REQUIRED',
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

export function createPaymentProxyResponse<T>(
  result: NestApiResponse<T>,
): NextResponse {
  const response = NextResponse.json(result.payload, {
    status: result.status,
  });

  response.headers.set('Cache-Control', 'no-store');

  const requestId = result.headers.get(REQUEST_ID_HEADER);

  if (requestId) {
    response.headers.set(REQUEST_ID_HEADER, requestId);
  }

  return response;
}
