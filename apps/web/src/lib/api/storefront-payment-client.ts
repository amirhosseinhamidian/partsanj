import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  PaymentApiResponse,
  StorefrontPaymentStartResult,
} from '@/lib/storefront/payment/payment.types';

export const storefrontPaymentApi = {
  startOrderPayment(orderId: string) {
    return requestStorefrontApi<PaymentApiResponse<StorefrontPaymentStartResult>>(
      `/api/payments/orders/${encodeURIComponent(orderId)}/start`,
      {
        method: 'POST',
      },
    );
  },
};
