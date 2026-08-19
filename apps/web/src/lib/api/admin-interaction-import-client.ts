import { requestAdminApi } from '@/lib/api/admin-web-client';

import { ClientApiError } from '@/lib/api/web-client';

import type {
  AdminInteractionImportPreviewResponse,
  AdminInteractionImportResponse,
} from '@/lib/admin/interactions/import/admin-interaction-import.types';

const IMPORT_PATH = '/api/admin/interactions/import';

function createFileBody(file: File) {
  const formData = new FormData();

  formData.append('file', file);

  return formData;
}

export const adminInteractionImportApi = {
  preview(file: File) {
    return requestAdminApi<AdminInteractionImportPreviewResponse>(`${IMPORT_PATH}/preview`, {
      method: 'POST',

      body: createFileBody(file),
    });
  },

  import(file: File) {
    return requestAdminApi<AdminInteractionImportResponse>(IMPORT_PATH, {
      method: 'POST',

      body: createFileBody(file),
    });
  },

  async downloadTemplate() {
    const response = await fetch(`${IMPORT_PATH}/template`, {
      method: 'GET',

      credentials: 'same-origin',

      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();

      throw new ClientApiError(text || 'دریافت فایل نمونه با خطا مواجه شد', response.status);
    }

    return response.blob();
  },
};
