import { apiErrorResponse } from '@/lib/api/route-response';
import { PUBLIC_CATALOG_API_PATH, publicNestApi } from '@/lib/server/public-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await publicNestApi<unknown>(`${PUBLIC_CATALOG_API_PATH}/categories`, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
