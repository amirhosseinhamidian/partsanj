import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  CreateOrderFromCartInput,
  OrderApiResponse,
  StorefrontCreatedOrder,
  StorefrontOrderDetail,
} from '@/lib/storefront/order/order.types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export const storefrontOrderApi = {
  createFromCart(input: CreateOrderFromCartInput) {
    return requestStorefrontApi<OrderApiResponse<StorefrontCreatedOrder>>('/api/orders/from-cart', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input),
    });
  },

  getById(orderId: string) {
    return requestStorefrontApi<OrderApiResponse<StorefrontOrderDetail>>(
      `/api/orders/${encodeURIComponent(orderId)}`,
    );
  },
};
