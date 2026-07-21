import type {
  CatalogImportEntity,
  CatalogImportExecutionResult,
  CatalogImportMode,
  CatalogImportPreview,
} from '@/lib/admin/catalog/catalog-import.types';
import { ClientApiError } from '@/lib/api/web-client';

type UnknownRecord = Record<string, unknown>;

const IMPORT_API_BASE_PATH = '/api/admin/catalog/import';

const TEMPLATE_FILENAMES: Record<CatalogImportEntity, string> = {
  products: 'products-import-template.csv',
  brands: 'brands-import-template.csv',
  categories: 'categories-import-template.csv',
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

function toClientApiError(payload: unknown, status: number): ClientApiError {
  const record = isRecord(payload) ? payload : {};

  const message =
    typeof record.message === 'string' && record.message.trim()
      ? record.message
      : 'درخواست با خطا مواجه شد';

  const code = typeof record.code === 'string' ? record.code : undefined;

  return new ClientApiError(message, status, code);
}

async function requestImportJson<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
  });

  const payload = await readPayload(response);

  if (!response.ok) {
    throw toClientApiError(payload, response.status);
  }

  if (!isRecord(payload) || !('data' in payload)) {
    throw new ClientApiError(
      'پاسخ API معتبر نیست',
      502,
      'INVALID_API_RESPONSE',
    );
  }

  return payload.data as T;
}

function createImportFormData(
  file: File,
  mode: CatalogImportMode,
): FormData {
  const formData = new FormData();

  formData.set('file', file);
  formData.set('mode', mode);

  return formData;
}

async function preview(
  entity: CatalogImportEntity,
  file: File,
  mode: CatalogImportMode,
): Promise<CatalogImportPreview> {
  return requestImportJson<CatalogImportPreview>(
    `${IMPORT_API_BASE_PATH}/${entity}/preview`,
    {
      method: 'POST',
      body: createImportFormData(file, mode),
    },
  );
}

async function execute(
  entity: CatalogImportEntity,
  file: File,
  mode: CatalogImportMode,
): Promise<CatalogImportExecutionResult> {
  return requestImportJson<CatalogImportExecutionResult>(
    `${IMPORT_API_BASE_PATH}/${entity}/execute`,
    {
      method: 'POST',
      body: createImportFormData(file, mode),
    },
  );
}

async function downloadTemplate(
  entity: CatalogImportEntity,
): Promise<void> {
  const response = await fetch(
    `${IMPORT_API_BASE_PATH}/${entity}/template`,
    {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    const payload = await readPayload(response);

    throw toClientApiError(payload, response.status);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = TEMPLATE_FILENAMES[entity];
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

export const adminCatalogImportApi = {
  preview,
  execute,
  downloadTemplate,
};
