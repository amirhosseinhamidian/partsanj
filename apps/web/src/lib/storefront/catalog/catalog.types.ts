import type { StorefrontVehicleVariant } from '@/lib/storefront/vehicles/vehicle.types';

export type StorefrontStockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'CHECK_AVAILABILITY';

export type StorefrontProductCodeType = 'OEM' | 'TECHNICAL' | 'BARCODE' | 'INTERNAL';

export type StorefrontBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageAlt: string | null;
  parentId: string | null;
  sortOrder: number;
  showOnHome: boolean;
};

export type StorefrontCategorySeoFields = {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

export type StorefrontCategoryAncestor = {
  id: string;
  name: string;
  slug: string;
};

export type StorefrontCategoryDetail = StorefrontCategorySeoFields &
  StorefrontCategory & {
    description: string | null;
    updatedAt: string;

    ancestors: StorefrontCategoryAncestor[];

    children: StorefrontCategory[];
  };

export type StorefrontCategoryResponse = {
  data: StorefrontCategoryDetail;
};

export type StorefrontProductCode = {
  type: StorefrontProductCodeType;
  value: string;
};

export type StorefrontProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type StorefrontProductPricing = {
  priceToman: number | null;
  salePriceToman: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  effectivePriceToman: number | null;
  discountAmountToman: number;
  discountPercent: number;
  isSaleActive: boolean;
};

export type StorefrontProductListItem = StorefrontProductPricing & {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  stockStatus: StorefrontStockStatus;
  stockQuantity: number;
  updatedAt: string;
  brand: StorefrontBrand;
  category: Pick<StorefrontCategory, 'id' | 'name' | 'slug'>;
  codes: StorefrontProductCode[];
  images: StorefrontProductImage[];
};

export type StorefrontRelatedProduct = StorefrontProductPricing & {
  id: string;
  sku: string;
  slug: string;
  name: string;

  shortDescription: string | null;

  stockStatus: StorefrontStockStatus;

  stockQuantity: number;

  updatedAt: string;

  brand: StorefrontBrand;

  category: Pick<StorefrontCategory, 'id' | 'name' | 'slug'>;

  images: StorefrontProductImage[];
};

export type StorefrontRelatedProductsResponse = {
  data: StorefrontRelatedProduct[];
};

export type StorefrontComplementaryProduct = StorefrontRelatedProduct;

export type StorefrontComplementaryProductsResponse = {
  data: StorefrontComplementaryProduct[];
};

export type TrackStorefrontProductViewPayload = {
  sessionId: string;
  vehicleVariantId?: string;
};

export type StorefrontProductViewResponse = {
  data: {
    recorded: boolean;
  };
};

export type StorefrontProductCompatibility = {
  notes: string | null;
  requiresVerification: boolean;
  vehicleVariant: StorefrontVehicleVariant & {
    model: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string | null;
      make: {
        id: string;
        name: string;
        slug: string;
      };
    };
  };
};

export type StorefrontProductDetail = StorefrontProductSeoFields &
  StorefrontProductPricing & {
    id: string;
    sku: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    description: string | null;
    specifications: unknown | null;
    stockStatus: StorefrontStockStatus;
    stockQuantity: number;
    updatedAt: string;
    brand: StorefrontBrand;
    category: Pick<StorefrontCategory, 'id' | 'name' | 'slug'>;
    codes: StorefrontProductCode[];
    images: StorefrontProductImage[];
    compatibilities: StorefrontProductCompatibility[];
  };

export type StorefrontProductsMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StorefrontProductsResponse = {
  data: StorefrontProductListItem[];
  meta: StorefrontProductsMeta;
};

export type StorefrontProductResponse = {
  data: StorefrontProductDetail;
};

export type StorefrontBrandsResponse = {
  data: StorefrontBrand[];
};

export type StorefrontCategoriesResponse = {
  data: StorefrontCategory[];
};

export type FindStorefrontProductsParams = {
  q?: string;
  brand?: string;
  category?: string;
  vehicleModel?: string;
  vehicleVariantId?: string;
  stockStatus?: StorefrontStockStatus;
  page?: number;
  limit?: number;
};

export type StorefrontProductSeoFields = {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};
