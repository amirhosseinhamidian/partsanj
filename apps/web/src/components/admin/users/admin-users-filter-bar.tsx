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
import type { AdminUserRole } from '@/lib/admin/users/admin-user.types';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, type FormEvent } from 'react';

const ALL_FILTER_VALUE = '__ALL__';

export type AdminUsersFiltersDraft = {
  q: string;
  role: AdminUserRole | '';
  isActive: '' | 'true' | 'false';
};

type AdminUsersFilterBarProps = {
  draft: AdminUsersFiltersDraft;
  loading?: boolean;

  onDraftChange: (patch: Partial<AdminUsersFiltersDraft>) => void;

  onApply: () => void;
  onReset: () => void;
};

function getActiveFilterCount(draft: AdminUsersFiltersDraft) {
  return [draft.q.trim(), draft.role, draft.isActive].filter(Boolean).length;
}

export function AdminUsersFilterBar({
  draft,
  loading = false,
  onDraftChange,
  onApply,
  onReset,
}: AdminUsersFilterBarProps) {
  const roleOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه نقش‌ها',
      },
      {
        value: 'CUSTOMER',
        label: 'مشتری',
      },
      {
        value: 'SUPPORT',
        label: 'پشتیبان',
      },
      {
        value: 'ADMIN',
        label: 'ادمین',
      },
    ],
    [],
  );

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
        aria-label='جست‌وجو و فیلتر کاربران'
      >
        <FilterBarContent>
          <div className='lg:col-span-6'>
            <SearchInput
              id='admin-users-search'
              label='جست‌وجو'
              value={draft.q}
              loading={loading}
              clearable
              searchOnEnter={false}
              placeholder='نام، نام خانوادگی یا شماره موبایل'
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
              id='admin-users-role'
              label='نقش کاربر'
              value={draft.role || ALL_FILTER_VALUE}
              options={roleOptions}
              onValueChange={(value) => {
                onDraftChange({
                  role: value === ALL_FILTER_VALUE ? '' : (value as AdminUserRole),
                });
              }}
            />
          </div>

          <div className='lg:col-span-3'>
            <Select
              id='admin-users-status'
              label='وضعیت حساب'
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
