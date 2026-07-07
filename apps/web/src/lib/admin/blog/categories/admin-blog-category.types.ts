export type AdminBlogCategorySeoFields = {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

export type AdminBlogCategoryListItem = AdminBlogCategorySeoFields & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;

  _count: {
    posts: number;
  };
};

export type AdminBlogCategoryDetail = AdminBlogCategoryListItem;

export type AdminBlogCategoriesResponse = {
  data: AdminBlogCategoryListItem[];

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminBlogCategoryResponse = {
  data: AdminBlogCategoryDetail;
};

export type AdminBlogCategoryListQuery = {
  q?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export type CreateAdminBlogCategoryInput = {
  name: string;
  slug: string;

  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;
};

export type UpdateAdminBlogCategoryInput = {
  name?: string;
  slug?: string;

  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;
};
