import type {
  AdminVehicleMakeListItem,
  AdminVehicleModelListItem,
  AdminVehicleVariantListItem,
  CreateVehicleMakePayload,
  CreateVehicleModelPayload,
  CreateVehicleVariantPayload,
  UpdateVehicleMakePayload,
  UpdateVehicleModelPayload,
  UpdateVehicleVariantPayload,
  VehicleMakesManagementResponse,
  VehicleModelsManagementResponse,
  VehicleVariantsManagementResponse,
} from '@/lib/admin/vehicles/vehicle-management.types';
import { requestAdminApi } from '@/lib/api/admin-web-client';
import { ClientApiError } from '@/lib/api/web-client';

const VEHICLES_API_PATH = '/api/admin/catalog/vehicles';

function requiredId(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new ClientApiError(`${label} الزامی است`, 400, 'REQUIRED_IDENTIFIER_MISSING');
  }

  return normalizedValue;
}

function getMakePath(id?: string): string {
  if (!id) {
    return `${VEHICLES_API_PATH}/makes`;
  }

  return `${VEHICLES_API_PATH}/makes/${encodeURIComponent(requiredId(id, 'شناسه برند خودرو'))}`;
}

function getModelPath(id?: string): string {
  if (!id) {
    return `${VEHICLES_API_PATH}/models`;
  }

  return `${VEHICLES_API_PATH}/models/${encodeURIComponent(requiredId(id, 'شناسه مدل خودرو'))}`;
}

function getVariantPath(id?: string): string {
  if (!id) {
    return `${VEHICLES_API_PATH}/variants`;
  }

  return `${VEHICLES_API_PATH}/variants/${encodeURIComponent(requiredId(id, 'شناسه تیپ خودرو'))}`;
}

export const adminVehiclesApi = {
  async listMakes(): Promise<VehicleMakesManagementResponse> {
    return requestAdminApi<VehicleMakesManagementResponse>(getMakePath());
  },

  async createMake(payload: CreateVehicleMakePayload): Promise<{
    data: AdminVehicleMakeListItem;
  }> {
    return requestAdminApi<{
      data: AdminVehicleMakeListItem;
    }>(getMakePath(), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateMake(
    id: string,
    payload: UpdateVehicleMakePayload,
  ): Promise<{
    data: AdminVehicleMakeListItem;
  }> {
    return requestAdminApi<{
      data: AdminVehicleMakeListItem;
    }>(getMakePath(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async listModels(): Promise<VehicleModelsManagementResponse> {
    return requestAdminApi<VehicleModelsManagementResponse>(getModelPath());
  },

  async createModel(payload: CreateVehicleModelPayload): Promise<{
    data: AdminVehicleModelListItem;
  }> {
    return requestAdminApi<{
      data: AdminVehicleModelListItem;
    }>(getModelPath(), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateModel(
    id: string,
    payload: UpdateVehicleModelPayload,
  ): Promise<{
    data: AdminVehicleModelListItem;
  }> {
    return requestAdminApi<{
      data: AdminVehicleModelListItem;
    }>(getModelPath(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async listVariants(): Promise<VehicleVariantsManagementResponse> {
    return requestAdminApi<VehicleVariantsManagementResponse>(getVariantPath());
  },

  async createVariant(payload: CreateVehicleVariantPayload): Promise<{
    data: AdminVehicleVariantListItem;
  }> {
    return requestAdminApi<{
      data: AdminVehicleVariantListItem;
    }>(getVariantPath(), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateVariant(
    id: string,
    payload: UpdateVehicleVariantPayload,
  ): Promise<{
    data: AdminVehicleVariantListItem;
  }> {
    return requestAdminApi<{
      data: AdminVehicleVariantListItem;
    }>(getVariantPath(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
