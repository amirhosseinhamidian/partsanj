import type {
  PublicBlogCategoriesResponse,
  PublicBlogCategoryResponse,
  PublicBlogPostsQuery,
  PublicBlogPostsResponse,
  PublicBlogPostResponse,
} from './public-blog.types';

const PUBLIC_BLOG_CATEGORIES_ENDPOINT = '/api/blog/categories';

const PUBLIC_BLOG_POSTS_ENDPOINT = '/api/blog/posts';

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) {
    return fallback;
  }

  const errorPayload = payload as ApiErrorPayload;

  if (typeof errorPayload.message === 'string') {
    return errorPayload.message;
  }

  if (Array.isArray(errorPayload.message)) {
    const messages = errorPayload.message.filter(
      (item): item is string => typeof item === 'string',
    );

    if (messages.length > 0) {
      return messages.join('، ');
    }
  }

  if (typeof errorPayload.error === 'string') {
    return errorPayload.error;
  }

  return fallback;
}

function getErrorCode(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  return typeof payload.code === 'string' ? payload.code : undefined;
}

export class PublicBlogApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);

    this.name = 'PublicBlogApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new PublicBlogApiError(
      getErrorMessage(payload, 'دریافت اطلاعات بلاگ با خطا مواجه شد'),
      response.status,
      getErrorCode(payload),
    );
  }

  return payload as T;
}

function createPostsEndpoint(query: PublicBlogPostsQuery) {
  const searchParams = new URLSearchParams();

  const normalizedQuery = query.q?.trim();

  if (normalizedQuery) {
    searchParams.set('q', normalizedQuery);
  }

  if (query.categorySlug) {
    searchParams.set('categorySlug', query.categorySlug);
  }

  if (query.page !== undefined) {
    searchParams.set('page', String(query.page));
  }

  if (query.limit !== undefined) {
    searchParams.set('limit', String(query.limit));
  }

  const queryString = searchParams.toString();

  return queryString ? `${PUBLIC_BLOG_POSTS_ENDPOINT}?${queryString}` : PUBLIC_BLOG_POSTS_ENDPOINT;
}

export function getPublicBlogCategories(signal?: AbortSignal) {
  return request<PublicBlogCategoriesResponse>(PUBLIC_BLOG_CATEGORIES_ENDPOINT, signal);
}

export function getPublicBlogCategory(slug: string, signal?: AbortSignal) {
  return request<PublicBlogCategoryResponse>(
    `${PUBLIC_BLOG_CATEGORIES_ENDPOINT}/${encodeURIComponent(slug)}`,
    signal,
  );
}

export function getPublicBlogPosts(query: PublicBlogPostsQuery = {}, signal?: AbortSignal) {
  return request<PublicBlogPostsResponse>(createPostsEndpoint(query), signal);
}

export function getPublicBlogPost(slug: string, signal?: AbortSignal) {
  return request<PublicBlogPostResponse>(
    `${PUBLIC_BLOG_POSTS_ENDPOINT}/${encodeURIComponent(slug)}`,
    signal,
  );
}
