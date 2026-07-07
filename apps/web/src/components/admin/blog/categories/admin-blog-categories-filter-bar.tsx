'use client';

import { Button } from '@/components/ui/button';
import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarContent,
} from '@/components/ui/filter-bar';
import { SearchInput } from '@/components/ui/search-input';
import { Select, type SelectOption } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, type FormEvent } from 'react';

const ALL_FILTER_VALUE = '__ALL__';

export type AdminBlogCategoriesFiltersDraft = {
  q: string;
  isActive: '' | 'true' | 'false';
};

type AdminBlogCategoriesFilterBarProps = {
  draft: AdminBlogCategoriesFiltersDraft;
  loading?: boolean;

  onDraftChange: (patch: Partial<AdminBlogCategoriesFiltersDraft>) => void;

  onApply: () => void;
  onReset: () => void;
};

function getActiveFilterCount(draft: AdminBlogCategoriesFiltersDraft) {
  return [draft.q.trim(), draft.isActive].filter(Boolean).length;
}

export function AdminBlogCategoriesFilterBar({
  draft,
  loading = false,
  onDraftChange,
  onApply,
  onReset,
}: AdminBlogCategoriesFilterBarProps) {
  const statusOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه وضعیت‌ها',
      },
      {
        value: 'true',
        label: 'فعال',
      },
      {
        value: 'false',
        label: 'غیرفعال',
      },
    ],
    [],
  );

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
        aria-label='جست‌وجو و فیلتر دسته‌بندی‌های بلاگ'
      >
        <FilterBarContent>
          <div className='lg:col-span-8'>
            <SearchInput
              id='admin-blog-categories-search'
              label='جست‌وجو'
              value={draft.q}
              loading={loading}
              clearable
              searchOnEnter={false}
              placeholder='نام یا Slug دسته‌بندی'
              onValueChange={(q) => {
                onDraftChange({ q });
              }}
              onClear={() => {
                onDraftChange({ q: '' });
              }}
            />
          </div>

          <div className='lg:col-span-4'>
            <Select
              id='admin-blog-categories-status'
              label='وضعیت دسته‌بندی'
              value={draft.isActive || ALL_FILTER_VALUE}
              options={statusOptions}
              onValueChange={(value) => {
                onDraftChange({
                  isActive: value === ALL_FILTER_VALUE ? '' : (value as 'true' | 'false'),
                });
              }}
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
            type='submit'
            disabled={loading}
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
