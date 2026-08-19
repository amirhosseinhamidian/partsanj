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

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const result = await storefrontInteractionNestApi<unknown>(
      `${PRODUCT_INTERACTION_API_PATH}/${encodeURIComponent(slug)}/questions`,
      {
        method: 'GET',
      },
    );

    return createStorefrontInteractionProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const body = await request.text();

    const result = await storefrontInteractionNestApi<unknown>(
      `${PRODUCT_INTERACTION_API_PATH}/${encodeURIComponent(slug)}/questions`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body,
      },
      true,
    );

    return createStorefrontInteractionProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
