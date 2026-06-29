import type {
  AdminCategory,
  CategoryListResponse,
  CategoryMutationResponse,
  CreateCategoryPayload,
  DeleteCategoryResponse,
  UpdateCategoryPayload,
} from '@/lib/admin/catalog/category.types';
import { ClientApiError } from '@/lib/api/web-client';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    cache: 'no-store',
    credentials: 'same-origin',
  });

  const text = await response.text();

  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = {
      message: text,
    };
  }

  if (!response.ok) {
    const record = isRecord(payload) ? payload : {};

    throw new ClientApiError(
      typeof record.message === 'string' ? record.message : 'درخواست با خطا مواجه شد',
      response.status,
      typeof record.code === 'string' ? record.code : undefined,
    );
  }

  if (!isRecord(payload) || !('data' in payload)) {
    throw new ClientApiError('پاسخ API معتبر نیست', 502, 'INVALID_API_RESPONSE');
  }

  return payload.data as T;
}

export const adminCategoriesApi = {
  async list(): Promise<AdminCategory[]> {
    return request<CategoryListResponse['data']>('/api/admin/catalog/categories');
  },

  async create(payload: CreateCategoryPayload): Promise<CategoryMutationResponse['data']> {
    return request<CategoryMutationResponse['data']>('/api/admin/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(
    id: string,
    payload: UpdateCategoryPayload,
  ): Promise<CategoryMutationResponse['data']> {
    return request<CategoryMutationResponse['data']>(`/api/admin/catalog/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async remove(id: string): Promise<DeleteCategoryResponse['data']> {
    return request<DeleteCategoryResponse['data']>(`/api/admin/catalog/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
