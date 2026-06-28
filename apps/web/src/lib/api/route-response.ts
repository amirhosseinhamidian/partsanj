import { ApiRequestError } from '@/lib/api/api-error';
import { NextResponse } from 'next/server';

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiRequestError) {
    const message = error.status >= 500 ? 'سرویس اصلی در حال حاضر پاسخ‌گو نیست' : error.message;

    return NextResponse.json(
      {
        message,
        code: error.code,
      },
      {
        status: error.status,
      },
    );
  }

  console.error('Unexpected API route error:', error);

  return NextResponse.json(
    {
      message: 'خطای غیرمنتظره رخ داد',
      code: 'UNEXPECTED_ERROR',
    },
    {
      status: 500,
    },
  );
}
