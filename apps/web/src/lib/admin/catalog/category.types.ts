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
  imageUrl: string | null;
  imageAlt: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  showOnHome: boolean;
  createdAt: string;
  updatedAt: string;
  parent: AdminCategoryParent | null;
  _count: AdminCategoryCounts;
};

export type CreateCategoryPayload = {
  name: string;
  slug: string;
  imageUrl?: string;
  imageAlt?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  showOnHome: boolean;
};

export type UpdateCategoryPayload = {
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
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
