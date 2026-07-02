import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import { CART_API_PATH, cartNestApi, createCartProxyResponse } from '@/lib/server/cart-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => {
      throw new ApiRequestError(
        'اطلاعات افزودن به سبد خرید معتبر نیست',
        400,
        'INVALID_REQUEST_BODY',
      );
    });

    const result = await cartNestApi<unknown>(request, `${CART_API_PATH}/items`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return createCartProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
