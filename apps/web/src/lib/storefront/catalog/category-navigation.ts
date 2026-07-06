export type StorefrontCatalogCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
};

export type StorefrontCatalogCategoriesResponse = {
  data: StorefrontCatalogCategory[];
};

export type StorefrontCategoryNavigationItem = StorefrontCatalogCategory & {
  children: StorefrontCatalogCategory[];
};

export function getCategoryProductsHref(slug: string): string {
  return `/products?category=${encodeURIComponent(slug)}`;
}

export function buildCategoryNavigation(
  categories: StorefrontCatalogCategory[],
): StorefrontCategoryNavigationItem[] {
  const childrenByParentId = new Map<string, StorefrontCatalogCategory[]>();

  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }

    const currentChildren = childrenByParentId.get(category.parentId) ?? [];

    currentChildren.push(category);

    childrenByParentId.set(category.parentId, currentChildren);
  }

  return categories
    .filter((category) => category.parentId === null)
    .map((category) => ({
      ...category,
      children: childrenByParentId.get(category.id) ?? [],
    }));
}

export async function fetchStorefrontCategories(
  signal?: AbortSignal,
): Promise<StorefrontCatalogCategory[]> {
  const response = await fetch('/api/catalog/categories', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error('دریافت دسته‌بندی‌ها ناموفق بود');
  }

  const payload = (await response.json()) as StorefrontCatalogCategoriesResponse;

  if (!Array.isArray(payload.data)) {
    throw new Error('ساختار پاسخ دسته‌بندی‌ها معتبر نیست');
  }

  return payload.data;
}
