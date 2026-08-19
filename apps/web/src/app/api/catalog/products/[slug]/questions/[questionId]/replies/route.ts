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
    questionId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug, questionId } = await context.params;

    const body = await request.text();

    const result = await storefrontInteractionNestApi<unknown>(
      `${PRODUCT_INTERACTION_API_PATH}/${encodeURIComponent(slug)}/questions/${encodeURIComponent(questionId)}/replies`,
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
