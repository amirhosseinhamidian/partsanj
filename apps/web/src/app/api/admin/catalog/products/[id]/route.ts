import type {
  ProductDetailResponse,
  UpdateProductPayload,
} from '@/lib/admin/catalog/product.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const result = await adminNestApi<ProductDetailResponse>(
      `${ADMIN_CATALOG_API_PATH}/products/${id}`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const body = (await request.json()) as UpdateProductPayload;

    const result = await adminNestApi<ProductDetailResponse>(
      `${ADMIN_CATALOG_API_PATH}/products/${id}`,
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
