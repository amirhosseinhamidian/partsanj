import type {
  AdminUploadImageResponse,
  AdminUploadPurpose,
} from '@/lib/admin/uploads/upload.types';
import { requestAdminApi } from '@/lib/api/admin-web-client';

export const adminUploadsApi = {
  async uploadImage(file: File, purpose: AdminUploadPurpose): Promise<AdminUploadImageResponse> {
    const formData = new FormData();

    formData.set('file', file, file.name);
    formData.set('purpose', purpose);

    return requestAdminApi<AdminUploadImageResponse>('/api/admin/uploads/images', {
      method: 'POST',
      body: formData,
    });
  },
};
