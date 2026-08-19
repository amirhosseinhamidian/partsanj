'use client';

import { AdminContentReportDetailsSheet } from '@/components/admin/interactions/reports/admin-content-report-details-sheet';

import { useToast } from '@/components/providers/toast-provider';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

import {
  FilterBar,
  FilterBarActions,
  FilterBarClearButton,
  FilterBarField,
  FilterBarFilters,
} from '@/components/ui/filter-bar';

import { IconButton } from '@/components/ui/icon-button';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';

import type {
  AdminContentReport,
  AdminContentReportStatus,
  AdminContentReportTargetType,
  AdminContentReportsResponse,
} from '@/lib/admin/interactions/reports/admin-content-report.types';

import {
  adminContentReportStatusOptions,
  adminContentReportTargetTypeOptions,
  getAdminContentReportReasonLabel,
  getAdminContentReportStatusLabel,
  getAdminContentReportTargetTypeLabel,
} from '@/lib/admin/interactions/reports/admin-content-report.types';

import { adminContentReportsApi } from '@/lib/api/admin-content-reports-client';

import { adminInteractionsApi } from '@/lib/api/admin-interactions-client';

import { ClientApiError } from '@/lib/api/web-client';

import { toPersianDigits } from '@/lib/utils/digits';

import { Eye, Flag, RefreshCw, TriangleAlert } from 'lucide-react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const PAGE_SIZE = 25;

type TargetTypeFilter = 'ALL' | AdminContentReportTargetType;

function getStatusVariant(status: AdminContentReportStatus) {
  switch (status) {
    case 'OPEN':
      return 'warning' as const;

    case 'RESOLVED':
      return 'success' as const;

    case 'DISMISSED':
      return 'neutral' as const;
  }
}

