'use client';

import { Button } from '@/components/ui/button';
import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarContent,
} from '@/components/ui/filter-bar';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import type { StorefrontStockStatus } from '@/lib/storefront/catalog/catalog.types';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { FormEvent } from 'react';

export type StorefrontProductsFilterDraft = {
  q: string;
  brand: string;
  category: string;
  stockStatus: '' | StorefrontStockStatus;
};

type StorefrontProductFilterOption = {
  value: string;
  label: string;
};

type StorefrontProductsFilterBarProps = {
  draft: StorefrontProductsFilterDraft;

  brandOptions: StorefrontProductFilterOption[];
  categoryOptions: StorefrontProductFilterOption[];
  stockStatusOptions: StorefrontProductFilterOption[];

  loading?: boolean;
  optionsLoading?: boolean;
  externalActiveFilterCount?: number;

  onDraftChange: (patch: Partial<StorefrontProductsFilterDraft>) => void;

  onApply: (nextDraft?: StorefrontProductsFilterDraft) => void;

  onReset: () => void;
};

function getActiveFilterCount(
  draft: StorefrontProductsFilterDraft,
  externalActiveFilterCount: number,
) {
  return (
    [draft.q.trim(), draft.brand, draft.category, draft.stockStatus].filter(Boolean).length +
    externalActiveFilterCount
  );
}

export function StorefrontProductsFilterBar({
  draft,
  brandOptions,
  categoryOptions,
  stockStatusOptions,
  loading = false,
  optionsLoading = false,
  externalActiveFilterCount = 0,
  onDraftChange,
  onApply,
  onReset,
}: StorefrontProductsFilterBarProps) {
  const isBusy = loading || optionsLoading;

  const activeFilterCount = getActiveFilterCount(draft, externalActiveFilterCount);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply();
  }

  return (
    <form onSubmit={handleSubmit}>
      <FilterBar
        id='catalog-filters'
        layout='stacked'
        title='جست‌وجو و فیلتر'
        icon={<SlidersHorizontal />}
        aria-label='جست‌وجو و فیلتر محصولات'
      >
        <FilterBarContent>
          <div className='space-y-2 lg:col-span-4'>
            <p className='text-sm font-bold text-foreground'>جست‌وجو</p>

            <SearchInput
              id='storefront-products-search'
              value={draft.q}
              clearable
              searchOnEnter={false}
              placeholder='نام، SKU، Slug یا کد کالا'
              onValueChange={(q) => {
                onDraftChange({ q });
              }}
              onClear={() => {
                onDraftChange({ q: '' });
              }}
            />
          </div>

          <div className='space-y-2 lg:col-span-3'>
            <p className='text-sm font-bold text-foreground'>برند</p>

            <Select
              value={draft.brand}
              disabled={optionsLoading}
              placeholder='همه برندها'
              options={brandOptions}
              onValueChange={(brand) => {
                onDraftChange({ brand });
              }}
            />
          </div>

          <div className='space-y-2 lg:col-span-3'>
            <p className='text-sm font-bold text-foreground'>دسته‌بندی</p>

            <Select
              value={draft.category}
              disabled={optionsLoading}
              placeholder='همه دسته‌بندی‌ها'
              options={categoryOptions}
              onValueChange={(category) => {
                onDraftChange({ category });
              }}
            />
          </div>

          <div className='space-y-2 lg:col-span-2'>
            <p className='text-sm font-bold text-foreground'>وضعیت موجودی</p>

            <Select
              value={draft.stockStatus}
              placeholder='همه وضعیت‌ها'
              options={stockStatusOptions}
              onValueChange={(value) => {
                onDraftChange({
                  stockStatus: value as StorefrontStockStatus,
                });
              }}
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
