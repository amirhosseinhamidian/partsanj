import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  StorefrontVehicleMakesResponse,
  StorefrontVehicleModelsResponse,
  StorefrontVehicleVariantsResponse,
} from '@/lib/storefront/vehicles/vehicle.types';

const STOREFRONT_VEHICLES_API_PATH = '/api/vehicles';

export const storefrontVehiclesApi = {
  listMakes(): Promise<StorefrontVehicleMakesResponse> {
    return requestStorefrontApi<StorefrontVehicleMakesResponse>(
      `${STOREFRONT_VEHICLES_API_PATH}/makes`,
    );
  },

  listModelsByMakeSlug(makeSlug: string): Promise<StorefrontVehicleModelsResponse> {
    return requestStorefrontApi<StorefrontVehicleModelsResponse>(
      `${STOREFRONT_VEHICLES_API_PATH}/makes/${encodeURIComponent(makeSlug)}/models`,
    );
  },

  listVariantsByModelSlug(modelSlug: string): Promise<StorefrontVehicleVariantsResponse> {
    return requestStorefrontApi<StorefrontVehicleVariantsResponse>(
      `${STOREFRONT_VEHICLES_API_PATH}/models/${encodeURIComponent(modelSlug)}/variants`,
    );
  },
};
