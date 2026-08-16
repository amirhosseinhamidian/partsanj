import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';

import type {
  CategoryComplementsResponse,
  ReplaceCategoryComplementsPayload,
} from '@/lib/admin/catalog/category.types';

import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const body = (await request.json()) as ReplaceCategoryComplementsPayload;

    const result = await adminNestApi<CategoryComplementsResponse>(
      `${ADMIN_CATALOG_API_PATH}/categories/${id}/complements`,
      {
        method: 'PUT',

        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
