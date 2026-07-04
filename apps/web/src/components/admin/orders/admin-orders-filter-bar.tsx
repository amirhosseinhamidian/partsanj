'use client';

import { Button } from '@/components/ui/button';
import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarContent,
} from '@/components/ui/filter-bar';
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker';
import { SearchInput } from '@/components/ui/search-input';
import { Select, type SelectOption } from '@/components/ui/select';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '@/lib/admin/orders/admin-order-presentation';
import type {
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from '@/lib/admin/orders/admin-order.types';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, type FormEvent } from 'react';

const ALL_FILTER_VALUE = '__ALL__';

export type OrderFiltersDraft = {
  q: string;
  status: AdminOrderStatus | '';
  paymentStatus: AdminOrderPaymentStatus | '';
  createdFrom: string;
  createdTo: string;
};

type AdminOrdersFilterBarProps = {
  draft: OrderFiltersDraft;
  loading?: boolean;

  onDraftChange: (patch: Partial<OrderFiltersDraft>) => void;

  onApply: () => void;
  onReset: () => void;
};

function parseFilterDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toFilterDateValue(value: Date | null, boundary: 'start' | 'end'): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (boundary === 'start') {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function getActiveFilterCount(draft: OrderFiltersDraft) {
  return [
    draft.q.trim(),
    draft.status,
    draft.paymentStatus,
    draft.createdFrom,
    draft.createdTo,
  ].filter(Boolean).length;
}

export function AdminOrdersFilterBar({
  draft,
  loading = false,
  onDraftChange,
  onApply,
  onReset,
}: AdminOrdersFilterBarProps) {
  const statusOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه وضعیت‌ها',
      },
      ...ORDER_STATUS_OPTIONS,
    ],
    [],
  );

  const paymentStatusOptions = useMemo<SelectOption[]>(
    () => [
      {
        value: ALL_FILTER_VALUE,
        label: 'همه وضعیت‌ها',
      },
      ...PAYMENT_STATUS_OPTIONS,
    ],
    [],
  );

  const activeFilterCount = getActiveFilterCount(draft);

  const createdFromDate = parseFilterDate(draft.createdFrom);

  const createdToDate = parseFilterDate(draft.createdTo);

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
        aria-label='جست‌وجو و فیلتر سفارش‌ها'
      >
        <FilterBarContent>
          <div className='lg:col-span-4'>
            <SearchInput
              id='admin-orders-search'
              label='جست‌وجو'
              value={draft.q}
              loading={loading}
              clearable
              searchOnEnter={false}
              placeholder='شماره سفارش، نام مشتری یا موبایل'
              onValueChange={(q) => {
                onDraftChange({ q });
              }}
              onClear={() => {
                onDraftChange({ q: '' });
              }}
            />
          </div>

          <div className='lg:col-span-2'>
            <Select
              id='admin-orders-status'
              label='وضعیت سفارش'
              value={draft.status || ALL_FILTER_VALUE}
              options={statusOptions}
              onValueChange={(value) => {
                onDraftChange({
                  status: value === ALL_FILTER_VALUE ? '' : (value as AdminOrderStatus),
                });
              }}
            />
          </div>

          <div className='lg:col-span-2'>
            <Select
              id='admin-orders-payment-status'
              label='وضعیت پرداخت'
              value={draft.paymentStatus || ALL_FILTER_VALUE}
              options={paymentStatusOptions}
              onValueChange={(value) => {
                onDraftChange({
                  paymentStatus:
                    value === ALL_FILTER_VALUE ? '' : (value as AdminOrderPaymentStatus),
                });
              }}
            />
          </div>

          <div className='space-y-1.5 lg:col-span-2'>
            <label
              htmlFor='admin-orders-created-from'
              className='block text-sm font-semibold text-foreground'
            >
              از تاریخ
            </label>

            <JalaliDatePicker
              id='admin-orders-created-from'
              value={createdFromDate}
              maxDate={createdToDate ?? undefined}
              clearable
              timeZone='Asia/Tehran'
              placeholder='انتخاب تاریخ'
              onValueChange={(value) => {
                onDraftChange({
                  createdFrom: toFilterDateValue(value, 'start'),
                });
              }}
            />
          </div>

          <div className='space-y-1.5 lg:col-span-2'>
            <label
              htmlFor='admin-orders-created-to'
              className='block text-sm font-semibold text-foreground'
            >
              تا تاریخ
            </label>

            <JalaliDatePicker
              id='admin-orders-created-to'
              value={createdToDate}
              minDate={createdFromDate ?? undefined}
              clearable
              timeZone='Asia/Tehran'
              placeholder='انتخاب تاریخ'
              onValueChange={(value) => {
                onDraftChange({
                  createdTo: toFilterDateValue(value, 'end'),
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
