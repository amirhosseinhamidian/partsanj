'use client';

import type {
  AdminBrand,
  CreateBrandPayload,
  UpdateBrandPayload,
} from '@/lib/admin/catalog/brand.types';
import { ClientApiError } from '@/lib/api/web-client';
import { adminBrandsApi } from '@/lib/api/admin-brands-client';
import { BrandFormSheet } from '@/components/admin/catalog/brands/brand-form-sheet';
import { BrandsTable } from '@/components/admin/catalog/brands/brands-table';
import { Button } from '@/components/ui/button';
import type { DataTableSort } from '@/components/ui/data-table';
import { Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BrandsFilterBar,
  type BrandFiltersDraft,
} from '@/components/admin/catalog/brands/brands-filter-bar';

const PAGE_SIZE = 10;

const EMPTY_BRAND_FILTERS: BrandFiltersDraft = {
  q: '',
  status: '',
};
function normalizeSearch(value: string): string {
  return value
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fa-IR');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت اطلاعات برندها با خطا مواجه شد';
}

function compareValues(
  first: string | number | boolean | Date,
  second: string | number | boolean | Date,
): number {
  const firstValue = first instanceof Date ? first.getTime() : first;
  const secondValue = second instanceof Date ? second.getTime() : second;

  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return firstValue - secondValue;
  }

  return String(firstValue).localeCompare(String(secondValue), 'fa-IR', {
    numeric: true,
    sensitivity: 'base',
  });
}

function sortBrands(brands: AdminBrand[], sort: DataTableSort | null): AdminBrand[] {
  if (!sort) {
    return brands;
  }

  const rows = [...brands];

  rows.sort((first, second) => {
    let result = 0;

    switch (sort.key) {
      case 'name':
        result = compareValues(first.name, second.name);
        break;

      case 'products':
        result = compareValues(first._count.products, second._count.products);
        break;

      case 'status':
        result = compareValues(first.isActive, second.isActive);
        break;

      case 'updatedAt':
        result = compareValues(new Date(first.updatedAt), new Date(second.updatedAt));
        break;

      default:
        result = 0;
    }

    return sort.direction === 'asc' ? result : result * -1;
  });

  return rows;
}

export function BrandsPageClient() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [draftFilters, setDraftFilters] = useState<BrandFiltersDraft>(EMPTY_BRAND_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState<BrandFiltersDraft>(EMPTY_BRAND_FILTERS);
  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AdminBrand | null>(null);

  const loadBrands = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await adminBrandsApi.list();
      setBrands(result);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');
        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  const filteredBrands = useMemo(() => {
    const normalizedQuery = normalizeSearch(appliedFilters.q);

    return brands.filter((brand) => {
      const matchesStatus =
        appliedFilters.status === ''
          ? true
          : appliedFilters.status === 'ACTIVE'
            ? brand.isActive
            : !brand.isActive;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = normalizeSearch([brand.name, brand.slug].join(' '));

      return searchableText.includes(normalizedQuery);
    });
  }, [appliedFilters, brands]);

  const sortedBrands = useMemo(() => sortBrands(filteredBrands, sort), [filteredBrands, sort]);

  const totalPages = Math.max(Math.ceil(sortedBrands.length / PAGE_SIZE), 1);

  const currentPage = Math.min(page, totalPages);

  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return sortedBrands.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, sortedBrands]);

  function applyFilters() {
    setAppliedFilters({
      ...draftFilters,
      q: draftFilters.q.trim(),
    });

    setPage(1);
  }

  function resetFilters() {
    setDraftFilters(EMPTY_BRAND_FILTERS);
    setAppliedFilters(EMPTY_BRAND_FILTERS);
    setPage(1);
  }

  function openCreateSheet() {
    setEditingBrand(null);
    setIsFormOpen(true);
  }

  function openEditSheet(brand: AdminBrand) {
    setEditingBrand(brand);
    setIsFormOpen(true);
  }

  function handleFormOpenChange(nextOpen: boolean) {
    setIsFormOpen(nextOpen);

    if (!nextOpen) {
      setEditingBrand(null);
    }
  }

  async function handleSaveBrand(payload: CreateBrandPayload | UpdateBrandPayload) {
    if (editingBrand) {
      await adminBrandsApi.update(editingBrand.id, payload as UpdateBrandPayload);
    } else {
      await adminBrandsApi.create(payload as CreateBrandPayload);
    }

    await loadBrands();
  }

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-brand'>مدیریت کاتالوگ</p>

          <h1 className='type-page-title mt-1 text-foreground'>برندها</h1>

          <p className='type-body mt-2 text-foreground-secondary'>
            برندهای قطعات را برای استفاده در محصولات، فیلترها و صفحات کاتالوگ مدیریت کنید
          </p>
        </div>

        <Button iconStart={<Plus />} onClick={openCreateSheet}>
          افزودن برند
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
            onClick={() => void loadBrands()}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      <BrandsFilterBar
        draft={draftFilters}
        loading={isLoading}
        onDraftChange={(patch) => {
          setDraftFilters((current) => ({
            ...current,
            ...patch,
          }));
        }}
        onApply={applyFilters}
        onReset={resetFilters}
        onRefresh={() => void loadBrands()}
      />

      <BrandsTable
        brands={paginatedBrands}
        loading={isLoading}
        sort={sort}
        onSortChange={(nextSort) => {
          setSort(nextSort);
          setPage(1);
        }}
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={sortedBrands.length}
        onPageChange={setPage}
        onEdit={openEditSheet}
      />

      <BrandFormSheet
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        brand={editingBrand}
        onSubmit={handleSaveBrand}
      />
    </div>
  );
}
