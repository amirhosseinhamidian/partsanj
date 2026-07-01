'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarField,
  FilterBarFilters,
  FilterBarSearch,
} from '@/components/ui/filter-bar';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { StorefrontVehicleSelector } from '@/components/storefront/vehicles/storefront-vehicle-selector';
import { storefrontCatalogApi } from '@/lib/api/storefront-catalog-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  StorefrontBrand,
  StorefrontCategory,
  StorefrontProductListItem,
  StorefrontProductsResponse,
  StorefrontStockStatus,
} from '@/lib/storefront/catalog/catalog.types';
import type {
  StorefrontVehicleSelection,
  StorefrontVehicleSelectionInput,
} from '@/lib/storefront/vehicles/vehicle.types';
import { cn } from '@/lib/utils/cn';
import { ArchiveX, Boxes, CircleAlert, PackageSearch, RefreshCw, Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const PRODUCTS_PAGE_SIZE = 24;
const ALL_FILTER_VALUE = '__all__';

type UrlPatch = Record<string, string | null>;

function getPositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function formatToman(value: number): string {
  return `${value.toLocaleString('fa-IR')} تومان`;
}

function getStockStatusLabel(stockStatus: StorefrontStockStatus): string {
  const labels: Record<StorefrontStockStatus, string> = {
    IN_STOCK: 'موجود',
    OUT_OF_STOCK: 'ناموجود',
    CHECK_AVAILABILITY: 'استعلام موجودی',
  };

  return labels[stockStatus];
}

function getStockStatusVariant(stockStatus: StorefrontStockStatus) {
  if (stockStatus === 'IN_STOCK') {
    return 'success' as const;
  }

  if (stockStatus === 'CHECK_AVAILABILITY') {
    return 'warning' as const;
  }

  return 'neutral' as const;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت محصولات با خطا مواجه شد';
}

function ProductCard({ product }: { product: StorefrontProductListItem }) {
  const primaryImage = product.images[0] ?? null;

  const hasPrice = typeof product.effectivePriceToman === 'number';

  const hasActiveSale =
    product.isSaleActive &&
    typeof product.priceToman === 'number' &&
    typeof product.salePriceToman === 'number';

  return (
    <article className='group flex min-w-0 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-panel transition-shadow hover:shadow-floating'>
      <div className='relative'>
        <ImageUrlPreview
          src={primaryImage?.url}
          alt={primaryImage?.alt || `تصویر محصول ${product.name}`}
          emptyLabel='تصویر محصول ثبت نشده است'
          className='aspect-square w-full rounded-none border-0'
          imageClassName='transition-transform duration-300 group-hover:scale-[1.03]'
        />

        {hasActiveSale ? (
          <Badge variant='danger' size='sm' className='absolute start-3 top-3'>
            {product.discountPercent.toLocaleString('fa-IR')}٪ تخفیف
          </Badge>
        ) : null}
      </div>

      <div className='flex flex-1 flex-col p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Badge variant={getStockStatusVariant(product.stockStatus)} size='sm' dot>
            {getStockStatusLabel(product.stockStatus)}
          </Badge>

          <span className='text-xs text-foreground-muted'>{product.brand.name}</span>
        </div>

        <h2 className='mt-3 line-clamp-2 min-h-12 text-base leading-6 font-bold text-foreground'>
          {product.name}
        </h2>

        {product.shortDescription ? (
          <p className='mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-foreground-secondary'>
            {product.shortDescription}
          </p>
        ) : (
          <div className='min-h-10' />
        )}

        <div className='mt-4 border-t border-border pt-4'>
          {hasPrice ? (
            <>
              {hasActiveSale ? (
                <p className='numeric text-xs text-foreground-muted line-through'>
                  {formatToman(product.priceToman)}
                </p>
              ) : null}

              <p className='numeric mt-1 text-lg font-extrabold text-foreground'>
                {formatToman(product.effectivePriceToman)}
              </p>
            </>
          ) : (
            <p className='text-sm font-semibold text-foreground-secondary'>
              قیمت نیازمند استعلام است
            </p>
          )}

          <div className='mt-3 flex items-center justify-between gap-2 text-xs text-foreground-muted'>
            <span className='truncate'>دسته‌بندی: {product.category.name}</span>

            <span dir='ltr' className='shrink-0 font-medium'>
              {product.sku}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductCardSkeleton() {
  return (
    <div className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
      <div className='aspect-square animate-pulse bg-surface-muted' />

      <div className='space-y-3 p-4'>
        <div className='h-5 w-20 animate-pulse rounded bg-surface-muted' />
        <div className='h-6 w-full animate-pulse rounded bg-surface-muted' />
        <div className='h-5 w-4/5 animate-pulse rounded bg-surface-muted' />
        <div className='h-10 w-full animate-pulse rounded bg-surface-muted' />
      </div>
    </div>
  );
}

export function StorefrontProductsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const q = searchParams.get('q') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const category = searchParams.get('category') ?? '';
  const stockStatus = (searchParams.get('stockStatus') as StorefrontStockStatus | null) ?? '';
  const vehicleVariantId = searchParams.get('vehicleVariantId') ?? '';
  const vehicleMake = searchParams.get('vehicleMake') ?? '';
  const vehicleModel = searchParams.get('vehicleModel') ?? '';
  const page = getPositiveInteger(searchParams.get('page'), 1);

  const [searchInput, setSearchInput] = useState(q);

  const [brands, setBrands] = useState<StorefrontBrand[]>([]);

  const [categories, setCategories] = useState<StorefrontCategory[]>([]);

  const [result, setResult] = useState<StorefrontProductsResponse | null>(null);

  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [filtersError, setFiltersError] = useState<string | null>(null);

  const [productsError, setProductsError] = useState<string | null>(null);

  const [vehicleResetKey, setVehicleResetKey] = useState(0);

  const latestProductsRequestId = useRef(0);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const replaceUrl = useCallback(
    (patch: UrlPatch) => {
      const nextSearchParams = new URLSearchParams(searchParamsString);

      Object.entries(patch).forEach(([key, value]) => {
        const normalizedValue = value?.trim() ?? '';

        // صفحه اول نباید در URL ذخیره شود
        if (key === 'page' && normalizedValue === '1') {
          nextSearchParams.delete(key);
          return;
        }

        if (!normalizedValue) {
          nextSearchParams.delete(key);
          return;
        }

        nextSearchParams.set(key, normalizedValue);
      });

      const nextQueryString = nextSearchParams.toString();

      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

      const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

      // جلوگیری قطعی از navigation به همان URL
      if (nextUrl === currentUrl) {
        return;
      }

      router.replace(nextUrl, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString],
  );

  const loadFilters = useCallback(async () => {
    setIsLoadingFilters(true);
    setFiltersError(null);

    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        storefrontCatalogApi.listBrands(),
        storefrontCatalogApi.listCategories(),
      ]);

      setBrands(brandsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      setFiltersError(getErrorMessage(error));
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  const loadProducts = useCallback(async () => {
    const requestId = latestProductsRequestId.current + 1;

    latestProductsRequestId.current = requestId;

    setIsLoadingProducts(true);
    setProductsError(null);

    try {
      const response = await storefrontCatalogApi.listProducts({
        q: q || undefined,
        brand: brand || undefined,
        category: category || undefined,
        vehicleVariantId: vehicleVariantId || undefined,
        stockStatus: stockStatus || undefined,
        page,
        limit: PRODUCTS_PAGE_SIZE,
      });

      if (requestId !== latestProductsRequestId.current) {
        return;
      }

      setResult(response);

      if (response.meta.totalPages > 0 && page > response.meta.totalPages) {
        replaceUrl({
          page: String(response.meta.totalPages),
        });
      }
    } catch (error) {
      if (requestId !== latestProductsRequestId.current) {
        return;
      }

      setProductsError(getErrorMessage(error));
    } finally {
      if (requestId === latestProductsRequestId.current) {
        setIsLoadingProducts(false);
      }
    }
  }, [brand, category, page, q, replaceUrl, stockStatus, vehicleVariantId]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const brandOptions = useMemo(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه برندها',
      },
      ...brands.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    ],
    [brands],
  );

  const categoryOptions = useMemo(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه دسته‌بندی‌ها',
      },
      ...categories.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    ],
    [categories],
  );

  const stockStatusOptions = useMemo(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه وضعیت‌های موجودی',
      },
      {
        value: 'IN_STOCK',
        label: 'موجود',
      },
      {
        value: 'CHECK_AVAILABILITY',
        label: 'نیازمند استعلام',
      },
      {
        value: 'OUT_OF_STOCK',
        label: 'ناموجود',
      },
    ],
    [],
  );

  const initialVehicleSelection =
    vehicleMake && vehicleModel && vehicleVariantId
      ? ({
          makeSlug: vehicleMake,
          modelSlug: vehicleModel,
          variantId: vehicleVariantId,
        } satisfies StorefrontVehicleSelectionInput)
      : undefined;

  const activeFilterCount = [q, brand, category, stockStatus, vehicleVariantId].filter(
    Boolean,
  ).length;

  function handleSearch(nextQuery: string) {
    replaceUrl({
      q: nextQuery.trim() || null,
      page: '1',
    });
  }

  const handleVehicleChange = useCallback(
    (selection: StorefrontVehicleSelection | null) => {
      if (!selection) {
        replaceUrl({
          vehicleVariantId: null,
          vehicleMake: null,
          vehicleModel: null,
          page: '1',
        });

        return;
      }

      replaceUrl({
        vehicleVariantId: selection.variant.id,
        vehicleMake: selection.make.slug,
        vehicleModel: selection.model.slug,
        page: '1',
      });
    },
    [replaceUrl],
  );
  function clearAllFilters() {
    setSearchInput('');
    setVehicleResetKey((currentValue) => currentValue + 1);

    replaceUrl({
      q: null,
      brand: null,
      category: null,
      stockStatus: null,
      vehicleVariantId: null,
      vehicleMake: null,
      vehicleModel: null,
      page: null,
    });
  }

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='space-y-8'>
        <header>
          <p className='text-sm font-semibold text-brand'>فروشگاه پارت‌سنج</p>

          <h1 className='mt-1 text-3xl font-extrabold text-foreground sm:text-4xl'>
            قطعات یدکی خودرو
          </h1>

          <p className='mt-3 max-w-2xl text-sm leading-7 text-foreground-secondary sm:text-base'>
            قطعه مناسب خودروی خود را با فیلتر برند، دسته‌بندی، موجودی و سازگاری خودرو پیدا کنید
          </p>
        </header>

        <StorefrontVehicleSelector
          initialSelection={initialVehicleSelection}
          hasExternalVehicleFilter={Boolean(vehicleVariantId)}
          resetKey={vehicleResetKey}
          onVehicleChange={handleVehicleChange}
        />

        {filtersError ? (
          <div
            role='alert'
            className='flex flex-col gap-3 rounded-card border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between'
          >
            <div className='flex items-start gap-2 text-warning'>
              <CircleAlert className='mt-0.5 size-5 shrink-0' />
              <p className='text-sm font-semibold'>فیلترهای برند و دسته‌بندی بارگذاری نشدند</p>
            </div>

            <Button
              type='button'
              size='sm'
              variant='outline'
              iconStart={<RefreshCw />}
              onClick={() => void loadFilters()}
            >
              تلاش مجدد
            </Button>
          </div>
        ) : null}

        <FilterBar id='catalog-filters'>
          <FilterBarSearch>
            <SearchInput
              value={searchInput}
              onValueChange={setSearchInput}
              onSearch={handleSearch}
              loading={isLoadingProducts}
              placeholder='جستجو در نام، کد کالا یا توضیحات'
            />
          </FilterBarSearch>

          <FilterBarFilters>
            <FilterBarField width='md'>
              <Select
                value={brand || ALL_FILTER_VALUE}
                onValueChange={(value) => {
                  replaceUrl({
                    brand: value === ALL_FILTER_VALUE ? null : value,
                    page: '1',
                  });
                }}
                disabled={isLoadingFilters}
                options={brandOptions}
              />
            </FilterBarField>

            <FilterBarField width='md'>
              <Select
                value={category || ALL_FILTER_VALUE}
                onValueChange={(value) => {
                  replaceUrl({
                    category: value === ALL_FILTER_VALUE ? null : value,
                    page: '1',
                  });
                }}
                disabled={isLoadingFilters}
                options={categoryOptions}
              />
            </FilterBarField>

            <FilterBarField width='md'>
              <Select
                value={stockStatus || ALL_FILTER_VALUE}
                onValueChange={(value) => {
                  replaceUrl({
                    stockStatus: value === ALL_FILTER_VALUE ? null : value,
                    page: '1',
                  });
                }}
                options={stockStatusOptions}
              />
            </FilterBarField>
          </FilterBarFilters>

          <FilterBarActions>
            <FilterBarClearButton activeFilterCount={activeFilterCount} onClick={clearAllFilters} />
          </FilterBarActions>
        </FilterBar>

        <section>
          <div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <span className='grid size-10 place-items-center rounded-control bg-brand-soft text-brand'>
                <Boxes className='size-5' />
              </span>

              <div>
                <h2 className='text-lg font-bold text-foreground'>محصولات</h2>

                <p className='mt-0.5 text-sm text-foreground-muted'>
                  {result
                    ? `${result.meta.total.toLocaleString('fa-IR')} محصول پیدا شد`
                    : 'در حال دریافت محصولات'}
                </p>
              </div>
            </div>

            {vehicleVariantId ? (
              <Badge variant='brand' startIcon={<Tag />}>
                فیلتر سازگاری خودرو فعال است
              </Badge>
            ) : null}
          </div>

          {productsError ? (
            <div
              role='alert'
              className='rounded-card border border-danger/30 bg-danger-soft p-6 text-center'
            >
              <CircleAlert className='mx-auto size-7 text-danger' />

              <h3 className='mt-3 text-base font-bold text-danger'>دریافت محصولات انجام نشد</h3>

              <p className='mt-2 text-sm leading-6 text-foreground-secondary'>{productsError}</p>

              <Button
                type='button'
                size='sm'
                className='mt-4'
                iconStart={<RefreshCw />}
                onClick={() => void loadProducts()}
              >
                تلاش مجدد
              </Button>
            </div>
          ) : isLoadingProducts ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : result?.data.length ? (
            <>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                {result.data.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <Pagination
                className='mt-6'
                page={result.meta.page}
                pageSize={result.meta.limit}
                totalItems={result.meta.total}
                onPageChange={(nextPage) => {
                  replaceUrl({
                    page: nextPage === 1 ? null : String(nextPage),
                  });
                }}
                loading={isLoadingProducts}
                hideWhenSinglePage
              />
            </>
          ) : (
            <div className='rounded-card border border-dashed border-border bg-surface p-10 text-center'>
              <PackageSearch className='mx-auto size-9 text-foreground-muted' />

              <h3 className='mt-4 text-lg font-bold text-foreground'>محصولی پیدا نشد</h3>

              <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary'>
                فیلترها را تغییر دهید یا انتخاب خودرو را پاک کنید
              </p>

              {activeFilterCount > 0 ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-5'
                  iconStart={<ArchiveX />}
                  onClick={clearAllFilters}
                >
                  پاک‌سازی فیلترها
                </Button>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
