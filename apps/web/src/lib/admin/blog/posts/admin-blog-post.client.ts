import type {
  AdminBlogPostListQuery,
  AdminBlogPostResponse,
  AdminBlogPostsResponse,
  CreateAdminBlogPostInput,
  UpdateAdminBlogPostInput,
} from './admin-blog-post.types';

const ADMIN_BLOG_POSTS_ENDPOINT = '/api/admin/blog/posts';

type ApiErrorPayload = {
  message?: unknown;
  code?: unknown;
  error?: unknown;
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

export class AdminBlogPostApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);

    this.name = 'AdminBlogPostApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    cache: 'no-store',
    ...init,
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new AdminBlogPostApiError(
      getErrorMessage(payload, 'عملیات مقاله بلاگ با خطا مواجه شد'),
      response.status,
      getErrorCode(payload),
    );
  }

  return payload as T;
}

function createListQuery(query: AdminBlogPostListQuery) {
  const searchParams = new URLSearchParams();

  const normalizedQuery = query.q?.trim();

  if (normalizedQuery) {
    searchParams.set('q', normalizedQuery);
  }

  if (query.status) {
    searchParams.set('status', query.status);
  }

  if (query.categoryId) {
    searchParams.set('categoryId', query.categoryId);
  }

  if (query.page !== undefined) {
    searchParams.set('page', String(query.page));
  }

  if (query.limit !== undefined) {
    searchParams.set('limit', String(query.limit));
  }

  const queryString = searchParams.toString();

  return queryString ? `${ADMIN_BLOG_POSTS_ENDPOINT}?${queryString}` : ADMIN_BLOG_POSTS_ENDPOINT;
}

function getBlogPostEndpoint(blogPostId: string) {
  return `${ADMIN_BLOG_POSTS_ENDPOINT}/${encodeURIComponent(blogPostId)}`;
}

export function getAdminBlogPosts(query: AdminBlogPostListQuery = {}, signal?: AbortSignal) {
  return request<AdminBlogPostsResponse>(createListQuery(query), {
    signal,
  });
}

export function getAdminBlogPost(blogPostId: string, signal?: AbortSignal) {
  return request<AdminBlogPostResponse>(getBlogPostEndpoint(blogPostId), {
    signal,
  });
}

export function createAdminBlogPost(input: CreateAdminBlogPostInput) {
  return request<AdminBlogPostResponse>(ADMIN_BLOG_POSTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateAdminBlogPost(blogPostId: string, input: UpdateAdminBlogPostInput) {
  return request<AdminBlogPostResponse>(getBlogPostEndpoint(blogPostId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}
