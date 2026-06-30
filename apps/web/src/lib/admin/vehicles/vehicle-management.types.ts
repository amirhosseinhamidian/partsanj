import type { VehicleYearCalendar } from '@/lib/admin/catalog/vehicle-catalog.types';

export type AdminVehicleMakeListItem = AdminVehicleMakeSummary & {
  _count: {
    models: number;
  };
};

export type AdminVehicleModelListItem = AdminVehicleModelSummary & {
  makeId: string;
  make: AdminVehicleMakeSummary;
  _count: {
    variants: number;
  };
};

export type AdminVehicleVariantListItem = {
  id: string;
  modelId: string;
  name: string;
  slug: string;

  engineCode: string | null;
  engineName: string | null;

  yearFrom: number | null;
  yearTo: number | null;
  yearCalendar: VehicleYearCalendar;

  notes: string | null;

  isActive: boolean;
  sortOrder: number;

  model: AdminVehicleModelSummary & {
    make: AdminVehicleMakeSummary;
  };

  _count: {
    compatibilities: number;
  };
};

export type VehicleManagementListResponse<T> = {
  data: T[];
};

export type VehicleMakesManagementResponse =
  VehicleManagementListResponse<AdminVehicleMakeListItem>;

export type VehicleModelsManagementResponse =
  VehicleManagementListResponse<AdminVehicleModelListItem>;

export type VehicleVariantsManagementResponse =
  VehicleManagementListResponse<AdminVehicleVariantListItem>;

export type CreateVehicleVariantPayload = {
  modelId: string;
  name: string;
  slug: string;

  engineCode?: string;
  engineName?: string;

  yearFrom?: number;
  yearTo?: number;
  yearCalendar: VehicleYearCalendar;

  notes?: string;

  isActive: boolean;
  sortOrder: number;
};

export type UpdateVehicleVariantPayload = {
  modelId?: string;
  name?: string;
  slug?: string;

  engineCode?: string | null;
  engineName?: string | null;

  yearFrom?: number | null;
  yearTo?: number | null;
  yearCalendar?: VehicleYearCalendar;

  notes?: string | null;

  isActive?: boolean;
  sortOrder?: number;
};

export type AdminVehicleMakeSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type AdminVehicleModelSummary = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type CreateVehicleMakePayload = {
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  sortOrder: number;
};

export type UpdateVehicleMakePayload = Partial<Omit<CreateVehicleMakePayload, 'logoUrl'>> & {
  logoUrl?: string | null;
};

export type CreateVehicleModelPayload = {
  makeId: string;
  name: string;
  slug: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
};

export type UpdateVehicleModelPayload = Partial<Omit<CreateVehicleModelPayload, 'imageUrl'>> & {
  imageUrl?: string | null;
};
