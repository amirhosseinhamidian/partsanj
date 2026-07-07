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
import { BLOG_POST_STATUS_OPTIONS } from '@/lib/admin/blog/posts/admin-blog-post-presentation';
import type { AdminBlogPostStatus } from '@/lib/admin/blog/posts/admin-blog-post.types';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, type FormEvent } from 'react';

const ALL_FILTER_VALUE = '__ALL__';

export type AdminBlogPostsFiltersDraft = {
  q: string;
  status: AdminBlogPostStatus | '';
  categoryId: string;
};

type AdminBlogPostsFilterBarProps = {
  draft: AdminBlogPostsFiltersDraft;
  categoryOptions: SelectOption[];
  loading?: boolean;
  categoriesLoading?: boolean;

  onDraftChange: (patch: Partial<AdminBlogPostsFiltersDraft>) => void;

  onApply: () => void;
  onReset: () => void;
};

function getActiveFilterCount(draft: AdminBlogPostsFiltersDraft) {
  return [draft.q.trim(), draft.status, draft.categoryId].filter(Boolean).length;
}

export function AdminBlogPostsFilterBar({
  draft,
  categoryOptions,
  loading = false,
  categoriesLoading = false,
  onDraftChange,
  onApply,
  onReset,
}: AdminBlogPostsFilterBarProps) {
  const statusOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه وضعیت‌ها',
      },
      ...BLOG_POST_STATUS_OPTIONS,
    ],
    [],
  );

  const categorySelectOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه دسته‌بندی‌ها',
      },
      ...categoryOptions,
    ],
    [categoryOptions],
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
        aria-label='جست‌وجو و فیلتر مقالات بلاگ'
      >
        <FilterBarContent>
          <div className='lg:col-span-5'>
            <SearchInput
              id='admin-blog-posts-search'
              label='جست‌وجو'
              value={draft.q}
              loading={loading}
              clearable
              searchOnEnter={false}
              placeholder='عنوان، Slug یا خلاصه مقاله'
              onValueChange={(q) => {
                onDraftChange({ q });
              }}
              onClear={() => {
                onDraftChange({ q: '' });
              }}
            />
          </div>

          <div className='lg:col-span-3'>
            <Select
              id='admin-blog-posts-status'
              label='وضعیت مقاله'
              value={draft.status || ALL_FILTER_VALUE}
              options={statusOptions}
              disabled={loading}
              onValueChange={(value) => {
                onDraftChange({
                  status: value === ALL_FILTER_VALUE ? '' : (value as AdminBlogPostStatus),
                });
              }}
            />
          </div>

          <div className='lg:col-span-4'>
            <Select
              id='admin-blog-posts-category'
              label='دسته‌بندی'
              value={draft.categoryId || ALL_FILTER_VALUE}
              options={categorySelectOptions}
              disabled={loading || categoriesLoading}
              onValueChange={(value) => {
                onDraftChange({
                  categoryId: value === ALL_FILTER_VALUE ? '' : value,
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
