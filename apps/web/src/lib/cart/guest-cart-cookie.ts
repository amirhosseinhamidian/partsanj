import type { NextRequest, NextResponse } from 'next/server';

export const GUEST_CART_COOKIE_NAME = 'partsanj_guest_cart';

const GUEST_CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function getGuestCartToken(request: NextRequest): string | null {
  const value = request.cookies.get(GUEST_CART_COOKIE_NAME)?.value?.trim();

  return value || null;
}

export function setGuestCartToken(response: NextResponse, token: string): void {
  response.cookies.set(GUEST_CART_COOKIE_NAME, token, {
    ...baseCookieOptions,
    maxAge: GUEST_CART_COOKIE_MAX_AGE,
  });
}

export function clearGuestCartToken(response: NextResponse): void {
  response.cookies.set(GUEST_CART_COOKIE_NAME, '', {
    ...baseCookieOptions,
    expires: new Date(0),
  });
}
