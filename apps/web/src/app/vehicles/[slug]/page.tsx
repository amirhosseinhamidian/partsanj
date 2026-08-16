import type { Metadata } from 'next';

import Link from 'next/link';

import { notFound } from 'next/navigation';

import { Suspense, cache } from 'react';

import { StorefrontProductsPageClient } from '@/components/storefront/catalog/storefront-products-page-client';

import { VehicleStructuredData } from '@/lib/storefront/seo/vehicle-structured-data';

import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

import {
  PUBLIC_CATALOG_API_PATH,
  PUBLIC_VEHICLES_API_PATH,
  publicNestApi,
} from '@/lib/server/public-api';

import type { StorefrontProductsResponse } from '@/lib/storefront/catalog/catalog.types';

import type {
  StorefrontVehicleModelDetail,
  StorefrontVehicleModelDetailResponse,
} from '@/lib/storefront/vehicles/vehicle.types';

import { toPersianDigits } from '@/lib/utils/digits';

const PRODUCTS_PAGE_SIZE = 24;

type SearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;

  searchParams: Promise<SearchParams>;
};

const TRACKING_KEYS = new Set(['gclid', 'fbclid', 'ref', 'source']);

function isTrackingKey(key: string): boolean {
  const normalizedKey = key.trim().toLowerCase();

  return normalizedKey.startsWith('utm_') || TRACKING_KEYS.has(normalizedKey);
}

