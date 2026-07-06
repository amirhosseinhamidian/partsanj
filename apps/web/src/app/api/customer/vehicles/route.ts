import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  CUSTOMER_VEHICLES_API_PATH,
  createCustomerVehicleProxyResponse,
  customerVehicleNestApi,
} from '@/lib/server/customer-vehicle-api';
import type {
  CreateCustomerVehicleInput,
  CustomerVehicleResponse,
  CustomerVehiclesResponse,
} from '@/lib/storefront/customer-vehicle/customer-vehicle.types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await customerVehicleNestApi<CustomerVehiclesResponse>(
      CUSTOMER_VEHICLES_API_PATH,
    );

    return createCustomerVehicleProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateCustomerVehicleInput;

    if (
      !payload ||
      typeof payload.vehicleVariantId !== 'string' ||
      !payload.vehicleVariantId.trim()
    ) {
      throw new ApiRequestError('انتخاب خودرو معتبر نیست', 400, 'INVALID_CUSTOMER_VEHICLE_INPUT');
    }

    if (
      payload.label !== undefined &&
      payload.label !== null &&
      typeof payload.label !== 'string'
    ) {
      throw new ApiRequestError('عنوان خودرو معتبر نیست', 400, 'INVALID_CUSTOMER_VEHICLE_LABEL');
    }

    const result = await customerVehicleNestApi<CustomerVehicleResponse>(
      CUSTOMER_VEHICLES_API_PATH,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleVariantId: payload.vehicleVariantId,
          label: payload.label,
        }),
      },
    );

    return createCustomerVehicleProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
