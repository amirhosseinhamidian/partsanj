import { apiErrorResponse } from '@/lib/api/route-response';

import {
  PRODUCT_INTERACTION_API_PATH,
  createStorefrontInteractionProxyResponse,
  storefrontInteractionNestApi,
} from '@/lib/server/storefront-interaction-api';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    slug: string;
    reviewId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { slug, reviewId } = await context.params;

    const result = await storefrontInteractionNestApi<unknown>(
      `${PRODUCT_INTERACTION_API_PATH}/${encodeURIComponent(slug)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
      {
        method: 'POST',
      },
      true,
    );

    return createStorefrontInteractionProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { slug, reviewId } = await context.params;

    const result = await storefrontInteractionNestApi<unknown>(
      `${PRODUCT_INTERACTION_API_PATH}/${encodeURIComponent(slug)}/reviews/${encodeURIComponent(reviewId)}/helpful`,
      {
        method: 'DELETE',
      },
      true,
    );

    return createStorefrontInteractionProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
