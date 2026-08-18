import 'server-only';

import {
  PUBLIC_VEHICLES_API_PATH,
  publicNestApi,
} from '@/lib/server/public-api';
import type {
  StorefrontHomeVehicleModel,
  StorefrontHomeVehicleModelsResponse,
} from '@/lib/storefront/vehicles/vehicle.types';

function getVehicleModelsData(
  result: StorefrontHomeVehicleModelsResponse | StorefrontHomeVehicleModel[],
): StorefrontHomeVehicleModel[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function getHomeVehicleModels(): Promise<StorefrontHomeVehicleModel[]> {
  try {
    const result = await publicNestApi<
      StorefrontHomeVehicleModelsResponse | StorefrontHomeVehicleModel[]
    >(`${PUBLIC_VEHICLES_API_PATH}/home`, {
      method: 'GET',
      next: {
        revalidate: 300,
        tags: ['storefront-vehicle-models', 'home-vehicle-models'],
      },
    });

    return getVehicleModelsData(result);
  } catch {
    return [];
  }
}
