'use client';

import { useToast } from '@/components/providers/toast-provider';

import { AdminInteractionDetailsSheet } from '@/components/admin/interactions/admin-interaction-details-sheet';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarField,
  FilterBarFilters,
  FilterBarSearch,
} from '@/components/ui/filter-bar';

import { IconButton } from '@/components/ui/icon-button';

import { PageHeader } from '@/components/ui/page-header';

import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Tooltip } from '@/components/ui/tooltip';

import type {
  AdminInteraction,
  AdminInteractionStatus,
  AdminInteractionSummaryResponse,
  AdminInteractionType,
  AdminInteractionsResponse,
} from '@/lib/admin/interactions/admin-interaction.types';

import {
  adminInteractionStatusOptions,
  getAdminInteractionSourceLabel,
  getAdminInteractionStatusLabel,
  getAdminInteractionTypeLabel,
} from '@/lib/admin/interactions/admin-interaction.types';

import {
  adminInteractionsApi,
  notifyAdminInteractionsChanged,
} from '@/lib/api/admin-interactions-client';

import { ClientApiError } from '@/lib/api/web-client';

import { toPersianDigits } from '@/lib/utils/digits';

import { Eye, MessageSquareText, RefreshCw, TriangleAlert } from 'lucide-react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PAGE_SIZE = 25;

type TypeTab = 'ALL' | AdminInteractionType;

