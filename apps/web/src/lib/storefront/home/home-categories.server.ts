import 'server-only';

import { publicNestApi } from '@/lib/server/public-api';
import type {
  StorefrontCategoriesResponse,
  StorefrontCategory,
} from '@/lib/storefront/catalog/catalog.types';

const HOME_CATEGORIES_LIMIT = 6;

function sortCategoriesByOrder(first: StorefrontCategory, second: StorefrontCategory) {
  if (first.sortOrder !== second.sortOrder) {
    return first.sortOrder - second.sortOrder;
  }

  return first.name.localeCompare(second.name, 'fa');
}

function getCategoriesData(
  result: StorefrontCategoriesResponse | StorefrontCategory[],
): StorefrontCategory[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export async function getHomeMainCategories() {
  const result = await publicNestApi<StorefrontCategoriesResponse | StorefrontCategory[]>(
    '/api/v1/catalog/categories',
    {
      method: 'GET',
      next: {
        revalidate: 300,
        tags: ['storefront-categories', 'home-main-categories'],
      },
    },
  );

  const categories = getCategoriesData(result);

  return categories
    .filter((category) => category.showOnHome)
    .sort(sortCategoriesByOrder)
    .slice(0, HOME_CATEGORIES_LIMIT);
}
