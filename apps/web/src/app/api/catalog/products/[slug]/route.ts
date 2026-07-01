import { apiErrorResponse } from '@/lib/api/route-response';
import { PUBLIC_CATALOG_API_PATH, publicNestApi } from '@/lib/server/public-api';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const result = await publicNestApi<unknown>(
      `${PUBLIC_CATALOG_API_PATH}/products/${encodeURIComponent(slug)}`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
