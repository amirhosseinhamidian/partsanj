import type {
  BrandListResponse,
  BrandMutationResponse,
  CreateBrandPayload,
} from '@/lib/admin/catalog/brand.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await adminNestApi<BrandListResponse>(`${ADMIN_CATALOG_API_PATH}/brands`, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBrandPayload;

    const result = await adminNestApi<BrandMutationResponse>(`${ADMIN_CATALOG_API_PATH}/brands`, {
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
