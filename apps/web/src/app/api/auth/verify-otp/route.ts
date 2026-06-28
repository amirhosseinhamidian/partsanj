import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import { isAdminUser, verifyOtpAgainstApi } from '@/lib/auth/auth-contract';
import { isAuthScope, type AuthScope } from '@/lib/auth/auth-cookies';
import { normalizeIranianMobile, normalizeOtp } from '@/lib/auth/phone';
import { setSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

function getStringField(body: unknown, field: string): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    field in body &&
    typeof body[field as keyof typeof body] === 'string'
  ) {
    return body[field as keyof typeof body] as string;
  }

  return '';
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);

    const mobile = normalizeIranianMobile(getStringField(body, 'mobile'));

    const code = normalizeOtp(getStringField(body, 'code'));

    const sessionScope = getStringField(body, 'sessionScope') as AuthScope;

    if (!mobile) {
      throw new ApiRequestError('شماره موبایل معتبر نیست', 400, 'INVALID_MOBILE');
    }

    if (!/^\d{4,8}$/.test(code)) {
      throw new ApiRequestError('کد تأیید معتبر نیست', 400, 'INVALID_OTP');
    }

    if (!isAuthScope(sessionScope)) {
      throw new ApiRequestError('نوع Session معتبر نیست', 400, 'INVALID_SESSION_SCOPE');
    }

    const session = await verifyOtpAgainstApi(mobile, code);

    if (sessionScope === 'admin' && !isAdminUser(session.user)) {
      throw new ApiRequestError(
        'این حساب اجازه ورود به پنل مدیریت را ندارد',
        403,
        'ADMIN_REQUIRED',
      );
    }

    const response = NextResponse.json({
      data: {
        user: session.user,
        sessionScope,
      },
    });

    setSession(response, sessionScope, session);

    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
