import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  createCustomerVehicleProxyResponse,
  customerVehicleApiPath,
  customerVehicleNestApi,
} from '@/lib/server/customer-vehicle-api';
import type {
  CustomerVehicleResponse,
  DeleteCustomerVehicleResponse,
  UpdateCustomerVehicleInput,
} from '@/lib/storefront/customer-vehicle/customer-vehicle.types';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    customerVehicleId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { customerVehicleId } = await context.params;

    const payload = (await request.json()) as UpdateCustomerVehicleInput;

    if (!payload || (payload.vehicleVariantId === undefined && payload.label === undefined)) {
      throw new ApiRequestError(
        'حداقل یکی از اطلاعات خودرو باید تغییر کند',
        400,
        'EMPTY_CUSTOMER_VEHICLE_UPDATE',
      );
    }

    if (
      payload.vehicleVariantId !== undefined &&
      (typeof payload.vehicleVariantId !== 'string' || !payload.vehicleVariantId.trim())
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
      customerVehicleApiPath(customerVehicleId),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(payload.vehicleVariantId !== undefined
            ? {
                vehicleVariantId: payload.vehicleVariantId,
              }
            : {}),
          ...(payload.label !== undefined
            ? {
                label: payload.label,
              }
            : {}),
        }),
      },
    );

    return createCustomerVehicleProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { customerVehicleId } = await context.params;

    const result = await customerVehicleNestApi<DeleteCustomerVehicleResponse>(
      customerVehicleApiPath(customerVehicleId),
      {
        method: 'DELETE',
      },
    );

    return createCustomerVehicleProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
