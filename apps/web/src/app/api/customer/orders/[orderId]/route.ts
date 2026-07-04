import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  CUSTOMER_ORDER_API_PATH,
  createCustomerOrderProxyResponse,
  customerOrderNestApi,
} from '@/lib/server/customer-order-api';
import type { CustomerOrderDetailResponse } from '@/lib/storefront/customer/orders/customer-order.types';

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

    const result = await customerOrderNestApi<CustomerOrderDetailResponse>(
      `${CUSTOMER_ORDER_API_PATH}/${encodeURIComponent(orderId)}`,
    );

    return createCustomerOrderProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
