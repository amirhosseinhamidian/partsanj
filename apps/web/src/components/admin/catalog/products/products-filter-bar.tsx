'use client';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarContent,
} from '@/components/ui/filter-bar';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import type { ProductStatus, StockStatus } from '@/lib/admin/catalog/product.types';
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import type { FormEvent } from 'react';

export type ProductFiltersDraft = {
  q: string;
  brandId: string;
  categoryId: string;
  status: '' | ProductStatus;
  stockStatus: '' | StockStatus;
};

type ProductFilterOption = {
  value: string;
  label: string;
  description?: string;
};

type ProductsFilterBarProps = {
  draft: ProductFiltersDraft;

  brandOptions: ProductFilterOption[];
  categoryOptions: ProductFilterOption[];

  loading?: boolean;
  optionsLoading?: boolean;

  onDraftChange: (patch: Partial<ProductFiltersDraft>) => void;

  onApply: (nextDraft?: ProductFiltersDraft) => void;

  onReset: () => void;
  onRefresh: () => void;
};

function getActiveFilterCount(draft: ProductFiltersDraft) {
  return [draft.q.trim(), draft.brandId, draft.categoryId, draft.status, draft.stockStatus].filter(
    Boolean,
  ).length;
}

export function ProductsFilterBar({
  draft,
  brandOptions,
  categoryOptions,
  loading = false,
  optionsLoading = false,
  onDraftChange,
  onApply,
  onReset,
  onRefresh,
}: ProductsFilterBarProps) {
  const isBusy = loading || optionsLoading;

  const activeFilterCount = getActiveFilterCount(draft);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply();
  }

  return (
    <form onSubmit={handleSubmit}>
      <FilterBar
        layout='stacked'
        title='جست‌وجو و فیلتر'
        icon={<SlidersHorizontal />}
        aria-label='جست‌وجو و فیلتر محصولات'
      >
        <FilterBarContent>
          <div className='space-y-2 lg:col-span-4'>
            <p className='text-sm font-bold text-foreground'>جست‌وجو</p>

            <SearchInput
              id='admin-products-search'
              value={draft.q}
              onValueChange={(q) => {
                onDraftChange({ q });
              }}
              onClear={() => {
                onDraftChange({ q: '' });
              }}
              clearable
              searchOnEnter={false}
              placeholder='نام، SKU، Slug یا کد محصول'
            />
          </div>

          <div className='space-y-2 lg:col-span-2'>
            <p className='text-sm font-bold text-foreground'>برند</p>

            <Combobox
              value={draft.brandId}
              onValueChange={(brandId) => {
                onDraftChange({ brandId });
              }}
              options={brandOptions}
              clearable
              loading={optionsLoading}
              placeholder='همه برندها'
              searchPlaceholder='جستجو در برندها'
              emptyMessage='برندی پیدا نشد'
            />
          </div>

          <div className='space-y-2 lg:col-span-2'>
            <p className='text-sm font-bold text-foreground'>دسته‌بندی</p>

            <Combobox
              value={draft.categoryId}
              onValueChange={(categoryId) => {
                onDraftChange({ categoryId });
              }}
              options={categoryOptions}
              clearable
              loading={optionsLoading}
              placeholder='همه دسته‌بندی‌ها'
              searchPlaceholder='جستجو در دسته‌بندی‌ها'
              emptyMessage='دسته‌بندی پیدا نشد'
            />
          </div>

          <div className='space-y-2 lg:col-span-2'>
            <p className='text-sm font-bold text-foreground'>وضعیت محصول</p>

            <Select
              value={draft.status}
              onValueChange={(value) => {
                onDraftChange({
                  status: value as ProductFiltersDraft['status'],
                });
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
          </div>

          <div className='space-y-2 lg:col-span-2'>
            <p className='text-sm font-bold text-foreground'>وضعیت موجودی</p>

            <Select
              value={draft.stockStatus}
              onValueChange={(value) => {
                onDraftChange({
                  stockStatus: value as ProductFiltersDraft['stockStatus'],
                });
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
          </div>
        </FilterBarContent>

        <FilterBarActions position='footer'>
          <FilterBarClearButton
            showWhenEmpty
            activeFilterCount={activeFilterCount}
            disabled={isBusy}
            onClick={onReset}
          />

          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw className='size-4' />}
            disabled={isBusy}
            onClick={onRefresh}
          >
            بروزرسانی
          </Button>

          <Button
            type='submit'
            disabled={isBusy}
            isLoading={loading}
            loadingLabel='در حال دریافت'
            iconStart={<Search className='size-4' />}
          >
            اعمال فیلتر
          </Button>
        </FilterBarActions>
      </FilterBar>
    </form>
  );
}
