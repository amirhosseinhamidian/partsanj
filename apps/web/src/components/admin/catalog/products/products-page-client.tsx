'use client';

import {
  ProductsFilterBar,
  type ProductFiltersDraft,
} from '@/components/admin/catalog/products/products-filter-bar';
import { ProductsTable } from '@/components/admin/catalog/products/products-table';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { adminBrandsApi } from '@/lib/api/admin-brands-client';
import { adminCategoriesApi } from '@/lib/api/admin-categories-client';
import { adminProductsApi } from '@/lib/api/admin-products-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  AdminProductsListResponse,
  ProductStatus,
  StockStatus,
} from '@/lib/admin/catalog/product.types';
import { Download, PackageSearch, RefreshCw } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CatalogImportShortcutButton } from '@/components/admin/catalog/import/catalog-import-shortcut-button';
import { downloadCsv, getCsvDate, yesNo } from '@/lib/utils/csv';

const PAGE_SIZE = 24;
const EXPORT_PAGE_SIZE = 100;

const PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
const STOCK_STATUSES: StockStatus[] = ['IN_STOCK', 'OUT_OF_STOCK', 'CHECK_AVAILABILITY'];

type UrlPatch = Partial<
  Record<'q' | 'brandId' | 'categoryId' | 'status' | 'stockStatus' | 'page', string | null>
>;

