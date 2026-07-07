import type {
  AdminBlogCategoriesResponse,
  AdminBlogCategoryListQuery,
  AdminBlogCategoryResponse,
  CreateAdminBlogCategoryInput,
  UpdateAdminBlogCategoryInput,
} from './admin-blog-category.types';

const ADMIN_BLOG_CATEGORIES_ENDPOINT = '/api/admin/blog/categories';

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

export class AdminBlogCategoryApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);

    this.name = 'AdminBlogCategoryApiError';
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
    throw new AdminBlogCategoryApiError(
      getErrorMessage(payload, 'عملیات دسته‌بندی بلاگ با خطا مواجه شد'),
      response.status,
      getErrorCode(payload),
    );
  }

  return payload as T;
}

function createListQuery(query: AdminBlogCategoryListQuery) {
  const searchParams = new URLSearchParams();

  const normalizedQuery = query.q?.trim();

  if (normalizedQuery) {
    searchParams.set('q', normalizedQuery);
  }

  if (typeof query.isActive === 'boolean') {
    searchParams.set('isActive', String(query.isActive));
  }

  if (query.page !== undefined) {
    searchParams.set('page', String(query.page));
  }

  if (query.limit !== undefined) {
    searchParams.set('limit', String(query.limit));
  }

  const queryString = searchParams.toString();

  return queryString
    ? `${ADMIN_BLOG_CATEGORIES_ENDPOINT}?${queryString}`
    : ADMIN_BLOG_CATEGORIES_ENDPOINT;
}

function getCategoryEndpoint(blogCategoryId: string) {
  return `${ADMIN_BLOG_CATEGORIES_ENDPOINT}/${encodeURIComponent(blogCategoryId)}`;
}

export function getAdminBlogCategories(
  query: AdminBlogCategoryListQuery = {},
  signal?: AbortSignal,
) {
  return request<AdminBlogCategoriesResponse>(createListQuery(query), {
    signal,
  });
}

export function getAdminBlogCategory(blogCategoryId: string, signal?: AbortSignal) {
  return request<AdminBlogCategoryResponse>(getCategoryEndpoint(blogCategoryId), {
    signal,
  });
}

export function createAdminBlogCategory(input: CreateAdminBlogCategoryInput) {
  return request<AdminBlogCategoryResponse>(ADMIN_BLOG_CATEGORIES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateAdminBlogCategory(
  blogCategoryId: string,
  input: UpdateAdminBlogCategoryInput,
) {
  return request<AdminBlogCategoryResponse>(getCategoryEndpoint(blogCategoryId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}
