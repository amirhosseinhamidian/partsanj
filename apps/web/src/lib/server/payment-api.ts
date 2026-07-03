import { ApiRequestError } from '@/lib/api/api-error';
import { nestApiWithResponse, type NestApiResponse } from '@/lib/api/nest-api';
import { getAccessToken } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

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

export function createPaymentProxyResponse<T>(result: NestApiResponse<T>) {
  const response = NextResponse.json(result.payload, {
    status: result.status,
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
}
