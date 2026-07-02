import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  CUSTOMER_ADDRESS_API_PATH,
  createCustomerAddressProxyResponse,
  customerAddressNestApi,
} from '@/lib/server/customer-address-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    addressId: string;
  }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { addressId } = await context.params;

    if (!addressId) {
      throw new ApiRequestError('شناسه آدرس معتبر نیست', 400, 'INVALID_ADDRESS_ID');
    }

    const result = await customerAddressNestApi<unknown>(
      `${CUSTOMER_ADDRESS_API_PATH}/${encodeURIComponent(addressId)}/default`,
      {
        method: 'POST',
      },
    );

    return createCustomerAddressProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
