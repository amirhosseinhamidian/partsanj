import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import { isAuthScope } from '@/lib/auth/auth-cookies';
import { clearSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);

    const sessionScope =
      typeof body === 'object' &&
      body !== null &&
      'sessionScope' in body &&
      typeof body.sessionScope === 'string'
        ? body.sessionScope
        : '';

    if (!isAuthScope(sessionScope)) {
      throw new ApiRequestError('نوع Session معتبر نیست', 400, 'INVALID_SESSION_SCOPE');
    }

    const response = NextResponse.json({
      data: {
        success: true,
      },
    });

    clearSession(response, sessionScope);

    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
