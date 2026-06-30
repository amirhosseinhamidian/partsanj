import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const makeId = url.searchParams.get('makeId');

    if (!makeId) {
      return NextResponse.json(
        {
          message: 'makeId الزامی است',
          code: 'MAKE_ID_REQUIRED',
        },
        {
          status: 400,
        },
      );
    }

    const params = new URLSearchParams({
      makeId,
    });

    const result = await adminNestApi(
      `${ADMIN_CATALOG_API_PATH}/vehicle-models?${params.toString()}`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
