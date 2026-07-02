import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import { createOrderProxyResponse, orderNestApi, ORDER_API_PATH } from '@/lib/server/order-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => {
      throw new ApiRequestError('اطلاعات ثبت سفارش معتبر نیست', 400, 'INVALID_ORDER_BODY');
    });

    const result = await orderNestApi<unknown>(`${ORDER_API_PATH}/from-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return createOrderProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
