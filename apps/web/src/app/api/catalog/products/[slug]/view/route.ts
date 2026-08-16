import { apiErrorResponse } from '@/lib/api/route-response';

import { PUBLIC_CATALOG_API_PATH, publicNestApi } from '@/lib/server/public-api';

import type {
  StorefrontProductViewResponse,
  TrackStorefrontProductViewPayload,
} from '@/lib/storefront/catalog/catalog.types';

import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;

    const body = (await request.json()) as TrackStorefrontProductViewPayload;

    const result = await publicNestApi<StorefrontProductViewResponse>(
      `${PUBLIC_CATALOG_API_PATH}/products/${encodeURIComponent(slug)}/view`,
      {
        method: 'POST',

        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
