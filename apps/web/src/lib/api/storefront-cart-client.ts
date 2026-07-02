import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  AddCartItemInput,
  CartApiResponse,
  CartMergeApiResponse,
  StorefrontCart,
  UpdateCartItemQuantityInput,
} from '@/lib/storefront/cart/cart.types';

export const storefrontCartApi = {
  getCart() {
    return requestStorefrontApi<CartApiResponse<StorefrontCart | null>>('/api/cart');
  },

  addItem(input: AddCartItemInput) {
    return requestStorefrontApi<CartApiResponse<StorefrontCart>>('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateItemQuantity(itemId: string, input: UpdateCartItemQuantityInput) {
    return requestStorefrontApi<CartApiResponse<StorefrontCart>>(
      `/api/cart/items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
  },

  removeItem(itemId: string) {
    return requestStorefrontApi<CartApiResponse<StorefrontCart>>(
      `/api/cart/items/${encodeURIComponent(itemId)}`,
      {
        method: 'DELETE',
      },
    );
  },

  mergeGuestCart() {
    return requestStorefrontApi<CartMergeApiResponse>('/api/cart/merge', {
      method: 'POST',
    });
  },
};
