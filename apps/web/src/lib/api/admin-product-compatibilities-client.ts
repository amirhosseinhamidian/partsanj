import type {
  ProductCompatibilitiesResponse,
  ReplaceProductCompatibilitiesPayload,
} from '@/lib/admin/catalog/product-compatibility.types';
import { requestAdminApi } from '@/lib/api/admin-web-client';
import { ClientApiError } from '@/lib/api/web-client';

function requiredProductId(productId: string): string {
  const normalizedProductId = productId.trim();

  if (!normalizedProductId) {
    throw new ClientApiError('شناسه محصول الزامی است', 400, 'PRODUCT_ID_REQUIRED');
  }

  return normalizedProductId;
}

function getCompatibilityPath(productId: string): string {
  const id = requiredProductId(productId);

  return `/api/admin/catalog/products/${encodeURIComponent(id)}/compatibilities`;
}

export const adminProductCompatibilitiesApi = {
  async list(productId: string): Promise<ProductCompatibilitiesResponse> {
    return requestAdminApi<ProductCompatibilitiesResponse>(getCompatibilityPath(productId));
  },

  async replace(
    productId: string,
    payload: ReplaceProductCompatibilitiesPayload,
  ): Promise<ProductCompatibilitiesResponse> {
    return requestAdminApi<ProductCompatibilitiesResponse>(getCompatibilityPath(productId), {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
