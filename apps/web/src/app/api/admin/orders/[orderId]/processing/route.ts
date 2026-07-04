import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  ADMIN_ORDERS_API_PATH,
  adminOrderNestApi,
  createAdminOrderProxyResponse,
} from '@/lib/server/admin-order-api';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { orderId } = await context.params;

    if (!orderId) {
      throw new ApiRequestError('شناسه سفارش معتبر نیست', 400, 'INVALID_ORDER_ID');
    }

    const result = await adminOrderNestApi<unknown>(
      `${ADMIN_ORDERS_API_PATH}/${encodeURIComponent(orderId)}/processing`,
      {
        method: 'POST',
      },
    );

    return createAdminOrderProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
