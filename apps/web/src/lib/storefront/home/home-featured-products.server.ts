import 'server-only';

import { publicNestApi } from '@/lib/server/public-api';
import type {
  StorefrontProductListItem,
  StorefrontProductsResponse,
} from '@/lib/storefront/catalog/catalog.types';

const HOME_FEATURED_PRODUCTS_LIMIT = 8;

function getProductsData(
  result: StorefrontProductsResponse | StorefrontProductListItem[],
): StorefrontProductListItem[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function getHomeFeaturedProducts() {
  const result = await publicNestApi<StorefrontProductsResponse>(
    `/api/v1/catalog/home/featured-products?limit=${HOME_FEATURED_PRODUCTS_LIMIT}`,
    {
      method: 'GET',
      next: {
        revalidate: 300,
        tags: ['storefront-products', 'home-featured-products'],
      },
    },
  );

  return getProductsData(result);
}
