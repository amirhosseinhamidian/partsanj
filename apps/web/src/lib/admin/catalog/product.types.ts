export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'CHECK_AVAILABILITY';

export type ProductCodeType = 'OEM' | 'TECHNICAL' | 'SUPPLIER';

export type ProductAuditAction = 'CREATED' | 'UPDATED' | 'COMPATIBILITIES_UPDATED' | 'ARCHIVED';

export type AdminProductCode = {
  type: ProductCodeType;
  value: string;
};

export type AdminProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type AdminProductBrand = {
  id: string;
  name: string;
  slug: string;
};

export type AdminProductCategory = {
  id: string;
  name: string;
  slug: string;
};

export type AdminProductListItem = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  priceToman: number | null;
  salePriceToman: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;

  effectivePriceToman: number | null;
  discountAmountToman: number;
  discountPercent: number;
  isSaleActive: boolean;
  stockStatus: StockStatus;
  status: ProductStatus;
  isPublished: boolean;
  isTorobEnabled: boolean;
  showOnHome: boolean;
  homeSortOrder: number;
  updatedAt: string;
  brand: AdminProductBrand;
  category: AdminProductCategory;
  codes: AdminProductCode[];
  images: AdminProductImage[];
};

export type AdminProductsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminProductsListResponse = {
  data: AdminProductListItem[];
  meta: AdminProductsMeta;
};

export type FindAdminProductsQuery = {
  q?: string;
  status?: ProductStatus;
  stockStatus?: StockStatus;
  brandId?: string;
  categoryId?: string;
  page: number;
  limit: number;
};

export type ProductCodeInput = {
  type: ProductCodeType;
  value: string;
};

export type ProductInput = {
  sku: string;
  slug: string;
  name: string;

  shortDescription?: string;
  description?: string;

  specifications?: Record<string, unknown>;

  priceToman?: number;
  stockStatus?: StockStatus;
  status?: ProductStatus;

  isPublished?: boolean;
  isTorobEnabled?: boolean;
  showOnHome?: boolean;
  homeSortOrder?: number;

  brandId: string;
  categoryId: string;

  codes?: ProductCodeInput[];
  images?: ProductImageInput[];
};

export type CreateProductPayload = ProductInput;

export type AdminProductDetailBrand = AdminProductBrand & {
  isActive: boolean;
};

export type AdminProductDetailCategory = AdminProductCategory & {
  isActive: boolean;
};

export type AdminProductDetailCode = ProductCodeInput & {
  id: string;
  productId: string;
  createdAt: string;
};

export type AdminProductDetailImage = ProductImageInput & {
  id: string;
  productId: string;
  alt: string | null;
  createdAt: string;
};

export type AdminProductCompatibility = {
  id: string;
  notes: string | null;
  requiresVerification: boolean;
  createdAt: string;
  updatedAt: string;

  vehicleVariant: {
    id: string;
    name: string;
    slug: string;
    engineCode: string | null;
    engineName: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    yearCalendar: 'SHAMSI' | 'GREGORIAN';
    isActive: boolean;

    model: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;

      make: {
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
      };
    };
  };
};

export type AdminProductAuditLog = {
  id: string;
  action: ProductAuditAction;
  changes: unknown;
  createdAt: string;

  actorUser: {
    id: string;
    mobile: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
};

export type AdminProductDetail = {
  id: string;
  sku: string;
  slug: string;
  name: string;

  shortDescription: string | null;
  description: string | null;

  specifications: Record<string, unknown> | null;

  priceToman: number | null;
  salePriceToman: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;

  effectivePriceToman: number | null;
  discountAmountToman: number;
  discountPercent: number;
  isSaleActive: boolean;
  stockStatus: StockStatus;
  status: ProductStatus;

  isPublished: boolean;
  isTorobEnabled: boolean;
  showOnHome: boolean;
  homeSortOrder: number;

  createdAt: string;
  updatedAt: string;

  brand: AdminProductDetailBrand;
  category: AdminProductDetailCategory;

  codes: AdminProductDetailCode[];
  images: AdminProductDetailImage[];

  compatibilities: AdminProductCompatibility[];
  auditLogs: AdminProductAuditLog[];
};

export type ProductDetailResponse = {
  data: AdminProductDetail;
};

export type ProductImageInput = {
  url: string;
  alt?: string | null;
  sortOrder: number;
};

export type UpdateProductPayload = Omit<
  Partial<ProductInput>,
  'priceToman' | 'salePriceToman' | 'saleStartsAt' | 'saleEndsAt'
> & {
  priceToman?: number | null;
  salePriceToman?: number | null;
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
};

export type ProductPricingFields = {
  priceToman: number | null;
  salePriceToman: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;

  effectivePriceToman: number | null;
  discountAmountToman: number;
  discountPercent: number;
  isSaleActive: boolean;
};
