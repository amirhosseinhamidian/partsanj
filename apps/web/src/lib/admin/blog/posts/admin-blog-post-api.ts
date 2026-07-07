export const ADMIN_BLOG_POSTS_API_PATH = '/api/v1/admin/blog/posts';

const ADMIN_BLOG_POST_QUERY_KEYS = ['q', 'status', 'categoryId', 'page', 'limit'] as const;

export function createAdminBlogPostsListApiPath(searchParams: URLSearchParams) {
  const params = new URLSearchParams();

  for (const key of ADMIN_BLOG_POST_QUERY_KEYS) {
    const value = searchParams.get(key);

    if (value !== null && value !== '') {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `${ADMIN_BLOG_POSTS_API_PATH}?${query}` : ADMIN_BLOG_POSTS_API_PATH;
}

export function adminBlogPostApiPath(blogPostId: string) {
  return `${ADMIN_BLOG_POSTS_API_PATH}/${encodeURIComponent(blogPostId)}`;
}
