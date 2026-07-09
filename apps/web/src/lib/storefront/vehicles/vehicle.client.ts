import type {
  StorefrontVehicleMakesResponse,
  StorefrontVehicleModelsResponse,
  StorefrontVehicleVariantsResponse,
} from './vehicle.types';

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorMessage(payload: unknown, fallback: string): string {
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

function getErrorCode(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  return typeof payload.code === 'string' ? payload.code : undefined;
}

export class StorefrontVehicleApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);

    this.name = 'StorefrontVehicleApiError';
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
    throw new StorefrontVehicleApiError(
      getErrorMessage(payload, 'دریافت اطلاعات خودرو با خطا مواجه شد'),
      response.status,
      getErrorCode(payload),
    );
  }

  return payload as T;
}

export function getStorefrontVehicleMakes(signal?: AbortSignal) {
  return request<StorefrontVehicleMakesResponse>('/api/vehicles/makes', signal);
}

export function getStorefrontVehicleModelsByMakeSlug(makeSlug: string, signal?: AbortSignal) {
  return request<StorefrontVehicleModelsResponse>(
    `/api/vehicles/makes/${encodeURIComponent(makeSlug)}/models`,
    signal,
  );
}

export function getStorefrontVehicleVariantsByModelSlug(modelSlug: string, signal?: AbortSignal) {
  return request<StorefrontVehicleVariantsResponse>(
    `/api/vehicles/models/${encodeURIComponent(modelSlug)}/variants`,
    signal,
  );
}
