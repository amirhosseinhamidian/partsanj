import { apiErrorResponse } from '@/lib/api/route-response';
import { CART_API_PATH, cartNestApi, createCartProxyResponse } from '@/lib/server/cart-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const result = await cartNestApi<unknown>(request, CART_API_PATH, {
      method: 'GET',
    });

    return createCartProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
