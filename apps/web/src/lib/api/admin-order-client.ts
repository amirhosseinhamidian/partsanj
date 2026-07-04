import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  AdminOrderResponse,
  AdminOrdersListResponse,
  CancelAdminOrderInput,
  FindAdminOrdersInput,
  MarkOrderShippedInput,
} from '@/lib/admin/orders/admin-order.types';

function toQueryString(input: FindAdminOrdersInput) {
  const params = new URLSearchParams();

  if (input.q?.trim()) {
    params.set('q', input.q.trim());
  }

  if (input.status) {
    params.set('status', input.status);
  }

  if (input.paymentStatus) {
    params.set('paymentStatus', input.paymentStatus);
  }

  if (input.createdFrom) {
    params.set('createdFrom', input.createdFrom);
  }

  if (input.createdTo) {
    params.set('createdTo', input.createdTo);
  }

  if (input.page) {
    params.set('page', String(input.page));
  }

  if (input.limit) {
    params.set('limit', String(input.limit));
  }

  return params.toString();
}

export const adminOrderApi = {
  findOrders(input: FindAdminOrdersInput = {}) {
    const queryString = toQueryString(input);

    return requestStorefrontApi<AdminOrdersListResponse>(
      queryString ? `/api/admin/orders?${queryString}` : '/api/admin/orders',
    );
  },

  findOrderById(orderId: string) {
    return requestStorefrontApi<AdminOrderResponse>(
      `/api/admin/orders/${encodeURIComponent(orderId)}`,
    );
  },

  markProcessing(orderId: string) {
    return requestStorefrontApi<AdminOrderResponse>(
      `/api/admin/orders/${encodeURIComponent(orderId)}/processing`,
      {
        method: 'POST',
      },
    );
  },

  markShipped(orderId: string, input: MarkOrderShippedInput) {
    return requestStorefrontApi<AdminOrderResponse>(
      `/api/admin/orders/${encodeURIComponent(orderId)}/shipment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
    );
  },

  markDelivered(orderId: string) {
    return requestStorefrontApi<AdminOrderResponse>(
      `/api/admin/orders/${encodeURIComponent(orderId)}/delivered`,
      {
        method: 'POST',
      },
    );
  },

  cancelOrder(orderId: string, input: CancelAdminOrderInput) {
    return requestStorefrontApi<AdminOrderResponse>(
      `/api/admin/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      },
    );
  },
};
