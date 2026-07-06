export type CustomerVehicleMake = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
};

export type CustomerVehicleModel = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  make: CustomerVehicleMake;
};

export type CustomerVehicleVariant = {
  id: string;
  name: string;
  slug: string;
  engineCode: string | null;
  engineName: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  yearCalendar: string | null;
  notes: string | null;
  isActive: boolean;
  model: CustomerVehicleModel;
};

export type CustomerVehicle = {
  id: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  vehicleVariant: CustomerVehicleVariant;
};

export type CustomerVehiclesResponse = {
  data: CustomerVehicle[];
};

export type CustomerVehicleResponse = {
  data: CustomerVehicle;
};

export type DeleteCustomerVehicleResponse = {
  data: {
    deletedId: string;
    promotedDefaultVehicleId: string | null;
  };
};

export type CreateCustomerVehicleInput = {
  vehicleVariantId: string;
  label?: string | null;
};

export type UpdateCustomerVehicleInput = {
  vehicleVariantId?: string;
  label?: string | null;
};
