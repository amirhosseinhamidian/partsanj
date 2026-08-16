export type AdminCategoryParent = {
  id: string;
  name: string;
  slug: string;
};

export type AdminCategoryCounts = {
  children: number;
  products: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;

  description: string | null;

  imageUrl: string | null;
  imageAlt: string | null;

  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;

  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  showOnHome: boolean;

  createdAt: string;
  updatedAt: string;

  complementaryCategories: AdminCategoryComplement[];
  parent: AdminCategoryParent | null;
  _count: AdminCategoryCounts;
};

export type ReplaceCategoryComplementsPayload = {
  categoryIds: string[];
};

export type CategoryComplementsResponse = {
  data: AdminCategoryComplement[];
};

export type AdminCategoryComplement = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type CreateCategoryPayload = {
  name: string;
  slug: string;

  description?: string | null;

  imageUrl?: string;
  imageAlt?: string;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;

  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  showOnHome: boolean;
};

export type UpdateCategoryPayload = {
  name?: string;
  slug?: string;

  description?: string | null;

  imageUrl?: string | null;
  imageAlt?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;

  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  showOnHome?: boolean;
};

export type CategoryListResponse = {
  data: AdminCategory[];
};

export type CategoryMutationResponse = {
  data: Omit<AdminCategory, 'parent' | '_count'>;
};

export type DeletedCategory = Pick<AdminCategory, 'id' | 'name' | 'slug'>;

export type DeleteCategoryResponse = {
  data: DeletedCategory;
};