function hasMeaningfulSearchParams(searchParams: SearchParams): boolean {
  return Object.keys(searchParams).some((key) => key !== 'page' && !isTrackingKey(key));
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

  if (!Number.isSafeInteger(page)) {
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

function getVehicleDisplayName(model: StorefrontVehicleModelDetail): string {
  const makeName = model.make.name.trim();

  const modelName = model.name.trim();

  if (modelName.toLowerCase().startsWith(makeName.toLowerCase())) {
    return modelName;
  }

  return `${makeName} ${modelName}`;
}

const getVehicleModel = cache(
  async (slug: string): Promise<StorefrontVehicleModelDetail | null> => {
    try {
      const response = await publicNestApi<StorefrontVehicleModelDetailResponse>(
        `${PUBLIC_VEHICLES_API_PATH}/models/${encodeURIComponent(slug)}`,
        {
          method: 'GET',

          next: {
            revalidate: 3600,
            tags: [`vehicle-model:${slug}`],
          },
        },
      );

      return response.data;
    } catch {
      return null;
    }
  },
);

const getVehicleProducts = cache(
  async (vehicleModelSlug: string, page: number): Promise<StorefrontProductsResponse> => {
    const query = new URLSearchParams({
      vehicleModel: vehicleModelSlug,

      page: String(page),

      limit: String(PRODUCTS_PAGE_SIZE),
    });

    return publicNestApi<StorefrontProductsResponse>(
      `${PUBLIC_CATALOG_API_PATH}/products?${query.toString()}`,
      {
        method: 'GET',

        next: {
          revalidate: 300,

          tags: [`vehicle-products:${vehicleModelSlug}`],
        },
      },
    );
  },
);

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const model = await getVehicleModel(resolvedParams.slug);

  if (!model) {
    return {
      title: 'مدل خودرو یافت نشد',

      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const { page, invalid: invalidPage } = getPaginationState(resolvedSearchParams);

  const hasFilters = hasMeaningfulSearchParams(resolvedSearchParams);

  let hasProducts = true;

  if (!hasFilters && !invalidPage) {
    const result = await getVehicleProducts(model.slug, page);

    hasProducts = result.meta.total > 0;
  }

  const vehicleName = getVehicleDisplayName(model);

  const baseCanonical = model.canonicalUrl?.trim() || `/vehicles/${model.slug}`;

  const canonical =
    !hasFilters && !invalidPage && page > 1 ? `${baseCanonical}?page=${page}` : baseCanonical;

  const shouldNoIndex = model.noIndex || hasFilters || invalidPage || !hasProducts;

  const titleBase = model.seoTitle?.trim() || `لوازم یدکی ${vehicleName}`;

  const title =
    !hasFilters && !invalidPage && page > 1
      ? `${titleBase} - صفحه ${toPersianDigits(page)}`
      : titleBase;

  const description =
    model.seoDescription?.trim() ||
    `خرید لوازم یدکی و قطعات سازگار با ${vehicleName}. مشاهده محصولات، مشخصات، قیمت و انتخاب قطعه مناسب خودرو.`;

  const ogImage = model.openGraphImageUrl?.trim() || model.imageUrl?.trim() || undefined;

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    robots: {
      index: !shouldNoIndex,
      follow: true,
    },

    openGraph: {
      title: model.openGraphTitle?.trim() || titleBase,

      description: model.openGraphDescription?.trim() || description,

      url: canonical,

      images: ogImage
        ? [
            {
              url: ogImage,

              alt:
                model.openGraphImageAlt?.trim() || model.imageAlt?.trim() || `تصویر ${vehicleName}`,
            },
          ]
        : undefined,
    },
  };
}

export default async function VehicleModelPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const [model, settings] = await Promise.all([
    getVehicleModel(resolvedParams.slug),

    getStorefrontSiteSettings(),
  ]);

  if (!model) {
    notFound();
  }

  const { page, invalid: invalidPage } = getPaginationState(resolvedSearchParams);

  const hasFilters = hasMeaningfulSearchParams(resolvedSearchParams);

  const initialResult =
    !hasFilters && !invalidPage ? await getVehicleProducts(model.slug, page) : null;

  const canRenderStructuredData =
    !model.noIndex &&
    !settings.noIndexSite &&
    !hasFilters &&
    !invalidPage &&
    Boolean(initialResult && initialResult.meta.total > 0);

  if (
    !hasFilters &&
    !invalidPage &&
    page > 1 &&
    (!initialResult || initialResult.meta.totalPages === 0 || page > initialResult.meta.totalPages)
  ) {
    notFound();
  }

  const vehicleName = getVehicleDisplayName(model);

  const productCount = initialResult?.meta.total ?? null;

  return (
    <>
      {canRenderStructuredData ? (
        <VehicleStructuredData model={model} settings={settings} page={page} />
      ) : null}
      <main className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <nav
          aria-label='مسیر صفحه'
          className='mb-5 flex flex-wrap items-center gap-2 text-sm text-foreground-muted'
        >
          <Link href='/' className='transition-colors hover:text-brand'>
            خانه
          </Link>

          <span aria-hidden='true'>/</span>

          <Link href='/products' className='transition-colors hover:text-brand'>
            قطعات خودرو
          </Link>

          <span aria-hidden='true'>/</span>

          <span className='font-medium text-foreground'>{vehicleName}</span>
        </nav>

        <section className='relative isolate overflow-hidden rounded-[28px] border border-border bg-surface shadow-panel'>
          <div
            aria-hidden='true'
            className='absolute inset-0 bg-gradient-to-l from-brand/10 via-brand/5 to-transparent'
          />

          {model.imageUrl ? (
            <>
              <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] sm:block'
                style={{
                  WebkitMaskImage: 'linear-gradient(to right, #000 0%, #000 52%, transparent 100%)',

                  maskImage: 'linear-gradient(to right, #000 0%, #000 52%, transparent 100%)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.imageUrl}
                  alt=''
                  className='h-full w-full object-contain object-left-bottom opacity-95'
                />
              </div>

              <div
                aria-hidden='true'
                className='pointer-events-none absolute bottom-0 left-0 hidden h-20 w-[58%] bg-gradient-to-t from-surface to-transparent sm:block'
              />
            </>
          ) : null}

          <div className='relative z-10 min-h-[300px] max-w-2xl px-6 py-8 sm:flex sm:min-h-[340px] sm:flex-col sm:justify-center sm:px-10 lg:px-12'>
            <div className='inline-flex w-fit items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-bold text-brand'>
              قطعات سازگار با خودرو
            </div>

            <h1 className='mt-4 text-2xl leading-tight font-black text-foreground sm:text-3xl lg:text-4xl'>
              لوازم یدکی {vehicleName}
            </h1>

            <p className='mt-4 max-w-xl text-sm leading-7 text-foreground-secondary sm:text-base'>
              {model.description?.trim() ||
                `قطعات و لوازم یدکی سازگار با ${vehicleName} را بر اساس اطلاعات سازگاری ثبت‌شده در پارت‌سنج مشاهده و مقایسه کنید.`}
            </p>

            {productCount !== null ? (
              <p className='mt-5 text-sm font-bold text-foreground'>
                {toPersianDigits(productCount)} قطعه سازگار
              </p>
            ) : null}

            {model.imageUrl ? (
              <div
                className='relative mt-6 h-40 w-full sm:hidden'
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)',

                  maskImage: 'linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.imageUrl}
                  alt={model.imageAlt?.trim() || `تصویر ${vehicleName}`}
                  className='size-full object-contain object-center'
                />
              </div>
            ) : null}
          </div>
        </section>

        {model.variants.length > 0 ? (
          <section aria-labelledby='vehicle-variants-title' className='mt-7'>
            <h2
              id='vehicle-variants-title'
              className='text-base font-extrabold text-foreground sm:text-lg'
            >
              تیپ‌ها و نسخه‌های {vehicleName}
            </h2>

            <div className='mt-3 flex flex-wrap gap-2'>
              {model.variants.map((variant) => (
                <span
                  key={variant.id}
                  className='rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-secondary'
                >
                  {variant.name}

                  {variant.engineCode ? ` · ${variant.engineCode}` : ''}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby='vehicle-products-title' className='mt-10'>
          <div className='mb-5'>
            <h2
              id='vehicle-products-title'
              className='text-xl font-black text-foreground sm:text-2xl'
            >
              قطعات مناسب {vehicleName}
            </h2>

            <p className='mt-2 text-sm leading-6 text-foreground-muted'>
              محصولات زیر بر اساس اطلاعات سازگاری خودرو فیلتر شده‌اند.
            </p>
          </div>

          <Suspense>
            <StorefrontProductsPageClient
              fixedVehicleModelSlug={model.slug}
              initialResult={initialResult}
              showHeader={false}
              showCategoryFilter
              showVehicleFilter={false}
            />
          </Suspense>
        </section>
      </main>
    </>
  );
}
