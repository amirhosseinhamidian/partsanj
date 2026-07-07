export const ADMIN_BLOG_POST_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export type AdminBlogPostStatus = (typeof ADMIN_BLOG_POST_STATUSES)[number];

export function isAdminBlogPostStatus(value: unknown): value is AdminBlogPostStatus {
  return (
    typeof value === 'string' && ADMIN_BLOG_POST_STATUSES.includes(value as AdminBlogPostStatus)
  );
}

export type BlogEditorDocument = Record<string, unknown> & {
  type: 'doc';
  content: unknown[];
};

export type AdminBlogPostSeoFields = {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

export type AdminBlogPostCategorySummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export type AdminBlogPostAuthorSummary = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  mobile: string;
};

export type AdminBlogPostListItem = AdminBlogPostSeoFields & {
  id: string;

  title: string;
  slug: string;
  excerpt: string | null;

  coverImageUrl: string | null;
  coverImageAlt: string | null;

  status: AdminBlogPostStatus;
  publishedAt: string | null;

  createdAt: string;
  updatedAt: string;

  category: AdminBlogPostCategorySummary;
  authorUser: AdminBlogPostAuthorSummary;
};

export type AdminBlogPostDetail = AdminBlogPostListItem & {
  content: BlogEditorDocument;
};

export type AdminBlogPostsResponse = {
  data: AdminBlogPostListItem[];

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminBlogPostResponse = {
  data: AdminBlogPostDetail;
};

export type AdminBlogPostListQuery = {
  q?: string;
  status?: AdminBlogPostStatus;
  categoryId?: string;
  page?: number;
  limit?: number;
};

export type CreateAdminBlogPostInput = {
  categoryId: string;

  title: string;
  slug: string;
  content: BlogEditorDocument;

  excerpt?: string | null;

  coverImageUrl?: string | null;
  coverImageAlt?: string | null;

  status?: AdminBlogPostStatus;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;
};

export type UpdateAdminBlogPostInput = {
  categoryId?: string;

  title?: string;
  slug?: string;
  content?: BlogEditorDocument;

  excerpt?: string | null;

  coverImageUrl?: string | null;
  coverImageAlt?: string | null;

  status?: AdminBlogPostStatus;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;
};
