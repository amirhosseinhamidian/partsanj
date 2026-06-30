import type { ProductDetailResponse } from '@/lib/admin/catalog/product.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const result = await adminNestApi<ProductDetailResponse>(
      `${ADMIN_CATALOG_API_PATH}/products/${id}/archive`,
      {
        method: 'POST',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
