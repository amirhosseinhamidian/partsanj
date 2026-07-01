import { apiErrorResponse } from '@/lib/api/route-response';
import { PUBLIC_CATALOG_API_PATH, publicNestApi } from '@/lib/server/public-api';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const queryString = request.nextUrl.searchParams.toString();

    const path = queryString
      ? `${PUBLIC_CATALOG_API_PATH}/products?${queryString}`
      : `${PUBLIC_CATALOG_API_PATH}/products`;

    const result = await publicNestApi<unknown>(path, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
