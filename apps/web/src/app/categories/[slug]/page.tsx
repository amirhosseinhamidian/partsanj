import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { StorefrontProductsPageClient } from '@/components/storefront/catalog/storefront-products-page-client';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';

import { publicNestApi } from '@/lib/server/public-nest-api';
import { CategoryStructuredData } from '@/lib/storefront/seo/category-structured-data';
import type {
  StorefrontCategoryResponse,
  StorefrontProductsResponse,
} from '@/lib/storefront/catalog/catalog.types';

import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';

import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

import { toPersianDigits } from '@/lib/utils/digits';

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;

  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PRODUCTS_PAGE_SIZE = 24;

const TRACKING_QUERY_KEYS = new Set(['gclid', 'fbclid', 'ref', 'source']);

function hasMeaningfulSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
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

function getPageNumber(searchParams: Record<string, string | string[] | undefined>): number {
  const rawPage = searchParams.page;

  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;

  if (!value) {
    return 1;
  }

  const parsedPage = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return 1;
  }

  return parsedPage;
}

async function getCategory(slug: string) {
  try {
    const response = await publicNestApi<StorefrontCategoryResponse>(
      `/api/v1/catalog/categories/${encodeURIComponent(slug)}`,
      {
        method: 'GET',

        next: {
          revalidate: 300,
          tags: [`category:${slug}`],
        },
      },
    );

    return response.data;
  } catch {
    return null;
  }
}

async function getCategoryProducts(slug: string, page: number) {
  const searchParams = new URLSearchParams({
    category: slug,
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

          tags: [`category-products:${slug}`],
        },
      },
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const [category, settings] = await Promise.all([getCategory(slug), getStorefrontSiteSettings()]);

  if (!category) {
    return {
      title: {
        absolute: `دسته‌بندی پیدا نشد | ${settings.siteName}`,
      },

      robots: {
        index: false,
        follow: false,

        googleBot: {
          index: false,
          follow: false,
        },
      },
    };
  }

  const page = getPageNumber(resolvedSearchParams);

  const hasFilters = hasMeaningfulSearchParams(resolvedSearchParams);

  const baseCanonical = category.canonicalUrl?.trim() || `/categories/${category.slug}`;

  const canonicalPath =
    !hasFilters && page > 1 ? `/categories/${category.slug}?page=${page}` : baseCanonical;

  const baseTitle = category.seoTitle?.trim() || `خرید ${category.name} | ${settings.siteName}`;

  const finalTitle =
    !hasFilters && page > 1 ? `${baseTitle} - صفحه ${toPersianDigits(page)}` : baseTitle;

  const description =
    category.seoDescription?.trim() ||
    `خرید و مشاهده انواع ${category.name} در ${settings.siteName} با امکان بررسی مشخصات، قیمت و انتخاب قطعه مناسب خودرو.`;

  const openGraphImage =
    category.openGraphImageUrl || category.imageUrl || settings.defaultOgImageUrl;

  return buildSeoMetadata({
    title: category.name,

    seoTitle: finalTitle,

    description,

    canonicalPath,

    globalNoIndex: settings.noIndexSite,

    pageNoIndex: category.noIndex || hasFilters,

    type: 'website',

    openGraphTitle: category.openGraphTitle || finalTitle,

    openGraphDescription: category.openGraphDescription || description,

    openGraphImage: openGraphImage
      ? {
          url: openGraphImage,

          alt: category.openGraphImageAlt || category.imageAlt || category.name,
        }
      : null,
  });
}

