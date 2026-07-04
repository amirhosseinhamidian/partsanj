import { apiErrorResponse } from '@/lib/api/route-response';
import {
  ADMIN_ORDERS_API_PATH,
  adminOrderNestApi,
  createAdminOrderProxyResponse,
} from '@/lib/server/admin-order-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const queryString = request.nextUrl.searchParams.toString();

    const path = queryString ? `${ADMIN_ORDERS_API_PATH}?${queryString}` : ADMIN_ORDERS_API_PATH;

    const result = await adminOrderNestApi<unknown>(path);

    return createAdminOrderProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
