import { apiErrorResponse } from '@/lib/api/route-response';

import {
  createStorefrontInteractionProxyResponse,
  storefrontInteractionNestApi,
} from '@/lib/server/storefront-interaction-api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const result = await storefrontInteractionNestApi<unknown>(
      '/api/v1/interactions/reports',
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