function getStatusVariant(status: AdminInteractionStatus) {
  switch (status) {
    case 'APPROVED':
      return 'success' as const;

    case 'PENDING':
      return 'warning' as const;

    case 'REJECTED':
    case 'SPAM':
      return 'danger' as const;

    case 'DELETED':
      return 'neutral' as const;
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',

    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getAuthorName(row: AdminInteraction) {
  if (row.authorDisplayName?.trim()) {
    return row.authorDisplayName;
  }

  if (row.authorUser) {
    const fullName = [row.authorUser.firstName, row.authorUser.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || row.authorUser.mobile;
  }

  return row.authorType === 'STAFF' ? 'پارت‌سنج' : 'کاربر';
}

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت تعاملات با خطا مواجه شد';
}

export function AdminInteractionsPageClient() {
  const { toast } = useToast();

  const [type, setType] = useState<TypeTab>('ALL');

  const [status, setStatus] = useState<AdminInteractionStatus>('PENDING');

  const [searchInput, setSearchInput] = useState('');

  const [appliedSearch, setAppliedSearch] = useState('');

  const [page, setPage] = useState(1);

  const [result, setResult] = useState<AdminInteractionsResponse | null>(null);

  const [summary, setSummary] = useState<AdminInteractionSummaryResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedInteraction, setSelectedInteraction] = useState<AdminInteraction | null>(null);

  const [isMutating, setIsMutating] = useState(false);

  const latestRequestId = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = latestRequestId.current + 1;

    latestRequestId.current = requestId;

    setIsLoading(true);
    setLoadError(null);

    try {
      const [interactionsResponse, summaryResponse] = await Promise.all([
        adminInteractionsApi.list({
          ...(type !== 'ALL'
            ? {
                type,
              }
            : {}),

          status,

          ...(appliedSearch.trim()
            ? {
                q: appliedSearch.trim(),
              }
            : {}),

          page,

          limit: PAGE_SIZE,
        }),

        adminInteractionsApi.summary(),
      ]);

      if (requestId !== latestRequestId.current) {
        return;
      }

      setResult(interactionsResponse);

      setSummary(summaryResponse);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');

        return;
      }

      if (requestId !== latestRequestId.current) {
        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [appliedSearch, page, status, type]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const interactions = result?.data ?? [];

  const meta = result?.meta;

  async function moderate(
    interaction: AdminInteraction,

    nextStatus: AdminInteractionStatus,
  ) {
    setIsMutating(true);

    try {
      await adminInteractionsApi.moderate(interaction.type, interaction.id, nextStatus);

      toast({
        position: 'top-left',

        variant: 'success',

        title:
          nextStatus === 'APPROVED'
            ? 'محتوا تأیید شد'
            : nextStatus === 'REJECTED'
              ? 'محتوا رد شد'
              : nextStatus === 'SPAM'
                ? 'به‌عنوان هرزنامه ثبت شد'
                : 'محتوا حذف شد',
      });

      setSelectedInteraction(null);

      notifyAdminInteractionsChanged();

      await loadData();
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });
    } finally {
      setIsMutating(false);
    }
  }

  async function reply(
    interaction: AdminInteraction,

    body: string,
  ) {
    setIsMutating(true);

    try {
      await adminInteractionsApi.reply(interaction.type, interaction.id, body);

      toast({
        position: 'top-left',

        variant: 'success',

        title: 'پاسخ رسمی پارت‌سنج ثبت شد',
      });

      notifyAdminInteractionsChanged();

      await loadData();
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });

      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  const columns = useMemo<DataTableColumn<AdminInteraction>[]>(
    () => [
      {
        key: 'type',

        header: 'نوع محتوا',

        minWidth: '165px',

        cell: (row) => <Badge variant='info'>{getAdminInteractionTypeLabel(row.type)}</Badge>,
      },

      {
        key: 'content',

        header: 'محتوا',

        minWidth: '320px',

        cell: (row) => (
          <div className='min-w-0'>
            {row.rating ? (
              <p className='mb-1 text-xs font-extrabold text-brand'>
                {toPersianDigits(String(row.rating))} ★
              </p>
            ) : null}

            <p className='line-clamp-2 text-sm leading-6 text-foreground-secondary'>
              {row.body || 'فقط امتیاز ثبت شده است'}
            </p>
          </div>
        ),
      },

      {
        key: 'target',

        header: 'محصول / مقاله',

        minWidth: '220px',

        cell: (row) => (
          <div className='min-w-0'>
            <p className='line-clamp-1 font-bold text-foreground'>{row.target.title}</p>

            {row.target.sku ? (
              <p dir='ltr' className='mt-1 truncate text-right text-xs text-foreground-muted'>
                {row.target.sku}
              </p>
            ) : null}
          </div>
        ),
      },

      {
        key: 'author',

        header: 'نویسنده',

        minWidth: '180px',

        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-semibold text-foreground'>{getAuthorName(row)}</p>

            <p className='mt-1 text-xs text-foreground-muted'>
              {getAdminInteractionSourceLabel(row.source)}
            </p>
          </div>
        ),
      },

      {
        key: 'status',

        header: 'وضعیت',

        minWidth: '150px',

        cell: (row) => (
          <Badge variant={getStatusVariant(row.status)} dot>
            {getAdminInteractionStatusLabel(row.status)}
          </Badge>
        ),
      },

      {
        key: 'createdAt',

        header: 'زمان',

        minWidth: '175px',

        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatDateTime(row.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  const activeFilterCount = [type !== 'ALL', status !== 'PENDING', appliedSearch.trim()].filter(
    Boolean,
  ).length;

  function resetFilters() {
    setType('ALL');

    setStatus('PENDING');

    setSearchInput('');

    setAppliedSearch('');

    setPage(1);
  }

  function applySearch(value: string) {
    setSearchInput(value);

    setAppliedSearch(value);

    setPage(1);
  }

  const totalPending = summary?.data.totalPending ?? 0;

  return (
    <>
      <div className='space-y-6'>
        <PageHeader
          title='مدیریت تعاملات'
          description='نظرات، پرسش‌ها و دیدگاه‌های کاربران را بررسی و مدیریت کنید'
          icon={<MessageSquareText className='size-5 lg:size-8' />}
          actions={
            <Button
              type='button'
              variant='outline'
              iconStart={<RefreshCw />}
              disabled={isLoading}
              onClick={() => void loadData()}
            >
              بروزرسانی
            </Button>
          }
        />

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-card border border-warning/20 bg-warning-soft p-4'>
            <p className='text-xs font-bold text-warning'>در انتظار بررسی</p>

            <p className='mt-2 text-2xl font-black text-foreground'>
              {toPersianDigits(String(totalPending))}
            </p>
          </div>

          <div className='rounded-card border border-border bg-surface p-4'>
            <p className='text-xs font-bold text-foreground-muted'>نظر محصول</p>

            <p className='mt-2 text-2xl font-black text-foreground'>
              {toPersianDigits(String(summary?.data.pending.productReviews ?? 0))}
            </p>
          </div>

          <div className='rounded-card border border-border bg-surface p-4'>
            <p className='text-xs font-bold text-foreground-muted'>پرسش محصول</p>

            <p className='mt-2 text-2xl font-black text-foreground'>
              {toPersianDigits(String(summary?.data.pending.productQuestions ?? 0))}
            </p>
          </div>

          <div className='rounded-card border border-border bg-surface p-4'>
            <p className='text-xs font-bold text-foreground-muted'>دیدگاه مقاله</p>

            <p className='mt-2 text-2xl font-black text-foreground'>
              {toPersianDigits(String(summary?.data.pending.blogComments ?? 0))}
            </p>
          </div>
        </div>

        {loadError ? (
          <div
            role='alert'
            className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
          >
            <div className='flex gap-2 text-danger'>
              <TriangleAlert className='mt-0.5 size-5 shrink-0' />

              <p className='text-sm font-semibold'>{loadError}</p>
            </div>

            <Button type='button' size='sm' variant='outline' onClick={() => void loadData()}>
              تلاش مجدد
            </Button>
          </div>
        ) : null}

        <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
          <Tabs
            value={type}
            onValueChange={(value) => {
              setType(value as TypeTab);

              setPage(1);
            }}
          >
            <TabsList className='w-full justify-start'>
              <TabsTrigger value='ALL'>همه</TabsTrigger>

              <TabsTrigger value='product-review'>نظرات محصول</TabsTrigger>

              <TabsTrigger value='product-question'>پرسش محصول</TabsTrigger>

              <TabsTrigger value='blog-comment'>دیدگاه مقاله</TabsTrigger>

              <TabsTrigger value='product-review-reply'>پاسخ نظرات</TabsTrigger>

              <TabsTrigger value='product-question-reply'>پاسخ پرسش‌ها</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='mt-5'>
            <FilterBar>
              <FilterBarSearch>
                <SearchInput
                  value={searchInput}
                  placeholder='جستجو در متن، نویسنده، محصول یا مقاله'
                  onValueChange={(value) => {
                    setSearchInput(value);

                    if (!value.trim()) {
                      setAppliedSearch('');

                      setPage(1);
                    }
                  }}
                  onSearch={applySearch}
                />
              </FilterBarSearch>

              <FilterBarFilters>
                <FilterBarField width='md'>
                  <Select
                    value={status}
                    options={adminInteractionStatusOptions}
                    onValueChange={(value) => {
                      setStatus(value as AdminInteractionStatus);

                      setPage(1);
                    }}
                  />
                </FilterBarField>
              </FilterBarFilters>

              <FilterBarActions>
                <FilterBarClearButton
                  activeFilterCount={activeFilterCount}
                  onClick={resetFilters}
                />
              </FilterBarActions>
            </FilterBar>

            <div className='mt-5'>
              <DataTable
                data={interactions}
                columns={columns}
                getRowId={(row) => `${row.type}:${row.id}`}
                loading={isLoading}
                loadingRows={10}
                tableClassName='min-w-[1240px]'
                emptyTitle='محتوایی پیدا نشد'
                emptyDescription='فیلترها را تغییر دهید یا منتظر تعامل جدید کاربران باشید'
                onRowClick={setSelectedInteraction}
                rowActions={(row) => (
                  <Tooltip content='بررسی محتوا'>
                    <span className='inline-flex'>
                      <IconButton
                        type='button'
                        size='sm'
                        variant='ghost'
                        aria-label='بررسی محتوا'
                        icon={<Eye />}
                        onClick={() => setSelectedInteraction(row)}
                      />
                    </span>
                  </Tooltip>
                )}
                pagination={{
                  page,

                  pageSize: PAGE_SIZE,

                  totalItems: meta?.total ?? 0,

                  onPageChange: setPage,
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <AdminInteractionDetailsSheet
        interaction={selectedInteraction}
        open={Boolean(selectedInteraction)}
        isMutating={isMutating}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedInteraction(null);
          }
        }}
        onModerate={moderate}
        onReply={reply}
      />
    </>
  );
}
