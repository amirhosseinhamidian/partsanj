import { apiErrorResponse } from '@/lib/api/route-response';
import {
  CUSTOMER_ORDER_API_PATH,
  createCustomerOrderProxyResponse,
  customerOrderNestApi,
} from '@/lib/server/customer-order-api';
import type { CustomerOrdersListResponse } from '@/lib/storefront/customer/orders/customer-order.types';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

function createCustomerOrdersPath(request: NextRequest) {
  const query = new URLSearchParams();

  const page = request.nextUrl.searchParams.get('page');
  const limit = request.nextUrl.searchParams.get('limit');
  const status = request.nextUrl.searchParams.get('status');

  if (page) {
    query.set('page', page);
  }

  if (limit) {
    query.set('limit', limit);
  }

  if (status) {
    query.set('status', status);
  }

  const queryString = query.toString();

  return queryString ? `${CUSTOMER_ORDER_API_PATH}?${queryString}` : CUSTOMER_ORDER_API_PATH;
}

export async function GET(request: NextRequest) {
  try {
    const result = await customerOrderNestApi<CustomerOrdersListResponse>(
      createCustomerOrdersPath(request),
    );

    return createCustomerOrderProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