function getReporterName(report: AdminContentReport) {
  const fullName = [report.reporter.firstName, report.reporter.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || report.reporter.mobile;
}

function getTargetTitle(report: AdminContentReport) {
  return report.target?.product?.name || report.target?.blogPost?.title || 'محتوای مرتبط';
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

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت گزارش‌های کاربران با خطا مواجه شد';
}

export function AdminContentReportsPageClient() {
  const { toast } = useToast();

  const [status, setStatus] = useState<AdminContentReportStatus>('OPEN');

  const [targetType, setTargetType] = useState<TargetTypeFilter>('ALL');

  const [page, setPage] = useState(1);

  const [result, setResult] = useState<AdminContentReportsResponse | null>(null);

  const [openReportsCount, setOpenReportsCount] = useState(0);

  const [selectedReport, setSelectedReport] = useState<AdminContentReport | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isMutating, setIsMutating] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const latestRequestId = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = latestRequestId.current + 1;

    latestRequestId.current = requestId;

    setIsLoading(true);

    setLoadError(null);

    try {
      const [reportsResponse, summaryResponse] = await Promise.all([
        adminContentReportsApi.list({
          status,

          ...(targetType !== 'ALL'
            ? {
                targetType,
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

      setResult(reportsResponse);

      setOpenReportsCount(summaryResponse.data.openReports);
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
  }, [page, status, targetType]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function updateStatus(
    report: AdminContentReport,

    nextStatus: 'RESOLVED' | 'DISMISSED',
  ) {
    setIsMutating(true);

    try {
      await adminContentReportsApi.updateStatus(report.id, nextStatus);

      toast({
        position: 'top-left',

        variant: 'success',

        title: nextStatus === 'RESOLVED' ? 'گزارش رسیدگی شد' : 'گزارش رد شد',
      });

      setSelectedReport(null);

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

  const reports = result?.data ?? [];

  const meta = result?.meta;

  const columns = useMemo<DataTableColumn<AdminContentReport>[]>(
    () => [
      {
        key: 'reason',

        header: 'دلیل گزارش',

        minWidth: '210px',

        cell: (row) => (
          <Badge variant='danger' startIcon={<Flag />}>
            {getAdminContentReportReasonLabel(row.reason)}
          </Badge>
        ),
      },

      {
        key: 'targetType',

        header: 'نوع محتوا',

        minWidth: '175px',

        cell: (row) => (
          <Badge variant='info'>{getAdminContentReportTargetTypeLabel(row.targetType)}</Badge>
        ),
      },

      {
        key: 'content',

        header: 'محتوای گزارش‌شده',

        minWidth: '320px',

        cell: (row) => (
          <div className='min-w-0'>
            <p className='line-clamp-2 text-sm leading-6 text-foreground-secondary'>
              {row.target?.body || 'متن در دسترس نیست'}
            </p>

            <p className='mt-1 truncate text-xs font-semibold text-foreground-muted'>
              {getTargetTitle(row)}
            </p>
          </div>
        ),
      },

      {
        key: 'reporter',

        header: 'گزارش‌دهنده',

        minWidth: '180px',

        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-semibold text-foreground'>{getReporterName(row)}</p>

            <p dir='ltr' className='mt-1 truncate text-right text-xs text-foreground-muted'>
              {toPersianDigits(row.reporter.mobile)}
            </p>
          </div>
        ),
      },

      {
        key: 'status',

        header: 'وضعیت',

        minWidth: '145px',

        cell: (row) => (
          <Badge variant={getStatusVariant(row.status)} dot>
            {getAdminContentReportStatusLabel(row.status)}
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

  const activeFilterCount = [status !== 'OPEN', targetType !== 'ALL'].filter(Boolean).length;

  function resetFilters() {
    setStatus('OPEN');

    setTargetType('ALL');

    setPage(1);
  }

  return (
    <>
      <div className='space-y-6'>
        <PageHeader
          title='گزارش‌های کاربران'
          description='محتواهای گزارش‌شده را بررسی کنید و نتیجه رسیدگی را ثبت کنید'
          icon={<Flag className='size-5 lg:size-8' />}
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

        <div className='rounded-card border border-warning/20 bg-warning-soft p-4 sm:p-5'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-extrabold text-warning'>گزارش‌های نیازمند رسیدگی</p>

              <p className='mt-1 text-xs text-foreground-muted'>
                گزارش‌هایی که هنوز Resolve یا Dismiss نشده‌اند
              </p>
            </div>

            <span className='text-3xl font-black text-foreground'>
              {toPersianDigits(String(openReportsCount))}
            </span>
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
          <FilterBar>
            <FilterBarFilters>
              <FilterBarField width='md'>
                <Select
                  value={status}
                  options={adminContentReportStatusOptions}
                  onValueChange={(value) => {
                    setStatus(value as AdminContentReportStatus);

                    setPage(1);
                  }}
                />
              </FilterBarField>

              <FilterBarField width='md'>
                <Select
                  value={targetType}
                  options={[
                    {
                      value: 'ALL',
                      label: 'همه محتواها',
                    },

                    ...adminContentReportTargetTypeOptions,
                  ]}
                  onValueChange={(value) => {
                    setTargetType(value as TargetTypeFilter);

                    setPage(1);
                  }}
                />
              </FilterBarField>
            </FilterBarFilters>

            <FilterBarActions>
              <FilterBarClearButton activeFilterCount={activeFilterCount} onClick={resetFilters} />
            </FilterBarActions>
          </FilterBar>

          <div className='mt-5'>
            <DataTable
              data={reports}
              columns={columns}
              getRowId={(row) => row.id}
              loading={isLoading}
              loadingRows={10}
              tableClassName='min-w-[1260px]'
              emptyTitle='گزارشی پیدا نشد'
              emptyDescription='در این وضعیت گزارشی برای بررسی وجود ندارد'
              onRowClick={setSelectedReport}
              rowActions={(row) => (
                <Tooltip content='بررسی گزارش'>
                  <span className='inline-flex'>
                    <IconButton
                      type='button'
                      size='sm'
                      variant='ghost'
                      aria-label='بررسی گزارش'
                      icon={<Eye />}
                      onClick={() => setSelectedReport(row)}
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
        </section>
      </div>

      <AdminContentReportDetailsSheet
        report={selectedReport}
        open={Boolean(selectedReport)}
        isMutating={isMutating}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedReport(null);
          }
        }}
        onUpdateStatus={updateStatus}
      />
    </>
  );
}
