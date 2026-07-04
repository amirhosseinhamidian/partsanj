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
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import type { FormEvent } from 'react';

export type CategoryStatusFilter = '' | 'ACTIVE' | 'INACTIVE';

export type CategoryFiltersDraft = {
  q: string;
  status: CategoryStatusFilter;
};

type CategoriesFilterBarProps = {
  draft: CategoryFiltersDraft;
  loading?: boolean;

  onDraftChange: (patch: Partial<CategoryFiltersDraft>) => void;

  onApply: () => void;
  onReset: () => void;
  onRefresh: () => void;
};

function getActiveFilterCount(draft: CategoryFiltersDraft) {
  return [draft.q.trim(), draft.status].filter(Boolean).length;
}

export function CategoriesFilterBar({
  draft,
  loading = false,
  onDraftChange,
  onApply,
  onReset,
  onRefresh,
}: CategoriesFilterBarProps) {
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
        aria-label='جست‌وجو و فیلتر دسته‌بندی‌ها'
      >
        <FilterBarContent>
          <div className='space-y-2 lg:col-span-6'>
            <p className='text-sm font-bold text-foreground'>جست‌وجو</p>

            <SearchInput
              value={draft.q}
              onValueChange={(q) => {
                onDraftChange({ q });
              }}
              placeholder='نام دسته‌بندی یا Slug را جستجو کنید'
            />
          </div>

          <div className='space-y-2 lg:col-span-3'>
            <p className='text-sm font-bold text-foreground'>وضعیت دسته‌بندی</p>

            <Select
              value={draft.status}
              onValueChange={(value) => {
                onDraftChange({
                  status: value as CategoryStatusFilter,
                });
              }}
              placeholder='همه وضعیت‌ها'
              options={[
                {
                  value: 'ACTIVE',
                  label: 'فعال',
                },
                {
                  value: 'INACTIVE',
                  label: 'غیرفعال',
                },
              ]}
            />
          </div>
        </FilterBarContent>

        <FilterBarActions position='footer'>
          <FilterBarClearButton
            showWhenEmpty
            activeFilterCount={activeFilterCount}
            disabled={loading}
            onClick={onReset}
          />

          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw className='size-4' />}
            disabled={loading}
            onClick={onRefresh}
          >
            بروزرسانی
          </Button>

          <Button type='submit' disabled={loading} iconStart={<Search className='size-4' />}>
            اعمال فیلتر
          </Button>
        </FilterBarActions>
      </FilterBar>
    </form>
  );
}
