import type {
  AdminBrand,
  BrandListResponse,
  BrandMutationResponse,
  CreateBrandPayload,
  UpdateBrandPayload,
} from '@/lib/admin/catalog/brand.types';
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

export const adminBrandsApi = {
  async list(): Promise<AdminBrand[]> {
    return request<BrandListResponse['data']>('/api/admin/catalog/brands');
  },

  async create(payload: CreateBrandPayload): Promise<BrandMutationResponse['data']> {
    return request<BrandMutationResponse['data']>('/api/admin/catalog/brands', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: string, payload: UpdateBrandPayload): Promise<BrandMutationResponse['data']> {
    return request<BrandMutationResponse['data']>(`/api/admin/catalog/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
