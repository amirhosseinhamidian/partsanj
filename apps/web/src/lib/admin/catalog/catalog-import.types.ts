export type CatalogImportEntity = 'products' | 'brands' | 'categories';

export type CatalogImportMode = 'CREATE_ONLY' | 'UPSERT';

export type CatalogImportRowAction = 'CREATE' | 'UPDATE' | null;

export type CatalogImportRowError = {
  code: string;
  field: string;
  value: string | null;
  message: string;
};

export type CatalogImportSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createCount: number;
  updateCount: number;
};

export type ProductImportPreviewRow = {
  rowNumber: number;
  sku: string;
  name: string;
  slug: string;
  brandSlug: string;
  categorySlug: string;
  action: CatalogImportRowAction;
  valid: boolean;
  errors: CatalogImportRowError[];
  warnings: unknown[];
  normalized: {
    priceToman: number | null;
    salePriceToman: number | null;
    stockQuantity: number | null;
    stockStatus: string | null;
    lowStockThreshold: number | null;
    shortDescription: string | null;
    description: string | null;
  };
};

export type MissingBrandReference = {
  slug: string;
  affectedRows: number[];
  suggestedNames: string[];
  canCreate: boolean;
};

export type MissingCategoryReference = {
  slug: string;
  affectedRows: number[];
  suggestedNames: string[];
  suggestedParentSlugs?: string[];
  canCreate: boolean;
};

export type ProductImportPreview = {
  mode: CatalogImportMode;
  summary: CatalogImportSummary;
  rows: ProductImportPreviewRow[];
  missingReferences: {
    brands: MissingBrandReference[];
    categories: MissingCategoryReference[];
  };
};

export type BrandImportPreviewRow = {
  rowNumber: number;
  name: string;
  slug: string;
  isActive: boolean | null;
  logoUrl: string | null;
  action: CatalogImportRowAction;
  valid: boolean;
  errors: CatalogImportRowError[];
};

export type BrandImportPreview = {
  entity: 'BRAND';
  mode: CatalogImportMode;
  summary: CatalogImportSummary;
  rows: BrandImportPreviewRow[];
};

export type CategoryImportPreviewRow = {
  rowNumber: number;
  name: string;
  slug: string;
  parentSlug: string | null;
  isActive: boolean | null;
  sortOrder: number | null;
  showOnHome: boolean | null;
  imageUrl: string | null;
  imageAlt: string | null;
  action: CatalogImportRowAction;
  valid: boolean;
  errors: CatalogImportRowError[];
};

export type CategoryImportPreview = {
  entity: 'CATEGORY';
  mode: CatalogImportMode;
  summary: CatalogImportSummary;
  rows: CategoryImportPreviewRow[];
};

export type CatalogImportPreview =
  | ProductImportPreview
  | BrandImportPreview
  | CategoryImportPreview;

export type ImportedProductResult = {
  id: string;
  sku: string;
  name: string;
  action: Exclude<CatalogImportRowAction, null>;
  rowNumber: number;
};

export type ProductImportExecutionResult = {
  batchId: string;
  mode: CatalogImportMode;
  summary: {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
  };
  products: ImportedProductResult[];
};

export type ImportedBrandResult = {
  id: string;
  name: string;
  slug: string;
  action: Exclude<CatalogImportRowAction, null>;
  rowNumber: number;
};

export type BrandImportExecutionResult = {
  batchId: string;
  entity: 'BRAND';
  mode: CatalogImportMode;
  summary: {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
  };
  brands: ImportedBrandResult[];
};

export type ImportedCategoryResult = {
  id: string;
  name: string;
  slug: string;
  action: Exclude<CatalogImportRowAction, null>;
  rowNumber: number;
};

export type CategoryImportExecutionResult = {
  batchId: string;
  entity: 'CATEGORY';
  mode: CatalogImportMode;
  summary: {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
  };
  categories: ImportedCategoryResult[];
};

export type CatalogImportExecutionResult =
  | ProductImportExecutionResult
  | BrandImportExecutionResult
  | CategoryImportExecutionResult;

export type QuickCreateCatalogReference =
  | {
      kind: 'brand';
      slug: string;
      suggestedName: string;
    }
  | {
      kind: 'category';
      slug: string;
      suggestedName: string;
      suggestedParentSlug: string;
    };

export type QuickCreateCatalogReferenceInput = {
  kind: 'brand' | 'category';
  name: string;
  slug: string;
  parentSlug?: string;
};
