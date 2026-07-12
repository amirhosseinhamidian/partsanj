'use client';

import { adminBrandsApi } from '@/lib/api/admin-brands-client';
import { adminCategoriesApi } from '@/lib/api/admin-categories-client';
import { adminProductsApi } from '@/lib/api/admin-products-client';
import { ClientApiError } from '@/lib/api/web-client';
import { ProductsTable } from '@/components/admin/catalog/products/products-table';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PackageSearch, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AdminProductsListResponse } from '@/lib/admin/catalog/product.types';
import {
  ProductsFilterBar,
  type ProductFiltersDraft,
} from '@/components/admin/catalog/products/products-filter-bar';
import { PageHeader } from '@/components/ui/page-header';

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

  const emptyFilters: ProductFiltersDraft = {
    q: '',
    brandId: '',
    categoryId: '',
    status: '',
    stockStatus: '',
  };

  const [draftFilters, setDraftFilters] = useState<ProductFiltersDraft>(emptyFilters);

  const [appliedFilters, setAppliedFilters] = useState<ProductFiltersDraft>(emptyFilters);

  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const latestProductsRequestId = useRef(0);

  const loadProducts = useCallback(async () => {
    const requestId = latestProductsRequestId.current + 1;

    latestProductsRequestId.current = requestId;

    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await adminProductsApi.list({
        q: appliedFilters.q.trim() || undefined,
        status: appliedFilters.status || undefined,
        stockStatus: appliedFilters.stockStatus || undefined,
        brandId: appliedFilters.brandId || undefined,
        categoryId: appliedFilters.categoryId || undefined,
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
  }, [appliedFilters, page]);

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
    setAppliedFilters({
      ...nextDraft,
      q: nextDraft.q.trim(),
    });

    setPage(1);
  }

  function resetFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  function refreshAll() {
    void loadProducts();
    void loadFilterOptions();
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='محصولات'
        description='اطلاعات فنی، قیمت، وضعیت موجودی و نمایش محصولات را مدیریت کنید'
        icon={<PackageSearch className='size-5 lg:size-8' />}
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
        onPageChange={setPage}
        onEdit={(product) => {
          router.push(`/admin/catalog/products/${product.id}`);
        }}
      />
    </div>
  );
}
