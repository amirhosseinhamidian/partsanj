import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'partsanj_admin_access_token';
const LOGIN_PATH = '/admin/login';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const hasAccessToken = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  if (hasAccessToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);

  loginUrl.searchParams.set('next', `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
