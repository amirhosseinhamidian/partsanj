import { NextResponse } from 'next/server';

import { ApiRequestError } from '@/lib/api/api-error';
import { REQUEST_ID_HEADER } from '@/lib/api/request-id';

export function apiErrorResponse(
  error: unknown,
): NextResponse {
  if (error instanceof ApiRequestError) {
    const message =
      error.status >= 500
        ? 'سرویس اصلی در حال حاضر پاسخ‌گو نیست'
        : error.message;

    if (error.status >= 500) {
      console.error('Upstream API error:', {
        status: error.status,
        code: error.code,
        requestId: error.requestId,
      });
    }

    const response = NextResponse.json(
      {
        message,
        code: error.code,
        requestId: error.requestId,
      },
      {
        status: error.status,
      },
    );

    response.headers.set('Cache-Control', 'no-store');

    if (error.requestId) {
      response.headers.set(
        REQUEST_ID_HEADER,
        error.requestId,
      );
    }

    return response;
  }

  console.error('Unexpected API route error:', error);

  return NextResponse.json(
    {
      message: 'خطای غیرمنتظره رخ داد',
      code: 'UNEXPECTED_ERROR',
    },
    {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
