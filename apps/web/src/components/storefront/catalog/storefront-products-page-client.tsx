'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { Pagination } from '@/components/ui/pagination';
import { useCustomerVehiclesForCompatibility } from '@/lib/storefront/customer-vehicle/use-customer-vehicles-for-compatibility';
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
import {
  ArchiveX,
  Boxes,
  CarFront,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  PackageSearch,
  RefreshCw,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toPersianDigits } from '@/lib/utils/digits';
import {
  StorefrontProductsFilterBar,
  type StorefrontProductsFilterDraft,
} from '@/components/storefront/catalog/storefront-products-filter-bar';
import { cn } from '@/lib/utils/cn';
import { StorefrontVehicleCompatibilityFilter } from '../vehicles/storefront-vehicle-compatibility-filter';
import { readStorefrontVehicleSelection } from '@/lib/storefront/vehicles/vehicle-selection-storage';
import { ProductCardPrice } from './product-card-price';

const PRODUCTS_PAGE_SIZE = 24;

type StorefrontProductsPageClientProps = {
  fixedCategorySlug?: string;
  initialResult?: StorefrontProductsResponse | null;
  showHeader?: boolean;
  showCategoryFilter?: boolean;
  fixedVehicleModelSlug?: string;
  showVehicleFilter?: boolean;
};

type UrlPatch = Record<string, string | null>;

type ProductToolsPanel = 'vehicle' | 'filters' | null;

type ProductToolsPanelName = Exclude<ProductToolsPanel, null>;

type ProductVehicleContext = {
  vehicleVariantId: string;
  vehicleMake?: string;
  vehicleModel?: string;
};

type ExpandableProductsToolsPanelProps = {
  open: boolean;
  children: ReactNode;
};

function getPositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
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

function buildProductHref(slug: string, vehicleContext: ProductVehicleContext | null): string {
  const searchParams = new URLSearchParams();

  if (vehicleContext?.vehicleVariantId) {
    searchParams.set('vehicleVariantId', vehicleContext.vehicleVariantId);
  }

  if (vehicleContext?.vehicleMake) {
    searchParams.set('vehicleMake', vehicleContext.vehicleMake);
  }

  if (vehicleContext?.vehicleModel) {
    searchParams.set('vehicleModel', vehicleContext.vehicleModel);
  }

  const queryString = searchParams.toString();

  return queryString
    ? `/products/${encodeURIComponent(slug)}?${queryString}`
    : `/products/${encodeURIComponent(slug)}`;
}

function ExpandableProductsToolsPanel({ open, children }: ExpandableProductsToolsPanelProps) {
  const inertProps = !open ? ({ inert: '' } as { inert: '' }) : {};

  return (
    <div
      aria-hidden={!open}
      {...inertProps}
      className={cn(
        'grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out',
        open
          ? 'mt-4 grid-rows-[1fr] opacity-100'
          : 'pointer-events-none mt-0 grid-rows-[0fr] opacity-0',
      )}
    >
      <div className='min-h-0 overflow-hidden'>
        <div className='pb-1'>{children}</div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  vehicleContext,
}: {
  product: StorefrontProductListItem;
  vehicleContext: ProductVehicleContext | null;
}) {
  const primaryImage = product.images[0] ?? null;

  const hasActiveSale =
    product.isSaleActive && product.priceToman !== null && product.effectivePriceToman !== null;

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
            {toPersianDigits(product.discountPercent)}٪ تخفیف
          </Badge>
        ) : null}
      </div>

      <div className='flex flex-1 flex-col p-4'>
        <div className='flex flex-col flex-nowrap items-start gap-2'>
          <Badge variant={getStockStatusVariant(product.stockStatus)} size='sm' dot>
            {getStockStatusLabel(product.stockStatus)}
          </Badge>

          <div className='flex min-w-0 items-center gap-1.5 text-xs'>
            <Link
              href={`/categories/${encodeURIComponent(product.category.slug)}`}
              className='max-w-32 truncate font-semibold text-foreground-secondary transition-colors hover:text-brand'
            >
              {product.category.name}
            </Link>

            <span aria-hidden='true' className='text-foreground-muted'>
              •
            </span>

            <span className='max-w-28 truncate text-foreground-muted'>{product.brand.name}</span>
          </div>
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

        <div className='mt-4 flex flex-1 flex-col border-t border-border pt-2'>
          <ProductCardPrice product={product} variant='product-list' />

          <Link
            href={buildProductHref(product.slug, vehicleContext)}
            className='mt-auto block pt-2'
          >
            <Button fullWidth iconEnd={<ChevronLeft />}>
              مشاهده جزئیات قطعه
            </Button>
          </Link>
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

