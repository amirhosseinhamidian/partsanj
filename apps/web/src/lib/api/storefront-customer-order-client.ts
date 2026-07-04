import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  CustomerOrderDetailResponse,
  CustomerOrdersListResponse,
  FindCustomerOrdersInput,
} from '@/lib/storefront/customer/orders/customer-order.types';

function createOrdersQuery(input: FindCustomerOrdersInput = {}) {
  const query = new URLSearchParams();

  if (input.page) {
    query.set('page', String(input.page));
  }

  if (input.limit) {
    query.set('limit', String(input.limit));
  }

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
}

export const storefrontCustomerOrderApi = {
  list(input: FindCustomerOrdersInput = {}) {
    return requestStorefrontApi<CustomerOrdersListResponse>(
      `/api/customer/orders${createOrdersQuery(input)}`,
    );
  },

  findById(orderId: string) {
    return requestStorefrontApi<CustomerOrderDetailResponse>(
      `/api/customer/orders/${encodeURIComponent(orderId)}`,
    );
  },
};
