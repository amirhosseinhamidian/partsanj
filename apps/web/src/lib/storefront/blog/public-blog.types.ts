export type PublicBlogRichTextDocument = Record<string, unknown> & {
  type: 'doc';
  content: unknown[];
};

export type PublicBlogCategoryListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  postsCount: number;
};

export type PublicBlogCategoryDetail = PublicBlogCategoryListItem & {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

export type PublicBlogPostCategory = {
  id: string;
  name: string;
  slug: string;
};

export type PublicBlogPostAuthor = {
  name: string;
};

export type PublicBlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;

  coverImageUrl: string | null;
  coverImageAlt: string | null;

  publishedAt: string;
  createdAt: string;
  updatedAt: string;

  category: PublicBlogPostCategory;
  author: PublicBlogPostAuthor;
};

export type PublicBlogPostDetail = PublicBlogPostListItem & {
  content: PublicBlogRichTextDocument;

  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

export type PublicBlogPostsQuery = {
  q?: string;
  categorySlug?: string;
  page?: number;
  limit?: number;
};

export type PublicBlogCategoriesResponse = {
  data: PublicBlogCategoryListItem[];
};

export type PublicBlogCategoryResponse = {
  data: PublicBlogCategoryDetail;
};

export type PublicBlogPostsResponse = {
  data: PublicBlogPostListItem[];

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PublicBlogPostResponse = {
  data: PublicBlogPostDetail;
};
