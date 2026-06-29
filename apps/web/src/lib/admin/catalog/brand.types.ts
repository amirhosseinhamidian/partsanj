export type AdminBrandCounts = {
  products: number;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: AdminBrandCounts;
};

export type CreateBrandPayload = {
  name: string;
  slug: string;
  isActive: boolean;
};

export type UpdateBrandPayload = {
  name?: string;
  slug?: string;
  isActive?: boolean;
};

export type BrandListResponse = {
  data: AdminBrand[];
};

export type BrandMutationResponse = {
  data: Omit<AdminBrand, '_count'>;
};
