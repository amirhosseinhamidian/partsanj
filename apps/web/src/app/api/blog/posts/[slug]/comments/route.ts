import { apiErrorResponse } from '@/lib/api/route-response';

import {
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
      `/api/v1/blog/posts/${encodeURIComponent(slug)}/comments` + (query ? `?${query}` : '');

    const result = await storefrontInteractionNestApi<unknown>(path, {
      method: 'GET',
    });

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
      `/api/v1/blog/posts/${encodeURIComponent(slug)}/comments`,
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
