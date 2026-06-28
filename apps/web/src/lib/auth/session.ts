import { AUTH_COOKIE_NAMES, type AuthScope } from '@/lib/auth/auth-cookies';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

type AuthTokens = {
  accessToken: string;
  refreshToken: string | null;
};

const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function setSession(response: NextResponse, scope: AuthScope, tokens: AuthTokens): void {
  const cookieNames = AUTH_COOKIE_NAMES[scope];

  response.cookies.set(cookieNames.access, tokens.accessToken, baseCookieOptions);

  if (tokens.refreshToken) {
    response.cookies.set(cookieNames.refresh, tokens.refreshToken, baseCookieOptions);

    return;
  }

  response.cookies.set(cookieNames.refresh, '', {
    ...baseCookieOptions,
    expires: new Date(0),
  });
}

export function clearSession(response: NextResponse, scope: AuthScope): void {
  const cookieNames = AUTH_COOKIE_NAMES[scope];

  response.cookies.set(cookieNames.access, '', {
    ...baseCookieOptions,
    expires: new Date(0),
  });

  response.cookies.set(cookieNames.refresh, '', {
    ...baseCookieOptions,
    expires: new Date(0),
  });
}

export async function getAccessToken(scope: AuthScope): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(AUTH_COOKIE_NAMES[scope].access)?.value ?? null;
}
