export type AdminBrandCounts = {
  products: number;
};

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: AdminBrandCounts;
};

export type CreateBrandPayload = {
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
};

export type UpdateBrandPayload = Partial<Omit<CreateBrandPayload, 'logoUrl'>> & {
  logoUrl?: string | null;
};

export type BrandListResponse = {
  data: AdminBrand[];
};

export type BrandMutationResponse = {
  data: Omit<AdminBrand, '_count'>;
};
