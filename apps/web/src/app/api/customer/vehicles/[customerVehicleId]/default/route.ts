import { apiErrorResponse } from '@/lib/api/route-response';
import {
  createCustomerVehicleProxyResponse,
  customerVehicleDefaultApiPath,
  customerVehicleNestApi,
} from '@/lib/server/customer-vehicle-api';
import type { CustomerVehicleResponse } from '@/lib/storefront/customer-vehicle/customer-vehicle.types';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    customerVehicleId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { customerVehicleId } = await context.params;

    const result = await customerVehicleNestApi<CustomerVehicleResponse>(
      customerVehicleDefaultApiPath(customerVehicleId),
      {
        method: 'POST',
      },
    );

    return createCustomerVehicleProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
