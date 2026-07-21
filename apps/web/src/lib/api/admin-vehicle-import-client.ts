import type {
  VehicleImportEntity,
  VehicleImportExecutionResult,
  VehicleImportMode,
  VehicleImportPreview,
} from '@/lib/admin/vehicles/vehicle-import.types';
import { ClientApiError } from '@/lib/api/web-client';

const API_BASE_PATH = '/api/admin/catalog/vehicles/import';

const TEMPLATE_FILENAMES: Record<VehicleImportEntity, string> = {
  makes: 'vehicle-makes-import-template.csv',
  models: 'vehicle-models-import-template.csv',
  variants: 'vehicle-variants-import-template.csv',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function toApiError(payload: unknown, status: number): ClientApiError {
  const record = isRecord(payload) ? payload : {};
  return new ClientApiError(
    typeof record.message === 'string' ? record.message : 'درخواست با خطا مواجه شد',
    status,
    typeof record.code === 'string' ? record.code : undefined,
  );
}

function formData(file: File, mode: VehicleImportMode): FormData {
  const data = new FormData();
  data.set('file', file);
  data.set('mode', mode);
  return data;
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
  });
  const payload = await readPayload(response);
  if (!response.ok) throw toApiError(payload, response.status);
  if (!isRecord(payload) || !('data' in payload)) {
    throw new ClientApiError('پاسخ API معتبر نیست', 502, 'INVALID_API_RESPONSE');
  }
  return payload.data as T;
}

export const adminVehicleImportApi = {
  preview(entity: VehicleImportEntity, file: File, mode: VehicleImportMode) {
    return requestJson<VehicleImportPreview>(
      `${API_BASE_PATH}/${entity}/preview`,
      { method: 'POST', body: formData(file, mode) },
    );
  },

  execute(entity: VehicleImportEntity, file: File, mode: VehicleImportMode) {
    return requestJson<VehicleImportExecutionResult>(
      `${API_BASE_PATH}/${entity}/execute`,
      { method: 'POST', body: formData(file, mode) },
    );
  },

  async downloadTemplate(entity: VehicleImportEntity) {
    const response = await fetch(`${API_BASE_PATH}/${entity}/template`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) throw toApiError(await readPayload(response), response.status);
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = TEMPLATE_FILENAMES[entity];
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  },
};
