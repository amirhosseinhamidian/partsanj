import type { BrandMutationResponse, UpdateBrandPayload } from '@/lib/admin/catalog/brand.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateBrandPayload;

    const result = await adminNestApi<BrandMutationResponse>(
      `${ADMIN_CATALOG_API_PATH}/brands/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
