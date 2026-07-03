import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  createPaymentProxyResponse,
  paymentNestApi,
  PAYMENT_API_PATH,
} from '@/lib/server/payment-api';

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

    const result = await paymentNestApi<unknown>(
      `${PAYMENT_API_PATH}/orders/${encodeURIComponent(orderId)}/start`,
      {
        method: 'POST',
      },
    );

    return createPaymentProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
