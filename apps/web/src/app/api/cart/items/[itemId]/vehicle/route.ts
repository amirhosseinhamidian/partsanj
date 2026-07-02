import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import { CART_API_PATH, cartNestApi, createCartProxyResponse } from '@/lib/server/cart-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { itemId } = await context.params;

    if (!itemId) {
      throw new ApiRequestError('شناسه آیتم سبد خرید معتبر نیست', 400, 'INVALID_CART_ITEM_ID');
    }

    const body: unknown = await request.json().catch(() => {
      throw new ApiRequestError('اطلاعات خودرو معتبر نیست', 400, 'INVALID_REQUEST_BODY');
    });

    const result = await cartNestApi<unknown>(
      request,
      `${CART_API_PATH}/items/${encodeURIComponent(itemId)}/vehicle`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );

    return createCartProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
