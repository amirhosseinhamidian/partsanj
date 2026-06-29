import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import type {
  CategoryListResponse,
  CategoryMutationResponse,
  CreateCategoryPayload,
} from '@/lib/admin/catalog/category.types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await adminNestApi<CategoryListResponse>(
      `${ADMIN_CATALOG_API_PATH}/categories`,
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
    const body = (await request.json()) as CreateCategoryPayload;

    const result = await adminNestApi<CategoryMutationResponse>(
      `${ADMIN_CATALOG_API_PATH}/categories`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
