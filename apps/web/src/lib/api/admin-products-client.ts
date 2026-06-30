import type {
  AdminProductsListResponse,
  CreateProductPayload,
  FindAdminProductsQuery,
  ProductDetailResponse,
  UpdateProductPayload,
} from '@/lib/admin/catalog/product.types';
import { ClientApiError } from '@/lib/api/web-client';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toSearchParams(query: FindAdminProductsQuery): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    params.set(key, String(value));
  });

  return params;
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

  return payload as T;
}

export const adminProductsApi = {
  async list(query: FindAdminProductsQuery): Promise<AdminProductsListResponse> {
    const searchParams = toSearchParams(query);

    return request<AdminProductsListResponse>(
      `/api/admin/catalog/products?${searchParams.toString()}`,
    );
  },

  async getById(id: string): Promise<ProductDetailResponse> {
    return request<ProductDetailResponse>(`/api/admin/catalog/products/${id}`);
  },

  async create(payload: CreateProductPayload): Promise<ProductDetailResponse> {
    return request<ProductDetailResponse>('/api/admin/catalog/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdateProductPayload): Promise<ProductDetailResponse> {
    return request<ProductDetailResponse>(`/api/admin/catalog/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async archive(id: string): Promise<ProductDetailResponse> {
    return request<ProductDetailResponse>(`/api/admin/catalog/products/${id}/archive`, {
      method: 'POST',
    });
  },
};
