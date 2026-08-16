export type VehicleYearCalendar = 'SHAMSI' | 'GREGORIAN';

export type StorefrontVehicleMake = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sortOrder: number;
};

export type StorefrontVehicleMakeContext = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type StorefrontVehicleModel = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageAlt?: string | null;
  sortOrder: number;
};

export type StorefrontVehicleModelContext = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  make: StorefrontVehicleMakeContext;
};

export type StorefrontVehicleVariant = {
  id: string;
  name: string;
  slug: string;
  engineCode: string | null;
  engineName: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  yearCalendar: VehicleYearCalendar;
  notes: string | null;
  sortOrder: number;
};

export type StorefrontVehicleMakesResponse = {
  data: StorefrontVehicleMake[];
};

export type StorefrontVehicleModelsResponse = {
  data: {
    make: StorefrontVehicleMakeContext;
    models: StorefrontVehicleModel[];
  };
};

export type StorefrontVehicleVariantsResponse = {
  data: {
    model: StorefrontVehicleModelContext;
    variants: StorefrontVehicleVariant[];
  };
};

export type StorefrontVehicleSelection = {
  make: StorefrontVehicleMake;
  model: StorefrontVehicleModel;
  variant: StorefrontVehicleVariant;
};

export type StorefrontVehicleSelectionInput = {
  makeSlug: string;
  modelSlug: string;
  variantId: string;
};

export type StorefrontVehicleModelSeoFields = {
  description: string | null;

  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

export type StorefrontVehicleModelDetail = StorefrontVehicleModelSeoFields & {
  id: string;
  name: string;
  slug: string;

  imageUrl: string | null;
  imageAlt: string | null;

  updatedAt: string;

  make: StorefrontVehicleMakeContext;

  variants: StorefrontVehicleVariant[];
};

export type StorefrontVehicleModelDetailResponse = {
  data: StorefrontVehicleModelDetail;
};

export type StorefrontVehicleModelLandingListItem = {
  id: string;
  name: string;
  slug: string;

  imageUrl: string | null;
  imageAlt: string | null;

  noIndex: boolean;
  sortOrder: number;
  updatedAt: string;

  make: StorefrontVehicleMakeContext;
};

export type StorefrontVehicleModelsLandingResponse = {
  data: StorefrontVehicleModelLandingListItem[];
};
