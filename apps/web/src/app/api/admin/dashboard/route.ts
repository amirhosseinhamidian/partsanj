import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { apiErrorResponse } from '@/lib/api/route-response';
import type { AdminDashboardResponse } from '@/lib/admin/dashboard/admin-dashboard.types';
import { adminNestApi } from '@/lib/server/admin-api';

export const dynamic = 'force-dynamic';

const ADMIN_DASHBOARD_API_PATH = '/api/v1/admin/dashboard';

export async function GET(request: NextRequest) {
  try {
    const queryString = request.nextUrl.searchParams.toString();

    const path = queryString
      ? `${ADMIN_DASHBOARD_API_PATH}?${queryString}`
      : ADMIN_DASHBOARD_API_PATH;

    const result = await adminNestApi<AdminDashboardResponse>(path, {
      method: 'GET',
      cache: 'no-store',
    });

    const response = NextResponse.json(result);

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
