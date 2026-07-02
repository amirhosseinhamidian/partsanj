import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import { createOrderProxyResponse, orderNestApi, ORDER_API_PATH } from '@/lib/server/order-api';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      throw new ApiRequestError('شناسه سفارش معتبر نیست', 400, 'INVALID_ORDER_ID');
    }

    const result = await orderNestApi<unknown>(`${ORDER_API_PATH}/${encodeURIComponent(orderId)}`);

    return createOrderProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
