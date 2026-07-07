export const PUBLIC_BLOG_CATEGORIES_API_PATH = '/api/v1/blog/categories';

export const PUBLIC_BLOG_POSTS_API_PATH = '/api/v1/blog/posts';

const PUBLIC_BLOG_POSTS_QUERY_KEYS = ['q', 'categorySlug', 'page', 'limit'] as const;

export function createPublicBlogPostsApiPath(searchParams: URLSearchParams) {
  const params = new URLSearchParams();

  for (const key of PUBLIC_BLOG_POSTS_QUERY_KEYS) {
    const value = searchParams.get(key);

    if (value !== null && value.trim()) {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `${PUBLIC_BLOG_POSTS_API_PATH}?${query}` : PUBLIC_BLOG_POSTS_API_PATH;
}

export function publicBlogCategoryApiPath(slug: string) {
  return `${PUBLIC_BLOG_CATEGORIES_API_PATH}/${encodeURIComponent(slug)}`;
}

export function publicBlogPostApiPath(slug: string) {
  return `${PUBLIC_BLOG_POSTS_API_PATH}/${encodeURIComponent(slug)}`;
}
