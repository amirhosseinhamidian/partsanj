import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  CUSTOMER_ADDRESS_API_PATH,
  createCustomerAddressProxyResponse,
  customerAddressNestApi,
} from '@/lib/server/customer-address-api';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await customerAddressNestApi<unknown>(CUSTOMER_ADDRESS_API_PATH);

    return createCustomerAddressProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => {
      throw new ApiRequestError('اطلاعات آدرس معتبر نیست', 400, 'INVALID_ADDRESS_BODY');
    });

    const result = await customerAddressNestApi<unknown>(CUSTOMER_ADDRESS_API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return createCustomerAddressProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
