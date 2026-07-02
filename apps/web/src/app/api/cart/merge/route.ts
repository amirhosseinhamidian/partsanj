import { apiErrorResponse } from '@/lib/api/route-response';
import { createCartProxyResponse, mergeGuestCartNestApi } from '@/lib/server/cart-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const result = await mergeGuestCartNestApi<unknown>(request);

    return createCartProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
