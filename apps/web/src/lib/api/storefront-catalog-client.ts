import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  FindStorefrontProductsParams,
  StorefrontBrandsResponse,
  StorefrontCategoriesResponse,
  StorefrontProductResponse,
  StorefrontProductsResponse,
} from '@/lib/storefront/catalog/catalog.types';

const STOREFRONT_CATALOG_API_PATH = '/api/catalog';

function addOptionalParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value === undefined) {
    return;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return;
  }

  searchParams.set(key, normalizedValue);
}

function buildProductsQuery(params: FindStorefrontProductsParams): string {
  const searchParams = new URLSearchParams();

  addOptionalParam(searchParams, 'q', params.q);
  addOptionalParam(searchParams, 'brand', params.brand);
  addOptionalParam(searchParams, 'category', params.category);
  addOptionalParam(searchParams, 'vehicleVariantId', params.vehicleVariantId);
  addOptionalParam(searchParams, 'stockStatus', params.stockStatus);
  addOptionalParam(searchParams, 'page', params.page);
  addOptionalParam(searchParams, 'limit', params.limit);

  return searchParams.toString();
}

export const storefrontCatalogApi = {
  listBrands(): Promise<StorefrontBrandsResponse> {
    return requestStorefrontApi<StorefrontBrandsResponse>(`${STOREFRONT_CATALOG_API_PATH}/brands`);
  },

  listCategories(): Promise<StorefrontCategoriesResponse> {
    return requestStorefrontApi<StorefrontCategoriesResponse>(
      `${STOREFRONT_CATALOG_API_PATH}/categories`,
    );
  },

  listProducts(params: FindStorefrontProductsParams = {}): Promise<StorefrontProductsResponse> {
    const queryString = buildProductsQuery(params);

    const path = queryString
      ? `${STOREFRONT_CATALOG_API_PATH}/products?${queryString}`
      : `${STOREFRONT_CATALOG_API_PATH}/products`;

    return requestStorefrontApi<StorefrontProductsResponse>(path);
  },

  getProductBySlug(slug: string): Promise<StorefrontProductResponse> {
    return requestStorefrontApi<StorefrontProductResponse>(
      `${STOREFRONT_CATALOG_API_PATH}/products/${encodeURIComponent(slug)}`,
    );
  },
};
