import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import type {
  CategoryMutationResponse,
  DeleteCategoryResponse,
  UpdateCategoryPayload,
} from '@/lib/admin/catalog/category.types';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateCategoryPayload;

    const result = await adminNestApi<CategoryMutationResponse>(
      `${ADMIN_CATALOG_API_PATH}/categories/${id}`,
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

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const result = await adminNestApi<DeleteCategoryResponse>(
      `${ADMIN_CATALOG_API_PATH}/categories/${id}`,
      {
        method: 'DELETE',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
