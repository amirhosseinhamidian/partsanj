import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  CUSTOMER_PROFILE_API_PATH,
  createCustomerProfileProxyResponse,
  customerProfileNestApi,
} from '@/lib/server/customer-profile-api';
import type {
  CustomerProfileResponse,
  UpdateCustomerProfileInput,
} from '@/lib/storefront/customer-profile/customer-profile.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await customerProfileNestApi<CustomerProfileResponse>(CUSTOMER_PROFILE_API_PATH);

    return createCustomerProfileProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as UpdateCustomerProfileInput;

    if (typeof payload.firstName !== 'string' || typeof payload.lastName !== 'string') {
      throw new ApiRequestError('اطلاعات پروفایل معتبر نیست', 400, 'INVALID_PROFILE_INPUT');
    }

    const result = await customerProfileNestApi<CustomerProfileResponse>(
      CUSTOMER_PROFILE_API_PATH,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: payload.firstName,
          lastName: payload.lastName,
        }),
      },
    );

    return createCustomerProfileProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
