import type { AdminProductCompatibility, ProductStatus } from '@/lib/admin/catalog/product.types';

export type ProductCompatibilityInput = {
  vehicleVariantId: string;
  notes?: string;
  requiresVerification: boolean;
};

export type ReplaceProductCompatibilitiesPayload = {
  items: ProductCompatibilityInput[];
};

export type ProductCompatibilitiesResponse = {
  data: {
    id: string;
    sku: string;
    slug: string;
    name: string;
    status: ProductStatus;
    isPublished: boolean;
    isTorobEnabled: boolean;
    compatibilities: AdminProductCompatibility[];
  };
};
