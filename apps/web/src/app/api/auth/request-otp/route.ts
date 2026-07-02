import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import { requestOtpFromApi } from '@/lib/auth/auth-contract';
import { normalizeIranianMobile } from '@/lib/auth/phone';
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

    if (!mobile) {
      throw new ApiRequestError('شماره موبایل معتبر نیست', 400, 'INVALID_MOBILE');
    }

    const result = await requestOtpFromApi(mobile);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      console.error('[auth/request-otp] upstream error', {
        status: error.status,
        code: error.code,
        message: error.message,
      });
    } else {
      console.error('[auth/request-otp] unexpected error', error);
    }

    return apiErrorResponse(error);
  }
}
