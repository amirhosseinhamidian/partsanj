import 'server-only';

import { publicNestApi } from '@/lib/server/public-nest-api';
import type { PublicBlogPostListItem } from '@/lib/storefront/blog/public-blog.types';

type HomeBlogPostsResponse = {
  data: PublicBlogPostListItem[];
};

const HOME_BLOG_POSTS_LIMIT = 3;

export async function getHomeBlogPosts() {
  const result = await publicNestApi<HomeBlogPostsResponse>(
    `/api/v1/blog/home/posts?limit=${HOME_BLOG_POSTS_LIMIT}`,
    {
      method: 'GET',
      next: {
        revalidate: 300,
        tags: ['public-blog-posts', 'home-blog-posts'],
      },
    },
  );

  return result.data;
}
