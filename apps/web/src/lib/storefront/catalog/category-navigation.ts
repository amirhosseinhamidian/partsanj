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

let storefrontCategoriesRequest: Promise<StorefrontCatalogCategory[]> | null = null;

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

function getStorefrontCategoriesRequest(): Promise<StorefrontCatalogCategory[]> {
  if (storefrontCategoriesRequest) {
    return storefrontCategoriesRequest;
  }

  storefrontCategoriesRequest = fetch('/api/catalog/categories', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('دریافت دسته‌بندی‌ها ناموفق بود');
      }

      const payload = (await response.json()) as StorefrontCatalogCategoriesResponse;

      if (!Array.isArray(payload.data)) {
        throw new Error('ساختار پاسخ دسته‌بندی‌ها معتبر نیست');
      }

      return payload.data;
    })
    .catch((error: unknown) => {
      storefrontCategoriesRequest = null;
      throw error;
    });

  return storefrontCategoriesRequest;
}

function waitForRequestWithSignal<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return request;
  }

  if (signal.aborted) {
    return Promise.reject(
      signal.reason ?? new DOMException('The operation was aborted', 'AbortError'),
    );
  }

  return new Promise<T>((resolve, reject) => {
    const handleAbort = () => {
      reject(signal.reason ?? new DOMException('The operation was aborted', 'AbortError'));
    };

    signal.addEventListener('abort', handleAbort, {
      once: true,
    });

    request.then(
      (value) => {
        signal.removeEventListener('abort', handleAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', handleAbort);
        reject(error);
      },
    );
  });
}

export function fetchStorefrontCategories(
  signal?: AbortSignal,
): Promise<StorefrontCatalogCategory[]> {
  return waitForRequestWithSignal(getStorefrontCategoriesRequest(), signal);
}
