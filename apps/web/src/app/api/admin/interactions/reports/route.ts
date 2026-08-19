import { apiErrorResponse } from '@/lib/api/route-response';

import { ADMIN_INTERACTIONS_API_PATH, adminNestApi } from '@/lib/server/admin-api';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();

    const path = query
      ? `${ADMIN_INTERACTIONS_API_PATH}/reports?${query}`
      : `${ADMIN_INTERACTIONS_API_PATH}/reports`;

    const result = await adminNestApi(path, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
