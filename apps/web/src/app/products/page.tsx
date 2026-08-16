import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';

import { StorefrontProductsPageClient } from '@/components/storefront/catalog/storefront-products-page-client';
import { publicNestApi } from '@/lib/server/public-nest-api';
import type { StorefrontProductsResponse } from '@/lib/storefront/catalog/catalog.types';
import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

type SearchParams = Record<string, string | string[] | undefined>;

type ProductsPageProps = {
  searchParams: Promise<SearchParams>;
};

const PRODUCTS_PAGE_SIZE = 24;

const TRACKING_QUERY_KEYS = new Set(['gclid', 'fbclid', 'ref', 'source']);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function hasMeaningfulSearchParams(searchParams: SearchParams): boolean {
  return Object.entries(searchParams).some(([key, value]) => {
    const normalizedKey = key.trim().toLowerCase();

    const hasValue = Array.isArray(value)
      ? value.some((item) => item.trim().length > 0)
      : Boolean(value?.trim());

    if (!hasValue) {
      return false;
    }

    if (normalizedKey === 'page') {
      return false;
    }

    if (normalizedKey.startsWith('utm_')) {
      return false;
    }

    if (TRACKING_QUERY_KEYS.has(normalizedKey)) {
      return false;
    }

    return true;
  });
}

function getPaginationState(searchParams: SearchParams): {
  page: number;
  invalid: boolean;
} {
  const rawPage = searchParams.page;

  if (rawPage === undefined) {
    return {
      page: 1,
      invalid: false,
    };
  }

  const pageValues = Array.isArray(rawPage) ? rawPage : [rawPage];

  if (pageValues.length !== 1) {
    return {
      page: 1,
      invalid: true,
    };
  }

  const value = pageValues[0]?.trim() ?? '';

  if (!/^[1-9]\d*$/.test(value)) {
    return {
      page: 1,
      invalid: true,
    };
  }

  const page = Number(value);

  if (!Number.isSafeInteger(page) || page < 1) {
    return {
      page: 1,
      invalid: true,
    };
  }

  return {
    page,
    invalid: false,
  };
}

function getLegacyCategorySlug(searchParams: SearchParams): string | null {
  const rawCategory = searchParams.category;

  if (rawCategory === undefined) {
    return null;
  }

  const values = Array.isArray(rawCategory) ? rawCategory : [rawCategory];

  if (values.length !== 1) {
    return null;
  }

  const slug = values[0]?.trim().toLowerCase() ?? '';

  if (!SLUG_PATTERN.test(slug)) {
    return null;
  }

  return slug;
}

function buildLegacyCategoryRedirectPath(searchParams: SearchParams): string | null {
  const categorySlug = getLegacyCategorySlug(searchParams);

  if (!categorySlug) {
    return null;
  }

  const nextSearchParams = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, rawValue]) => {
    const normalizedKey = key.trim().toLowerCase();

    if (normalizedKey === 'category') {
      return;
    }

    if (rawValue === undefined) {
      return;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    values.forEach((value) => {
      const normalizedValue = value.trim();

      if (!normalizedValue) {
        return;
      }

      nextSearchParams.append(key, normalizedValue);
    });
  });

  /*
   * صفحه اول URL جداگانه لازم ندارد.
   */
  const pageValues = nextSearchParams.getAll('page');

  if (pageValues.length === 1 && pageValues[0] === '1') {
    nextSearchParams.delete('page');
  }

  const queryString = nextSearchParams.toString();

  const categoryPath = `/categories/${encodeURIComponent(categorySlug)}`;

  return queryString ? `${categoryPath}?${queryString}` : categoryPath;
}

async function getProducts(page: number): Promise<StorefrontProductsResponse | null> {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(PRODUCTS_PAGE_SIZE),
  });

  try {
    return await publicNestApi<StorefrontProductsResponse>(
      `/api/v1/catalog/products?${searchParams.toString()}`,
      {
        method: 'GET',

        next: {
          revalidate: 120,
          tags: ['products-list'],
        },
      },
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const [settings, resolvedSearchParams] = await Promise.all([
    getStorefrontSiteSettings(),
    searchParams,
  ]);

  const hasFilters = hasMeaningfulSearchParams(resolvedSearchParams);

  const { page, invalid: invalidPage } = getPaginationState(resolvedSearchParams);

  const pageNoIndex = hasFilters || invalidPage;

  const canonicalPath =
    !hasFilters && !invalidPage && page > 1 ? `/products?page=${page}` : '/products';

  const baseTitle = 'فروشگاه قطعات یدکی خودرو';

  const title =
    !hasFilters && !invalidPage && page > 1
      ? `${baseTitle} - صفحه ${page} | ${settings.siteName}`
      : `${baseTitle} | ${settings.siteName}`;

  const description =
    `مشاهده و خرید قطعات یدکی خودرو در ${settings.siteName}، ` +
    'با امکان جست‌وجو، بررسی مشخصات و انتخاب قطعه سازگار با خودرو.';

  return buildSeoMetadata({
    title: baseTitle,

    seoTitle: title,

    description,

    canonicalPath,

    globalNoIndex: settings.noIndexSite,

    pageNoIndex,

    type: 'website',

    openGraphTitle: title,

    openGraphDescription: description,

    openGraphImage: settings.defaultOgImageUrl
      ? {
          url: settings.defaultOgImageUrl,

          alt: `فروشگاه قطعات یدکی ${settings.siteName}`,
        }
      : null,
  });
}

function ProductsPageFallback() {
  return (
    <main className='mx-auto w-full max-w-7xl px-4 py-8'>
      <div className='space-y-6'>
        <div className='h-28 animate-pulse rounded-card bg-surface-muted' />

        <div className='h-20 animate-pulse rounded-card bg-surface-muted' />

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({
            length: 8,
          }).map((_, index) => (
            <div key={index} className='h-80 animate-pulse rounded-card bg-surface-muted' />
          ))}
        </div>
      </div>
    </main>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;

  /*
   * URL قدیمی:
   *
   * /products?category=sensors
   *
   * به URL اصلی Category منتقل می‌شود:
   *
   * /categories/sensors
   */
  const legacyCategoryRedirectPath = buildLegacyCategoryRedirectPath(resolvedSearchParams);

  if (legacyCategoryRedirectPath) {
    permanentRedirect(legacyCategoryRedirectPath);
  }

  const hasFilters = hasMeaningfulSearchParams(resolvedSearchParams);

  const { page, invalid: invalidPage } = getPaginationState(resolvedSearchParams);

  const initialResult = !hasFilters && !invalidPage ? await getProducts(page) : null;

  if (
    initialResult &&
    page > 1 &&
    (initialResult.meta.totalPages === 0 || page > initialResult.meta.totalPages)
  ) {
    notFound();
  }

  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <StorefrontProductsPageClient initialResult={initialResult} />
    </Suspense>
  );
}