function ProductsFallback() {
  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {Array.from({
          length: 8,
        }).map((_, index) => (
          <div key={index} className='h-80 animate-pulse rounded-card bg-surface-muted' />
        ))}
      </div>
    </div>
  );
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const [category, settings] = await Promise.all([getCategory(slug), getStorefrontSiteSettings()]);

  if (!category) {
    notFound();
  }

  const page = getPageNumber(resolvedSearchParams);

  const hasFilters = hasMeaningfulSearchParams(resolvedSearchParams);

  /*
   * فقط صفحات تمیز Category و Pagination
   * را Server Render می‌کنیم.
   *
   * URLهای فیلترشده noindex هستند و
   * Client بعداً داده آن‌ها را می‌گیرد.
   */
  const initialResult = !hasFilters ? await getCategoryProducts(category.slug, page) : null;

  if (
    initialResult &&
    page > 1 &&
    (initialResult.meta.totalPages === 0 || page > initialResult.meta.totalPages)
  ) {
    notFound();
  }

  return (
    <>
      {!category.noIndex && !settings.noIndexSite ? (
        <CategoryStructuredData category={category} settings={settings} />
      ) : null}

      <main>
        <div className='mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8'>
          <nav
            aria-label='مسیر صفحه'
            className='flex flex-wrap items-center gap-2 text-sm text-foreground-muted'
          >
            <Link href='/' className='transition-colors hover:text-brand'>
              خانه
            </Link>

            {category.ancestors.map((ancestor) => (
              <span key={ancestor.id} className='flex items-center gap-2'>
                <span aria-hidden='true'>/</span>

                <Link
                  href={`/categories/${ancestor.slug}`}
                  className='transition-colors hover:text-brand'
                >
                  {ancestor.name}
                </Link>
              </span>
            ))}

            <span aria-hidden='true'>/</span>

            <span className='font-semibold text-foreground'>{category.name}</span>
          </nav>

          <header className='mt-6'>
            <p className='text-sm font-semibold text-brand'>دسته‌بندی محصولات</p>

            <h1 className='mt-2 text-3xl font-extrabold text-foreground sm:text-4xl'>
              {category.name}
            </h1>

            {category.description ? (
              <p className='mt-4 max-w-4xl text-sm leading-8 whitespace-pre-line text-foreground-secondary sm:text-base'>
                {category.description}
              </p>
            ) : null}
          </header>

          {category.children.length > 0 ? (
            <section
              aria-labelledby='subcategories-title'
              className='mt-7 border-t border-border pt-6'
            >
              <div className='flex items-start gap-3'>
                <span aria-hidden='true' className='mt-1 h-5 w-1 shrink-0 rounded-full bg-brand' />

                <div>
                  <h2
                    id='subcategories-title'
                    className='text-base font-extrabold text-foreground sm:text-lg'
                  >
                    زیر‌دسته‌ها
                  </h2>

                  <p className='mt-1 text-xs leading-5 text-foreground-muted sm:text-sm'>
                    برای مشاهده دقیق‌تر محصولات، دسته موردنظر را انتخاب کنید
                  </p>
                </div>
              </div>

              <div className='mt-4 grid snap-x snap-mandatory auto-cols-[minmax(150px,180px)] grid-flow-col grid-rows-2 gap-2.5 overflow-x-auto overscroll-x-contain pb-2 lg:auto-cols-[minmax(190px,220px)] lg:grid-rows-1'>
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories/${encodeURIComponent(child.slug)}`}
                    className='group flex min-w-0 snap-start items-center gap-2 rounded-xl border border-border bg-surface p-2 transition duration-200 hover:border-brand/40 hover:bg-brand-soft/30'
                  >
                    <ImageUrlPreview
                      src={child.imageUrl}
                      alt={child.imageAlt || `تصویر ${child.name}`}
                      emptyLabel=''
                      className='min-h-12 min-w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted'
                      imageClassName='object-cover transition-transform duration-200 group-hover:scale-105'
                    />

                    <h3 className='line-clamp-2 min-w-0 text-xs leading-5 font-semibold text-foreground transition-colors group-hover:text-brand md:text-sm'>
                      {child.name}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <Suspense fallback={<ProductsFallback />}>
          <StorefrontProductsPageClient
            fixedCategorySlug={category.slug}
            initialResult={initialResult}
            showHeader={false}
            showCategoryFilter
          />
        </Suspense>
      </main>
    </>
  );
}
