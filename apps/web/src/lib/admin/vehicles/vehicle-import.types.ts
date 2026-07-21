export type VehicleImportEntity = 'makes' | 'models' | 'variants';
export type VehicleImportMode = 'CREATE_ONLY' | 'UPSERT';
export type VehicleImportAction = 'CREATE' | 'UPDATE' | null;

export type VehicleImportRowError = {
  code: string;
  field: string;
  value: string | null;
  message: string;
};

export type VehicleImportSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createCount: number;
  updateCount: number;
};

export type MissingVehicleMakeReference = {
  slug: string;
  affectedRows: number[];
  suggestedNames: string[];
  canCreate: boolean;
};

export type MissingVehicleModelReference = {
  slug: string;
  makeSlug: string;
  affectedRows: number[];
  suggestedNames: string[];
  canCreate: boolean;
};

export type VehicleMakeImportRow = {
  rowNumber: number;
  name: string;
  slug: string;
  isActive: boolean | null;
  sortOrder: number | null;
  logoUrl: string | null;
  action: VehicleImportAction;
  valid: boolean;
  errors: VehicleImportRowError[];
};

export type VehicleModelImportRow = {
  rowNumber: number;
  makeSlug: string;
  makeName: string;
  name: string;
  slug: string;
  isActive: boolean | null;
  sortOrder: number | null;
  imageUrl: string | null;
  action: VehicleImportAction;
  valid: boolean;
  errors: VehicleImportRowError[];
};

export type VehicleVariantImportRow = {
  rowNumber: number;
  makeSlug: string;
  makeName: string;
  modelSlug: string;
  modelName: string;
  name: string;
  slug: string;
  engineCode: string | null;
  engineName: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  yearCalendar: 'SHAMSI' | 'GREGORIAN' | null;
  notes: string | null;
  isActive: boolean | null;
  sortOrder: number | null;
  action: VehicleImportAction;
  valid: boolean;
  errors: VehicleImportRowError[];
};

type BaseVehicleImportPreview = {
  mode: VehicleImportMode;
  summary: VehicleImportSummary;
  missingReferences: {
    makes: MissingVehicleMakeReference[];
    models: MissingVehicleModelReference[];
  };
};

export type VehicleMakeImportPreview = BaseVehicleImportPreview & {
  entity: 'VEHICLE_MAKE';
  rows: VehicleMakeImportRow[];
};

export type VehicleModelImportPreview = BaseVehicleImportPreview & {
  entity: 'VEHICLE_MODEL';
  rows: VehicleModelImportRow[];
};

export type VehicleVariantImportPreview = BaseVehicleImportPreview & {
  entity: 'VEHICLE_VARIANT';
  rows: VehicleVariantImportRow[];
};

export type VehicleImportPreview =
  | VehicleMakeImportPreview
  | VehicleModelImportPreview
  | VehicleVariantImportPreview;

export type VehicleImportExecutionResult = {
  batchId: string;
  entity: 'VEHICLE_MAKE' | 'VEHICLE_MODEL' | 'VEHICLE_VARIANT';
  mode: VehicleImportMode;
  summary: {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
  };
  makes?: Array<{
    id: string;
    name: string;
    slug: string;
    action: 'CREATE' | 'UPDATE';
    rowNumber: number;
  }>;
  models?: Array<{
    id: string;
    name: string;
    slug: string;
    action: 'CREATE' | 'UPDATE';
    rowNumber: number;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    slug: string;
    action: 'CREATE' | 'UPDATE';
    rowNumber: number;
  }>;
};

export type VehicleQuickCreateReference =
  | {
      kind: 'make';
      slug: string;
      suggestedName: string;
    }
  | {
      kind: 'model';
      slug: string;
      makeSlug: string;
      suggestedName: string;
    };
