import { apiErrorResponse } from '@/lib/api/route-response';

import {
  PRODUCT_INTERACTION_API_PATH,
  createStorefrontInteractionProxyResponse,
  storefrontInteractionNestApi,
} from '@/lib/server/storefront-interaction-api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const query = request.nextUrl.searchParams.toString();

    const path =
      `${PRODUCT_INTERACTION_API_PATH}/${encodeURIComponent(slug)}/reviews` +
      (query ? `?${query}` : '');

    const result = await storefrontInteractionNestApi<unknown>(path, {
      method: 'GET',
    });

    return createStorefrontInteractionProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
