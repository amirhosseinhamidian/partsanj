import 'server-only';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  createPublicBlogPostsApiPath,
  publicBlogCategoryApiPath,
  publicBlogPostApiPath,
  PUBLIC_BLOG_CATEGORIES_API_PATH,
} from '@/lib/server/public-blog-api';
import { publicNestApi } from '@/lib/server/public-nest-api';
import type {
  PublicBlogCategoriesResponse,
  PublicBlogCategoryResponse,
  PublicBlogPostsQuery,
  PublicBlogPostsResponse,
  PublicBlogPostResponse,
} from './public-blog.types';

export const PUBLIC_BLOG_REVALIDATE_SECONDS = 300;

export const PUBLIC_BLOG_CACHE_TAGS = {
  categories: 'public-blog-categories',
  posts: 'public-blog-posts',
};

export function publicBlogPostCacheTag(slug: string) {
  return `public-blog-post:${slug}`;
}

export function publicBlogCategoryCacheTag(slug: string) {
  return `public-blog-category:${slug}`;
}

export function publicBlogCategoryPostsCacheTag(slug: string) {
  return `public-blog-category-posts:${slug}`;
}

function createPostsSearchParams(query: PublicBlogPostsQuery) {
  const params = new URLSearchParams();

  const normalizedQuery = query.q?.trim();

  if (normalizedQuery) {
    params.set('q', normalizedQuery);
  }

  const normalizedCategorySlug = query.categorySlug?.trim();

  if (normalizedCategorySlug) {
    params.set('categorySlug', normalizedCategorySlug);
  }

  if (query.page !== undefined) {
    params.set('page', String(query.page));
  }

  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }

  return params;
}

export async function getPublicBlogCategories() {
  return publicNestApi<PublicBlogCategoriesResponse>(PUBLIC_BLOG_CATEGORIES_API_PATH, {
    method: 'GET',
    next: {
      revalidate: PUBLIC_BLOG_REVALIDATE_SECONDS,
      tags: [PUBLIC_BLOG_CACHE_TAGS.categories],
    },
  });
}

export async function getPublicBlogCategory(slug: string) {
  return publicNestApi<PublicBlogCategoryResponse>(publicBlogCategoryApiPath(slug), {
    method: 'GET',
    next: {
      revalidate: PUBLIC_BLOG_REVALIDATE_SECONDS,
      tags: [PUBLIC_BLOG_CACHE_TAGS.categories, publicBlogCategoryCacheTag(slug)],
    },
  });
}

export async function getPublicBlogPosts(query: PublicBlogPostsQuery = {}) {
  const normalizedCategorySlug = query.categorySlug?.trim();

  const tags = [PUBLIC_BLOG_CACHE_TAGS.posts];

  if (normalizedCategorySlug) {
    tags.push(publicBlogCategoryPostsCacheTag(normalizedCategorySlug));
  }

  return publicNestApi<PublicBlogPostsResponse>(
    createPublicBlogPostsApiPath(createPostsSearchParams(query)),
    {
      method: 'GET',
      next: {
        revalidate: PUBLIC_BLOG_REVALIDATE_SECONDS,
        tags,
      },
    },
  );
}

export async function getPublicBlogPost(slug: string) {
  return publicNestApi<PublicBlogPostResponse>(publicBlogPostApiPath(slug), {
    method: 'GET',
    next: {
      revalidate: PUBLIC_BLOG_REVALIDATE_SECONDS,
      tags: [PUBLIC_BLOG_CACHE_TAGS.posts, publicBlogPostCacheTag(slug)],
    },
  });
}

export function isPublicBlogNotFoundError(error: unknown) {
  return error instanceof ApiRequestError && error.status === 404;
}
