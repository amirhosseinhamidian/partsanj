import { apiErrorResponse } from '@/lib/api/route-response';
import { PUBLIC_VEHICLES_API_PATH, publicNestApi } from '@/lib/server/public-api';
import type { StorefrontVehicleVariantsResponse } from '@/lib/storefront/vehicles/vehicle.types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const result = await publicNestApi<StorefrontVehicleVariantsResponse>(
      `${PUBLIC_VEHICLES_API_PATH}/models/${encodeURIComponent(slug)}/variants`,
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
