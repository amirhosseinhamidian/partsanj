import type {
  VehicleMakesResponse,
  VehicleModelsResponse,
  VehicleVariantsResponse,
} from '@/lib/admin/catalog/vehicle-catalog.types';
import { requestAdminApi } from '@/lib/api/admin-web-client';
import { ClientApiError } from '@/lib/api/web-client';

function requiredId(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new ClientApiError(`${label} الزامی است`, 400, 'REQUIRED_IDENTIFIER_MISSING');
  }

  return normalizedValue;
}

export const adminVehicleCatalogApi = {
  async listMakes(): Promise<VehicleMakesResponse> {
    return requestAdminApi<VehicleMakesResponse>('/api/admin/catalog/vehicle-makes');
  },

  async listModels(makeId: string): Promise<VehicleModelsResponse> {
    const params = new URLSearchParams({
      makeId: requiredId(makeId, 'شناسه برند خودرو'),
    });

    return requestAdminApi<VehicleModelsResponse>(
      `/api/admin/catalog/vehicle-models?${params.toString()}`,
    );
  },

  async listVariants(modelId: string): Promise<VehicleVariantsResponse> {
    const params = new URLSearchParams({
      modelId: requiredId(modelId, 'شناسه مدل خودرو'),
    });

    return requestAdminApi<VehicleVariantsResponse>(
      `/api/admin/catalog/vehicle-variants?${params.toString()}`,
    );
  },
};
