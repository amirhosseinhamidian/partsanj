import { apiErrorResponse } from '@/lib/api/route-response';
import { nestApiWithResponse } from '@/lib/api/nest-api';
import { getAccessToken } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accessToken = await getAccessToken('customer');

  if (!accessToken) {
    const response = NextResponse.json({
      data: null,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  }

  try {
    const result = await nestApiWithResponse<unknown>('/api/v1/auth/me', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });

    const response = NextResponse.json(result.payload, {
      status: result.status,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
