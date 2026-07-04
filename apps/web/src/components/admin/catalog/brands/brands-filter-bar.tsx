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

const ALL_STATUS_VALUE = '__ALL__';

export type BrandStatusFilter = '' | 'ACTIVE' | 'INACTIVE';

export type BrandFiltersDraft = {
  q: string;
  status: BrandStatusFilter;
};

type BrandsFilterBarProps = {
  draft: BrandFiltersDraft;
  loading?: boolean;

  onDraftChange: (patch: Partial<BrandFiltersDraft>) => void;

  onApply: () => void;
  onReset: () => void;
  onRefresh: () => void;
};

function getActiveFilterCount(draft: BrandFiltersDraft) {
  return [draft.q.trim(), draft.status].filter(Boolean).length;
}

export function BrandsFilterBar({
  draft,
  loading = false,
  onDraftChange,
  onApply,
  onReset,
  onRefresh,
}: BrandsFilterBarProps) {
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
        aria-label='جست‌وجو و فیلتر برندها'
      >
        <FilterBarContent>
          <div className='space-y-2 lg:col-span-6'>
            <p className='text-sm font-bold text-foreground'>جست‌وجو</p>

            <SearchInput
              id='admin-brands-search'
              value={draft.q}
              clearable
              searchOnEnter={false}
              placeholder='نام برند یا Slug را جستجو کنید'
              onValueChange={(q) => {
                onDraftChange({ q });
              }}
              onClear={() => {
                onDraftChange({ q: '' });
              }}
            />
          </div>

          <div className='space-y-2 lg:col-span-3'>
            <p className='text-sm font-bold text-foreground'>وضعیت برند</p>

            <Select
              id='admin-brands-status'
              value={draft.status || ALL_STATUS_VALUE}
              onValueChange={(value) => {
                onDraftChange({
                  status: value === ALL_STATUS_VALUE ? '' : (value as BrandStatusFilter),
                });
              }}
              options={[
                {
                  value: ALL_STATUS_VALUE,
                  label: 'همه وضعیت‌ها',
                },
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

          <Button
            type='submit'
            disabled={loading}
            isLoading={loading}
            loadingLabel='در حال اعمال'
            iconStart={<Search className='size-4' />}
          >
            اعمال فیلتر
          </Button>
        </FilterBarActions>
      </FilterBar>
    </form>
  );
}
