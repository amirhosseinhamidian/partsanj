import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const result = await adminNestApi(
      `${ADMIN_CATALOG_API_PATH}/products/${encodeURIComponent(id)}/compatibilities`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const body = await request.json();

    const result = await adminNestApi(
      `${ADMIN_CATALOG_API_PATH}/products/${encodeURIComponent(id)}/compatibilities`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
