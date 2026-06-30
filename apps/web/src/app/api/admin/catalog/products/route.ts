import type {
  AdminProductsListResponse,
  CreateProductPayload,
  ProductDetailResponse,
} from '@/lib/admin/catalog/product.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const result = await adminNestApi<AdminProductsListResponse>(
      `${ADMIN_CATALOG_API_PATH}/products${url.search}`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateProductPayload;

    const result = await adminNestApi<ProductDetailResponse>(`${ADMIN_CATALOG_API_PATH}/products`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
