import { adminNestApi } from './admin-api';

export const ADMIN_BLOG_CATEGORIES_API_PATH = '/api/v1/admin/blog/categories';

const ADMIN_BLOG_CATEGORY_QUERY_KEYS = ['q', 'isActive', 'page', 'limit'] as const;

export function createAdminBlogCategoriesListApiPath(searchParams: URLSearchParams) {
  const params = new URLSearchParams();

  for (const key of ADMIN_BLOG_CATEGORY_QUERY_KEYS) {
    const value = searchParams.get(key);

    if (value !== null && value !== '') {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `${ADMIN_BLOG_CATEGORIES_API_PATH}?${query}` : ADMIN_BLOG_CATEGORIES_API_PATH;
}

export function adminBlogCategoryApiPath(blogCategoryId: string) {
  return `${ADMIN_BLOG_CATEGORIES_API_PATH}/${encodeURIComponent(blogCategoryId)}`;
}

export { adminNestApi };
