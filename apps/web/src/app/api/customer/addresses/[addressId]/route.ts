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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { addressId } = await context.params;

    if (!addressId) {
      throw new ApiRequestError('شناسه آدرس معتبر نیست', 400, 'INVALID_ADDRESS_ID');
    }

    const body: unknown = await request.json().catch(() => {
      throw new ApiRequestError('اطلاعات ویرایش آدرس معتبر نیست', 400, 'INVALID_ADDRESS_BODY');
    });

    const result = await customerAddressNestApi<unknown>(
      `${CUSTOMER_ADDRESS_API_PATH}/${encodeURIComponent(addressId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    return createCustomerAddressProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { addressId } = await context.params;

    if (!addressId) {
      throw new ApiRequestError('شناسه آدرس معتبر نیست', 400, 'INVALID_ADDRESS_ID');
    }

    const result = await customerAddressNestApi<unknown>(
      `${CUSTOMER_ADDRESS_API_PATH}/${encodeURIComponent(addressId)}`,
      {
        method: 'DELETE',
      },
    );

    return createCustomerAddressProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