export function StorefrontProductsPageClient({
  fixedCategorySlug,
  fixedVehicleModelSlug,
  initialResult = null,
  showHeader = true,
  showCategoryFilter = true,
  showVehicleFilter = true,
}: StorefrontProductsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const q = searchParams.get('q') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const category = fixedCategorySlug?.trim() || urlCategory;
  const stockStatus = (searchParams.get('stockStatus') as StorefrontStockStatus | null) ?? '';
  const vehicleVariantId = searchParams.get('vehicleVariantId') ?? '';
  const vehicleMake = searchParams.get('vehicleMake') ?? '';
  const vehicleModel = searchParams.get('vehicleModel') ?? '';
  const page = getPositiveInteger(searchParams.get('page'), 1);

  const [brands, setBrands] = useState<StorefrontBrand[]>([]);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [result, setResult] = useState<StorefrontProductsResponse | null>(initialResult);

  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(!initialResult);

  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [vehicleResetKey, setVehicleResetKey] = useState(0);

  const [openToolsPanel, setOpenToolsPanel] = useState<ProductToolsPanel>(null);

  const [draftFilters, setDraftFilters] = useState<StorefrontProductsFilterDraft>(() => ({
    q,
    brand,

    category: showCategoryFilter ? fixedCategorySlug?.trim() || urlCategory : '',

    stockStatus,
  }));

  const [storedVehicleSelection, setStoredVehicleSelection] =
    useState<StorefrontVehicleSelectionInput>();

  const {
    vehicles: customerVehicles,
    isLoading: isLoadingCustomerVehicles,
    error: customerVehiclesError,
    isAuthenticated,
    isSavingSelectedVehicle,
    saveSelectedVehicleError,
    saveSelectedVehicle,
  } = useCustomerVehiclesForCompatibility();

  const latestProductsRequestId = useRef(0);
  const shouldUseInitialResultRef = useRef(Boolean(initialResult));

  const replaceUrl = useCallback(
    (patch: UrlPatch) => {
      const nextSearchParams = new URLSearchParams(searchParamsString);

      Object.entries(patch).forEach(([key, value]) => {
        const normalizedValue = value?.trim() ?? '';

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

      if (nextUrl === currentUrl) {
        return;
      }

      router.replace(nextUrl, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString],
  );

  const navigateToCategory = useCallback(
    (categorySlug: string, filters: StorefrontProductsFilterDraft) => {
      const normalizedCategorySlug = categorySlug.trim();

      if (!normalizedCategorySlug) {
        return;
      }

      const nextSearchParams = new URLSearchParams(searchParamsString);

      /*
       * Category دیگر query parameter نیست؛
       * داخل pathname قرار می‌گیرد.
       */
      nextSearchParams.delete('category');

      /*
       * با تغییر دسته همیشه از صفحه اول
       * شروع می‌کنیم.
       */
      nextSearchParams.delete('page');

      /*
       * Trackingهای URL قبلی را در لینک
       * داخلی جدید تکثیر نمی‌کنیم.
       */
      for (const key of [...nextSearchParams.keys()]) {
        const normalizedKey = key.trim().toLowerCase();

        if (
          normalizedKey.startsWith('utm_') ||
          normalizedKey === 'gclid' ||
          normalizedKey === 'fbclid' ||
          normalizedKey === 'ref' ||
          normalizedKey === 'source'
        ) {
          nextSearchParams.delete(key);
        }
      }

      const qValue = filters.q.trim();

      if (qValue) {
        nextSearchParams.set('q', qValue);
      } else {
        nextSearchParams.delete('q');
      }

      if (filters.brand) {
        nextSearchParams.set('brand', filters.brand);
      } else {
        nextSearchParams.delete('brand');
      }

      if (filters.stockStatus) {
        nextSearchParams.set('stockStatus', filters.stockStatus);
      } else {
        nextSearchParams.delete('stockStatus');
      }

      const queryString = nextSearchParams.toString();

      const categoryPath = `/categories/${encodeURIComponent(normalizedCategorySlug)}`;

      const nextUrl = queryString ? `${categoryPath}?${queryString}` : categoryPath;

      router.push(nextUrl);
    },
    [router, searchParamsString],
  );

  const getPaginationHref = useCallback(
    (nextPage: number) => {
      const nextSearchParams = new URLSearchParams(searchParamsString);

      /*
       * در صفحه /categories/[slug]
       * دسته از pathname مشخص است و نباید
       * دوباره ?category=... تولید شود.
       */
      if (fixedCategorySlug) {
        nextSearchParams.delete('category');
      }

      /*
       * در Vehicle Landing خود مدل خودرو داخل
       * pathname مشخص است؛ پارامترهای انتخاب
       * خودرو نباید دوباره در pagination تکثیر شوند.
       */
      if (fixedVehicleModelSlug) {
        nextSearchParams.delete('vehicleModel');
        nextSearchParams.delete('vehicleVariantId');
        nextSearchParams.delete('vehicleMake');
      }

      /*
       * Tracking params را در لینک‌های
       * داخلی pagination تکثیر نمی‌کنیم.
       */
      for (const key of [...nextSearchParams.keys()]) {
        const normalizedKey = key.trim().toLowerCase();

        if (
          normalizedKey.startsWith('utm_') ||
          normalizedKey === 'gclid' ||
          normalizedKey === 'fbclid' ||
          normalizedKey === 'ref' ||
          normalizedKey === 'source'
        ) {
          nextSearchParams.delete(key);
        }
      }

      if (nextPage <= 1) {
        nextSearchParams.delete('page');
      } else {
        nextSearchParams.set('page', String(nextPage));
      }

      const queryString = nextSearchParams.toString();

      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [fixedCategorySlug, fixedVehicleModelSlug, pathname, searchParamsString],
  );

  useEffect(() => {
    setDraftFilters({
      q,
      brand,

      category: showCategoryFilter ? fixedCategorySlug?.trim() || urlCategory : '',

      stockStatus,
    });
  }, [q, brand, urlCategory, stockStatus, showCategoryFilter, fixedCategorySlug]);

  const applyFilters = useCallback(
    (nextDraft: StorefrontProductsFilterDraft = draftFilters) => {
      const normalizedDraft: StorefrontProductsFilterDraft = {
        ...nextDraft,

        q: nextDraft.q.trim(),

        category: nextDraft.category.trim(),
      };

      setDraftFilters(normalizedDraft);

      const selectedCategory = normalizedDraft.category;

      /*
       * اگر Category دیگری انتخاب شد،
       * وارد Landing Page همان Category شو.
       */
      if (
        showCategoryFilter &&
        !fixedVehicleModelSlug &&
        selectedCategory &&
        selectedCategory !== fixedCategorySlug
      ) {
        navigateToCategory(selectedCategory, normalizedDraft);

        return;
      }

      /*
       * اگر روی Category Landing هستیم
       * و کاربر "همه دسته‌بندی‌ها" را انتخاب کرد،
       * باید به /products برگردیم.
       */
      if (showCategoryFilter && !fixedVehicleModelSlug && fixedCategorySlug && !selectedCategory) {
        const nextSearchParams = new URLSearchParams();

        if (normalizedDraft.q) {
          nextSearchParams.set('q', normalizedDraft.q);
        }

        if (normalizedDraft.brand) {
          nextSearchParams.set('brand', normalizedDraft.brand);
        }

        if (normalizedDraft.stockStatus) {
          nextSearchParams.set('stockStatus', normalizedDraft.stockStatus);
        }

        if (vehicleVariantId) {
          nextSearchParams.set('vehicleVariantId', vehicleVariantId);
        }

        if (vehicleMake) {
          nextSearchParams.set('vehicleMake', vehicleMake);
        }

        if (vehicleModel) {
          nextSearchParams.set('vehicleModel', vehicleModel);
        }

        const queryString = nextSearchParams.toString();

        router.push(queryString ? `/products?${queryString}` : '/products');

        return;
      }

      /*
       * همان Category فعلی است؛
       * فقط سایر فیلترها تغییر می‌کنند.
       */
      replaceUrl({
        q: normalizedDraft.q || null,

        brand: normalizedDraft.brand || null,

        /*
         * روی Vehicle Landing دسته‌بندی یک
         * فیلتر ثانویه است و در query می‌ماند.
         * روی Category Landing خود دسته در pathname است.
         */
        category: fixedVehicleModelSlug ? normalizedDraft.category || null : null,

        stockStatus: normalizedDraft.stockStatus || null,

        page: '1',
      });
    },
    [
      draftFilters,
      fixedCategorySlug,
      fixedVehicleModelSlug,
      navigateToCategory,
      replaceUrl,
      router,
      showCategoryFilter,
      vehicleMake,
      vehicleModel,
      vehicleVariantId,
    ],
  );

  const clearAllFilters = useCallback(() => {
    setDraftFilters({
      q: '',
      brand: '',

      category: fixedCategorySlug?.trim() || '',

      stockStatus: '',
    });

    setVehicleResetKey((currentValue) => currentValue + 1);

    replaceUrl({
      q: null,
      brand: null,

      /*
       * Category در pathname است.
       */
      category: null,

      stockStatus: null,

      vehicleVariantId: null,
      vehicleMake: null,
      vehicleModel: null,

      page: null,
    });
  }, [fixedCategorySlug, replaceUrl]);

  const toggleToolsPanel = useCallback((panel: ProductToolsPanelName) => {
    setOpenToolsPanel((current) => (current === panel ? null : panel));
  }, []);

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
        category: fixedCategorySlug || category || undefined,
        vehicleModel: fixedVehicleModelSlug || undefined,
        vehicleVariantId: fixedVehicleModelSlug ? undefined : vehicleVariantId || undefined,
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
  }, [
    brand,
    category,
    fixedCategorySlug,
    fixedVehicleModelSlug,
    page,
    q,
    replaceUrl,
    stockStatus,
    vehicleVariantId,
  ]);

  useEffect(() => {
    if (shouldUseInitialResultRef.current) {
      shouldUseInitialResultRef.current = false;
      return;
    }

    void loadProducts();
  }, [loadProducts]);

  const brandOptions = useMemo(
    () =>
      brands.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    [brands],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((item) => ({
        value: item.slug,
        label: item.name,
      })),
    [categories],
  );

  const stockStatusOptions = useMemo(
    () => [
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

  const initialVehicleSelection = useMemo<StorefrontVehicleSelectionInput | undefined>(() => {
    if (vehicleMake && vehicleModel && vehicleVariantId) {
      return {
        makeSlug: vehicleMake,
        modelSlug: vehicleModel,
        variantId: vehicleVariantId,
      };
    }

    if (
      vehicleVariantId &&
      storedVehicleSelection?.variantId === vehicleVariantId &&
      storedVehicleSelection.makeSlug &&
      storedVehicleSelection.modelSlug
    ) {
      return storedVehicleSelection;
    }

    return undefined;
  }, [storedVehicleSelection, vehicleMake, vehicleModel, vehicleVariantId]);

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

  const catalogAppliedFilterCount = [
    q,
    brand,
    showCategoryFilter ? urlCategory : '',
    stockStatus,
  ].filter(Boolean).length;

  const hasAppliedVehicleVariantFilter =
    showVehicleFilter && !fixedVehicleModelSlug && Boolean(vehicleVariantId);

  const totalAppliedFilterCount =
    catalogAppliedFilterCount + (hasAppliedVehicleVariantFilter ? 1 : 0);

  const productVehicleContext = useMemo<ProductVehicleContext | null>(() => {
    if (fixedVehicleModelSlug || !vehicleVariantId) {
      return null;
    }

    return {
      vehicleVariantId,
      vehicleMake: vehicleMake || undefined,
      vehicleModel: vehicleModel || undefined,
    };
  }, [fixedVehicleModelSlug, vehicleMake, vehicleModel, vehicleVariantId]);

  useEffect(() => {
    const storedSelection = readStorefrontVehicleSelection() ?? undefined;

    if (
      vehicleVariantId &&
      storedSelection?.variantId === vehicleVariantId &&
      storedSelection.makeSlug &&
      storedSelection.modelSlug
    ) {
      setStoredVehicleSelection(storedSelection);
      return;
    }

    if (!vehicleVariantId) {
      setStoredVehicleSelection(storedSelection);
      return;
    }

    setStoredVehicleSelection(undefined);
  }, [vehicleVariantId]);

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='space-y-4'>
        {showHeader && !fixedCategorySlug && !fixedVehicleModelSlug ? (
          <header>
            <p className='text-sm font-semibold text-brand'>فروشگاه پارت‌سنج</p>

            <h1 className='mt-1 text-3xl font-extrabold text-foreground sm:text-4xl'>
              قطعات یدکی خودرو
            </h1>

            <p className='mt-3 max-w-2xl text-sm leading-7 text-foreground-secondary sm:text-base'>
              قطعه مناسب خودروی خود را با فیلتر برند، دسته‌بندی، موجودی و سازگاری خودرو پیدا کنید
            </p>
          </header>
        ) : null}

        <div className='sticky top-3 z-30'>
          <div className='flex flex-wrap gap-2'>
            {showVehicleFilter ? (
              <Button
                type='button'
                variant='outline'
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleToolsPanel('vehicle');
                }}
                iconStart={<CarFront className='size-4' />}
                iconEnd={
                  <ChevronDown
                    className={cn(
                      'size-4 transition-transform',
                      openToolsPanel === 'vehicle' && 'rotate-180',
                    )}
                  />
                }
              >
                <span>انتخاب خودرو</span>

                {hasAppliedVehicleVariantFilter ? (
                  <Badge variant='danger' size='sm' dot className='mr-3'>
                    فعال
                  </Badge>
                ) : null}
              </Button>
            ) : null}

            <Button
              type='button'
              variant='outline'
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleToolsPanel('filters');
              }}
              iconStart={<SlidersHorizontal className='size-4' />}
              iconEnd={
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform',
                    openToolsPanel === 'filters' && 'rotate-180',
                  )}
                />
              }
            >
              <span>فیلترها</span>

              {catalogAppliedFilterCount > 0 ? (
                <span>
                  {openToolsPanel ? (
                    <Badge size='sm' className='mr-3'>
                      {toPersianDigits(catalogAppliedFilterCount)}
                    </Badge>
                  ) : (
                    <Badge size='sm' className='mr-3' variant='danger'>
                      {toPersianDigits(catalogAppliedFilterCount)}
                    </Badge>
                  )}
                </span>
              ) : null}
            </Button>
          </div>
        </div>

        {showVehicleFilter ? (
          <ExpandableProductsToolsPanel open={openToolsPanel === 'vehicle'}>
            <StorefrontVehicleCompatibilityFilter
              initialSelection={initialVehicleSelection}
              hasExternalVehicleFilter={hasAppliedVehicleVariantFilter}
              resetKey={vehicleResetKey}
              savedVehicles={customerVehicles}
              savedVehiclesLoading={isLoadingCustomerVehicles}
              savedVehiclesError={customerVehiclesError}
              isAuthenticated={isAuthenticated}
              isSavingSelectedVehicle={isSavingSelectedVehicle}
              saveSelectedVehicleError={saveSelectedVehicleError}
              onSaveSelectedVehicle={saveSelectedVehicle}
              onVehicleChange={handleVehicleChange}
            />
          </ExpandableProductsToolsPanel>
        ) : null}

        <ExpandableProductsToolsPanel open={openToolsPanel === 'filters'}>
          <>
            {filtersError ? (
              <div
                role='alert'
                className='mb-4 flex flex-col gap-3 rounded-card border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between'
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

            <StorefrontProductsFilterBar
              draft={draftFilters}
              brandOptions={brandOptions}
              categoryOptions={categoryOptions}
              stockStatusOptions={stockStatusOptions}
              showCategoryFilter={showCategoryFilter}
              loading={isLoadingProducts}
              optionsLoading={isLoadingFilters}
              externalActiveFilterCount={hasAppliedVehicleVariantFilter ? 1 : 0}
              onDraftChange={(patch) => {
                setDraftFilters((current) => ({
                  ...current,
                  ...patch,
                }));
              }}
              onApply={applyFilters}
              onReset={clearAllFilters}
            />
          </>
        </ExpandableProductsToolsPanel>

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
                    ? `${toPersianDigits(result.meta.total)} محصول پیدا شد`
                    : 'در حال دریافت محصولات'}
                </p>
              </div>
            </div>

            {hasAppliedVehicleVariantFilter ? (
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
                  <ProductCard
                    key={product.id}
                    product={product}
                    vehicleContext={productVehicleContext}
                  />
                ))}
              </div>

              <Pagination
                className='mt-6'
                page={result.meta.page}
                pageSize={result.meta.limit}
                totalItems={result.meta.total}
                getPageHref={getPaginationHref}
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
                {fixedVehicleModelSlug
                  ? 'فیلترها را تغییر دهید؛ فعلاً محصولی با این شرایط برای این خودرو پیدا نشد'
                  : 'فیلترها را تغییر دهید یا انتخاب خودرو را پاک کنید'}
              </p>

              {totalAppliedFilterCount > 0 ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-5'
                  iconStart={<ArchiveX />}
                  onClick={() => {
                    clearAllFilters();
                  }}
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
