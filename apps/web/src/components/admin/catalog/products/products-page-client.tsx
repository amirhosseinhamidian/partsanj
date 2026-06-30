'use client';

import type {
  AdminProductsListResponse,
  ProductStatus,
  StockStatus,
} from '@/lib/admin/catalog/product.types';
import { adminBrandsApi } from '@/lib/api/admin-brands-client';
import { adminCategoriesApi } from '@/lib/api/admin-categories-client';
import { adminProductsApi } from '@/lib/api/admin-products-client';
import { ClientApiError } from '@/lib/api/web-client';
import { ProductsTable } from '@/components/admin/catalog/products/products-table';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarField,
  FilterBarFilters,
  FilterBarSearch,
} from '@/components/ui/filter-bar';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 24;

const emptyResponse: AdminProductsListResponse = {
  data: [],
  meta: {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  },
};

type ProductStatusFilter = '' | ProductStatus;

type StockStatusFilter = '' | StockStatus;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function ProductsPageClient() {
  const [response, setResponse] = useState<AdminProductsListResponse>(emptyResponse);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [brands, setBrands] = useState<Awaited<ReturnType<typeof adminBrandsApi.list>>>([]);

  const [categories, setCategories] = useState<Awaited<ReturnType<typeof adminCategoriesApi.list>>>(
    [],
  );

  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [status, setStatus] = useState<ProductStatusFilter>('');

  const [stockStatus, setStockStatus] = useState<StockStatusFilter>('');

  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [page, setPage] = useState(1);

  const latestProductsRequestId = useRef(0);

  const loadProducts = useCallback(async () => {
    const requestId = latestProductsRequestId.current + 1;

    latestProductsRequestId.current = requestId;

    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await adminProductsApi.list({
        q: searchQuery.trim() || undefined,
        status: status || undefined,
        stockStatus: stockStatus || undefined,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
        page,
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
  }, [brandId, categoryId, page, searchQuery, status, stockStatus]);

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

  const activeFilterCount = [searchInput.trim(), status, stockStatus, brandId, categoryId].filter(
    Boolean,
  ).length;

  function resetFilters() {
    setSearchInput('');
    setSearchQuery('');
    setStatus('');
    setStockStatus('');
    setBrandId('');
    setCategoryId('');
    setPage(1);
  }

  function refreshAll() {
    void loadProducts();
    void loadFilterOptions();
  }

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-brand'>مدیریت کاتالوگ</p>

          <h1 className='type-page-title mt-1 text-foreground'>محصولات</h1>

          <p className='type-body mt-2 text-foreground-secondary'>
            اطلاعات فنی، قیمت، وضعیت موجودی و نمایش محصولات را مدیریت کنید
          </p>
        </div>

        <Button
          type='button'
          iconStart={<Plus />}
          onClick={() => router.push('/admin/catalog/products/new')}
        >
          افزودن محصول
        </Button>
      </section>

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

      <FilterBar>
        <FilterBarSearch>
          <SearchInput
            value={searchInput}
            onValueChange={setSearchInput}
            onSearch={(value) => {
              setSearchQuery(value.trim());
              setPage(1);
            }}
            placeholder='نام، SKU، Slug یا کد محصول'
          />
        </FilterBarSearch>

        <FilterBarFilters>
          <FilterBarField width='md'>
            <Combobox
              value={brandId}
              onValueChange={(value) => {
                setBrandId(value);
                setPage(1);
              }}
              options={brandOptions}
              clearable
              loading={isOptionsLoading}
              placeholder='همه برندها'
              searchPlaceholder='جستجو در برندها'
              emptyMessage='برندی پیدا نشد'
            />
          </FilterBarField>

          <FilterBarField width='md'>
            <Combobox
              value={categoryId}
              onValueChange={(value) => {
                setCategoryId(value);
                setPage(1);
              }}
              options={categoryOptions}
              clearable
              loading={isOptionsLoading}
              placeholder='همه دسته‌بندی‌ها'
              searchPlaceholder='جستجو در دسته‌بندی‌ها'
              emptyMessage='دسته‌بندی پیدا نشد'
            />
          </FilterBarField>

          <FilterBarField width='md'>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as ProductStatusFilter);
                setPage(1);
              }}
              placeholder='همه وضعیت‌ها'
              options={[
                {
                  value: 'DRAFT',
                  label: 'پیش‌نویس',
                },
                {
                  value: 'ACTIVE',
                  label: 'فعال',
                },
                {
                  value: 'ARCHIVED',
                  label: 'آرشیو',
                },
              ]}
            />
          </FilterBarField>

          <FilterBarField width='md'>
            <Select
              value={stockStatus}
              onValueChange={(value) => {
                setStockStatus(value as StockStatusFilter);
                setPage(1);
              }}
              placeholder='همه وضعیت‌های موجودی'
              options={[
                {
                  value: 'IN_STOCK',
                  label: 'موجود',
                },
                {
                  value: 'OUT_OF_STOCK',
                  label: 'ناموجود',
                },
                {
                  value: 'CHECK_AVAILABILITY',
                  label: 'نیازمند استعلام',
                },
              ]}
            />
          </FilterBarField>
        </FilterBarFilters>

        <FilterBarActions>
          <FilterBarClearButton activeFilterCount={activeFilterCount} onClick={resetFilters} />

          <Button
            type='button'
            variant='outline'
            size='sm'
            iconStart={<RefreshCw />}
            disabled={isLoading || isOptionsLoading}
            onClick={refreshAll}
          >
            بروزرسانی
          </Button>
        </FilterBarActions>
      </FilterBar>

      <ProductsTable
        products={response.data}
        loading={isLoading}
        page={response.meta.page}
        pageSize={response.meta.limit}
        totalItems={response.meta.total}
        onPageChange={setPage}
        onEdit={(product) => {
          router.push(`/admin/catalog/products/${product.id}`);
        }}
      />
    </div>
  );
}
