import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const queryString = request.nextUrl.searchParams.toString();

    const path = queryString
      ? `${ADMIN_CATALOG_API_PATH}/audit-logs?${queryString}`
      : `${ADMIN_CATALOG_API_PATH}/audit-logs`;

    const result = await adminNestApi(path, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
