import 'server-only';

import { ApiRequestError } from '@/lib/api/api-error';
import { nestApiWithResponse, type NestApiResponse } from '@/lib/api/nest-api';
import { getAccessToken } from '@/lib/auth/session';
import {
  clearGuestCartToken,
  getGuestCartToken,
  setGuestCartToken,
} from '@/lib/cart/guest-cart-cookie';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const CART_API_PATH = '/api/v1/cart';

const GUEST_CART_TOKEN_HEADER = 'x-cart-token';

type CartProxyResult<T> = {
  payload: T;
  shouldClearGuestCartToken: boolean;
  guestCartTokenToPersist: string | null;
};

function createCartHeaders(
  accessToken: string | null,
  guestCartToken: string | null,
  headers?: HeadersInit,
): Headers {
  const forwardedHeaders = new Headers(headers);

  if (accessToken) {
    forwardedHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  if (guestCartToken) {
    forwardedHeaders.set(GUEST_CART_TOKEN_HEADER, guestCartToken);
  }

  return forwardedHeaders;
}

async function requestCartApi<T>(
  path: string,
  accessToken: string | null,
  guestCartToken: string | null,
  init: RequestInit = {},
): Promise<NestApiResponse<T>> {
  return nestApiWithResponse<T>(path, {
    ...init,
    headers: createCartHeaders(accessToken, guestCartToken, init.headers),
  });
}

export async function cartNestApi<T>(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<CartProxyResult<T>> {
  const accessToken = await getAccessToken('customer');

  const incomingGuestCartToken = getGuestCartToken(request);

  let guestCartTokenForNest = incomingGuestCartToken;

  let shouldClearGuestCartToken = false;

  /*
   * ورود مشتری + وجود Cart مهمان:
   * قبل از هر عملیات Cart، ادغام را در Backend انجام می‌دهیم
   */
  if (accessToken && incomingGuestCartToken) {
    await requestCartApi(`${CART_API_PATH}/merge`, accessToken, incomingGuestCartToken, {
      method: 'POST',
    });

    guestCartTokenForNest = null;
    shouldClearGuestCartToken = true;
  }

  const result = await requestCartApi<T>(path, accessToken, guestCartTokenForNest, init);

  const issuedGuestCartToken = result.headers.get(GUEST_CART_TOKEN_HEADER)?.trim();

  return {
    payload: result.payload,
    shouldClearGuestCartToken,
    guestCartTokenToPersist: accessToken
      ? null
      : issuedGuestCartToken || incomingGuestCartToken || null,
  };
}

export async function mergeGuestCartNestApi<T>(request: NextRequest): Promise<CartProxyResult<T>> {
  const accessToken = await getAccessToken('customer');

  if (!accessToken) {
    throw new ApiRequestError(
      'برای ادغام سبد خرید باید وارد حساب کاربری شوید',
      401,
      'AUTHENTICATION_REQUIRED',
    );
  }

  const guestCartToken = getGuestCartToken(request);

  if (!guestCartToken) {
    throw new ApiRequestError('سبد خرید مهمان برای ادغام پیدا نشد', 400, 'GUEST_CART_NOT_FOUND');
  }

  const result = await requestCartApi<T>(`${CART_API_PATH}/merge`, accessToken, guestCartToken, {
    method: 'POST',
  });

  return {
    payload: result.payload,
    shouldClearGuestCartToken: true,
    guestCartTokenToPersist: null,
  };
}

export function createCartProxyResponse<T>(result: CartProxyResult<T>): NextResponse {
  const response = NextResponse.json(result.payload, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });

  if (result.shouldClearGuestCartToken) {
    clearGuestCartToken(response);
  } else if (result.guestCartTokenToPersist) {
    setGuestCartToken(response, result.guestCartTokenToPersist);
  }

  return response;
}
