import { apiErrorResponse } from '@/lib/api/route-response';
import { PUBLIC_VEHICLES_API_PATH, publicNestApi } from '@/lib/server/public-api';
import type { StorefrontVehicleMakesResponse } from '@/lib/storefront/vehicles/vehicle.types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await publicNestApi<StorefrontVehicleMakesResponse>(
      `${PUBLIC_VEHICLES_API_PATH}/makes`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