const emptyResponse: AdminProductsListResponse = {
  data: [],
  meta: {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  },
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function isProductStatus(value: string | null): value is ProductStatus {
  return PRODUCT_STATUSES.some((status) => status === value);
}

function isStockStatus(value: string | null): value is StockStatus {
  return STOCK_STATUSES.some((status) => status === value);
}

function readFilters(searchParamsString: string) {
  const params = new URLSearchParams(searchParamsString);
  const status = params.get('status');
  const stockStatus = params.get('stockStatus');

  return {
    q: params.get('q')?.trim() || '',
    brandId: params.get('brandId')?.trim() || '',
    categoryId: params.get('categoryId')?.trim() || '',
    status: isProductStatus(status) ? status : '',
    stockStatus: isStockStatus(stockStatus) ? stockStatus : '',
    page: parsePositiveInteger(params.get('page'), 1),
  } satisfies ProductFiltersDraft & { page: number };
}

function toDraft(filters: ReturnType<typeof readFilters>): ProductFiltersDraft {
  return {
    q: filters.q,
    brandId: filters.brandId,
    categoryId: filters.categoryId,
    status: filters.status,
    stockStatus: filters.stockStatus,
  };
}

export function ProductsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const filters = useMemo(() => readFilters(searchParamsString), [searchParamsString]);

  const [response, setResponse] = useState<AdminProductsListResponse>(emptyResponse);
  const [draftFilters, setDraftFilters] = useState<ProductFiltersDraft>(() => toDraft(filters));

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [brands, setBrands] = useState<Awaited<ReturnType<typeof adminBrandsApi.list>>>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof adminCategoriesApi.list>>>(
    [],
  );

  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const latestProductsRequestId = useRef(0);

  useEffect(() => {
    setDraftFilters(toDraft(filters));
  }, [filters]);

  const replaceUrl = useCallback(
    (patch: UrlPatch) => {
      const nextParams = new URLSearchParams(searchParamsString);

      for (const [key, value] of Object.entries(patch)) {
        const normalizedValue = value?.trim() ?? '';

        if (!normalizedValue || (key === 'page' && normalizedValue === '1')) {
          nextParams.delete(key);
          continue;
        }

        nextParams.set(key, normalizedValue);
      }

      const nextQueryString = nextParams.toString();
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

  const loadProducts = useCallback(async () => {
    const requestId = latestProductsRequestId.current + 1;
    latestProductsRequestId.current = requestId;

    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await adminProductsApi.list({
        q: filters.q || undefined,
        status: filters.status || undefined,
        stockStatus: filters.stockStatus || undefined,
        brandId: filters.brandId || undefined,
        categoryId: filters.categoryId || undefined,
        page: filters.page,
        limit: PAGE_SIZE,
      });

      if (requestId !== latestProductsRequestId.current) {
        return;
      }

      setResponse(result);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');
        return;
      }

      if (requestId !== latestProductsRequestId.current) {
        return;
      }

      setLoadError(getErrorMessage(error, 'دریافت اطلاعات محصولات با خطا مواجه شد'));
    } finally {
      if (requestId === latestProductsRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  const loadFilterOptions = useCallback(async () => {
    setIsOptionsLoading(true);
    setOptionsError(null);

    try {
      const [brandsResult, categoriesResult] = await Promise.all([
        adminBrandsApi.list(),
        adminCategoriesApi.list(),
      ]);

      setBrands(brandsResult);
      setCategories(categoriesResult);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');
        return;
      }

      setOptionsError(getErrorMessage(error, 'دریافت فیلترهای برند و دسته‌بندی با خطا مواجه شد'));
    } finally {
      setIsOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadFilterOptions();
  }, [loadFilterOptions]);

  const brandOptions = useMemo(
    () =>
      brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
        description: [brand.slug, !brand.isActive ? 'غیرفعال' : null].filter(Boolean).join(' · '),
      })),
    [brands],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
        description: [
          category.slug,
          category.parent?.name ?? 'دسته اصلی',
          !category.isActive ? 'غیرفعال' : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    [categories],
  );

  function applyFilters(nextDraft = draftFilters) {
    replaceUrl({
      q: nextDraft.q,
      brandId: nextDraft.brandId,
      categoryId: nextDraft.categoryId,
      status: nextDraft.status,
      stockStatus: nextDraft.stockStatus,
      page: '1',
    });
  }

  function resetFilters() {
    const emptyFilters: ProductFiltersDraft = {
      q: '',
      brandId: '',
      categoryId: '',
      status: '',
      stockStatus: '',
    };

    setDraftFilters(emptyFilters);
    router.replace(pathname, {
      scroll: false,
    });
  }

  function refreshAll() {
    void loadProducts();
    void loadFilterOptions();
  }

  async function exportProductsCsv() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const baseQuery = {
        q: filters.q || undefined,
        status: filters.status || undefined,
        stockStatus: filters.stockStatus || undefined,
        brandId: filters.brandId || undefined,
        categoryId: filters.categoryId || undefined,
        limit: EXPORT_PAGE_SIZE,
      };

      const firstResponse = await adminProductsApi.list({
        ...baseQuery,
        page: 1,
      });

      const products = [...firstResponse.data];

      // تمام صفحات را می‌گیریم، نه فقط صفحه‌ای که ادمین روی آن قرار دارد.
      for (let page = 2; page <= firstResponse.meta.totalPages; page += 1) {
        const pageResponse = await adminProductsApi.list({
          ...baseQuery,
          page,
        });

        products.push(...pageResponse.data);
      }

      downloadCsv(
        `products-${getCsvDate()}.csv`,
        [
          'ID',
          'SKU',
          'نام محصول',
          'Slug',
          'برند',
          'دسته‌بندی',
          'قیمت',
          'قیمت فروش ویژه',
          'قیمت نهایی',
          'مبلغ تخفیف',
          'درصد تخفیف',
          'وضعیت موجودی',
          'تعداد موجودی',
          'حد هشدار موجودی',
          'وضعیت محصول',
          'منتشر شده',
          'فعال در ترب',
          'نمایش در صفحه اصلی',
          'ترتیب صفحه اصلی',
          'کدها',
          'تصویر',
          'آخرین بروزرسانی',
        ],
        products.map((product) => [
          product.id,
          product.sku,
          product.name,
          product.slug,
          product.brand.name,
          product.category.name,
          product.priceToman,
          product.salePriceToman,
          product.effectivePriceToman,
          product.discountAmountToman,
          product.discountPercent,
          product.stockStatus,
          product.stockQuantity,
          product.lowStockThreshold,
          product.status,
          yesNo(product.isPublished),
          yesNo(product.isTorobEnabled),
          yesNo(product.showOnHome),
          product.homeSortOrder,
          product.codes.map((code) => `${code.type}:${code.value}`).join(' | '),
          product.images[0]?.url ?? '',
          product.updatedAt,
        ]),
      );
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');
        return;
      }

      window.alert(getErrorMessage(error, 'ساخت خروجی CSV محصولات با خطا مواجه شد'));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='محصولات'
        description='اطلاعات فنی، قیمت، وضعیت موجودی و نمایش محصولات را مدیریت کنید'
        icon={<PackageSearch className='size-5 lg:size-8' />}
        actions={
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              iconStart={<Download className='size-4' />}
              disabled={isExporting || response.meta.total === 0}
              onClick={() => void exportProductsCsv()}
            >
              {isExporting ? 'در حال ساخت خروجی...' : 'خروجی CSV'}
            </Button>

            <CatalogImportShortcutButton />
          </div>
        }
        addButtonLabel='افزودن محصول'
        onAddClick={() => router.push('/admin/catalog/products/new')}
      />

      {loadError ? (
        <div
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <p className='text-sm font-semibold text-danger'>{loadError}</p>

          <Button
            variant='outline'
            size='sm'
            iconStart={<RefreshCw />}
            onClick={() => void loadProducts()}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      {optionsError ? (
        <div
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <p className='text-sm font-semibold text-warning'>{optionsError}</p>

          <Button
            variant='outline'
            size='sm'
            iconStart={<RefreshCw />}
            onClick={() => void loadFilterOptions()}
          >
            دریافت مجدد فیلترها
          </Button>
        </div>
      ) : null}

      <ProductsFilterBar
        draft={draftFilters}
        brandOptions={brandOptions}
        categoryOptions={categoryOptions}
        loading={isLoading}
        optionsLoading={isOptionsLoading}
        onDraftChange={(patch) => {
          setDraftFilters((current) => ({
            ...current,
            ...patch,
          }));
        }}
        onApply={applyFilters}
        onReset={resetFilters}
        onRefresh={refreshAll}
      />

      <ProductsTable
        products={response.data}
        loading={isLoading}
        page={response.meta.page}
        pageSize={response.meta.limit}
        totalItems={response.meta.total}
        onPageChange={(page) => {
          replaceUrl({
            page: String(page),
          });
        }}
        onEdit={(product) => {
          router.push(`/admin/catalog/products/${product.id}`);
        }}
      />
    </div>
  );
}
