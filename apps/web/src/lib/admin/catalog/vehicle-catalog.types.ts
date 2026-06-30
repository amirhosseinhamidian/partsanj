export type VehicleYearCalendar = 'SHAMSI' | 'GREGORIAN';

export type AdminVehicleMake = {
  id: string;
  name: string;
  slug: string;
};

export type AdminVehicleModel = {
  id: string;
  name: string;
  slug: string;
  makeId: string;
};

export type AdminVehicleVariant = {
  id: string;
  name: string;
  slug: string;

  engineCode: string | null;
  engineName: string | null;

  yearFrom: number | null;
  yearTo: number | null;
  yearCalendar: VehicleYearCalendar;

  notes: string | null;

  model: {
    id: string;
    name: string;
    slug: string;

    make: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

export type VehicleCatalogListResponse<T> = {
  data: T[];
};

export type VehicleMakesResponse = VehicleCatalogListResponse<AdminVehicleMake>;

export type VehicleModelsResponse = VehicleCatalogListResponse<AdminVehicleModel>;

export type VehicleVariantsResponse = VehicleCatalogListResponse<AdminVehicleVariant>;
