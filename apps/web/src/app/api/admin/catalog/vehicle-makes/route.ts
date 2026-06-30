import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await adminNestApi(`${ADMIN_CATALOG_API_PATH}/vehicle-makes`, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
