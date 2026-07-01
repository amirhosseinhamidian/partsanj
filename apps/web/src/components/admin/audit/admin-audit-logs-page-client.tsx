'use client';

import type {
  AdminAuditAction,
  AdminAuditEntityType,
  AdminAuditLog,
  AdminAuditLogsResponse,
} from '@/lib/admin/audit/audit-log.types';
import {
  adminAuditActionOptions,
  adminAuditEntityTypeOptions,
  getAdminAuditActionLabel,
  getAdminAuditEntityTypeLabel,
} from '@/lib/admin/audit/audit-log.types';
import { adminAuditLogsApi } from '@/lib/api/admin-audit-logs-client';
import { ClientApiError } from '@/lib/api/web-client';
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
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { Eye, History, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminAuditLogDetailsSheet } from './admin-audit-log-details-sheet';
import { toPersianDigits } from '@/lib/utils/digits';

const PAGE_SIZE = 25;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatDateTime(value: string): string {
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

function getActorName(auditLog: AdminAuditLog): string {
  const fullName = [auditLog.actorUser.firstName, auditLog.actorUser.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || auditLog.actorUser.mobile;
}

function getActionVariant(action: AdminAuditAction) {
  if (action === 'CREATED') {
    return 'success' as const;
  }

  if (action === 'UPDATED') {
    return 'brand' as const;
  }

  if (action === 'COMPATIBILITIES_UPDATED') {
    return 'info' as const;
  }

  return 'neutral' as const;
}

function getAuditSummary(changes: unknown): string {
  if (!isRecord(changes)) {
    return 'جزئیات تغییر ثبت شده است';
  }

  const event = changes.event;

  if (event === 'admin_product_created') {
    return 'محصول جدید ایجاد شد';
  }

  if (event === 'admin_product_updated') {
    return 'اطلاعات محصول ویرایش شد';
  }

  if (event === 'admin_product_archived') {
    return 'محصول آرشیو شد';
  }

  if (event === 'admin_product_compatibilities_replaced') {
    return 'سازگاری خودروهای محصول تغییر کرد';
  }

  if (typeof event === 'string') {
    return event.replace(/^admin_/, '').replaceAll('_', ' ');
  }

  return 'جزئیات تغییر ثبت شده است';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت گزارش تغییرات با خطا مواجه شد';
}

export function AdminAuditLogsPageClient() {
  const [entityType, setEntityType] = useState<AdminAuditEntityType | ''>('');
  const [action, setAction] = useState<AdminAuditAction | ''>('');

  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [page, setPage] = useState(1);

  const [result, setResult] = useState<AdminAuditLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedAuditLog, setSelectedAuditLog] = useState<AdminAuditLog | null>(null);

  const latestRequestId = useRef(0);

  const loadAuditLogs = useCallback(async () => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await adminAuditLogsApi.list({
        page,
        pageSize: PAGE_SIZE,
        ...(entityType
          ? {
              entityType,
            }
          : {}),
        ...(action
          ? {
              action,
            }
          : {}),
        ...(appliedSearch.trim()
          ? {
              search: appliedSearch.trim(),
            }
          : {}),
      });

      if (requestId !== latestRequestId.current) {
        return;
      }

      setResult(response);
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
  }, [action, appliedSearch, entityType, page]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const auditLogs = result?.data ?? [];
  const meta = result?.meta;

  const columns = useMemo<DataTableColumn<AdminAuditLog>[]>(
    () => [
      {
        key: 'action',
        header: 'عملیات',
        minWidth: '150px',
        cell: (row) => (
          <Badge variant={getActionVariant(row.action)} dot>
            {getAdminAuditActionLabel(row.action)}
          </Badge>
        ),
      },
      {
        key: 'entity',
        header: 'موجودیت',
        minWidth: '260px',
        cell: (row) => (
          <div className='min-w-0'>
            <p className='font-bold text-foreground'>{row.entityLabel ?? row.entityId}</p>

            <p className='mt-1 text-xs text-foreground-muted'>
              {getAdminAuditEntityTypeLabel(row.entityType)}
            </p>
          </div>
        ),
      },
      {
        key: 'summary',
        header: 'شرح تغییر',
        minWidth: '280px',
        cell: (row) => (
          <p className='line-clamp-2 text-sm leading-6 text-foreground-secondary'>
            {getAuditSummary(row.changes)}
          </p>
        ),
      },
      {
        key: 'actor',
        header: 'انجام‌دهنده',
        minWidth: '180px',
        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-semibold text-foreground-secondary'>{getActorName(row)}</p>

            <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
              {toPersianDigits(row.actorUser.mobile)}
            </p>
          </div>
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

  const activeFilterCount = [entityType, action, appliedSearch.trim()].filter(Boolean).length;

  function resetFilters() {
    setEntityType('');
    setAction('');
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearchInput(value);
    setAppliedSearch(value);
    setPage(1);
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value);

    if (!value.trim()) {
      setAppliedSearch('');
      setPage(1);
    }
  }

  return (
    <>
      <div className='space-y-6'>
        <section className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <p className='text-sm font-semibold text-brand'>نظارت مدیریتی</p>

            <h1 className='type-page-title mt-1 text-foreground'>گزارش تغییرات</h1>

            <p className='type-body mt-2 text-foreground-secondary'>
              تاریخچه تغییرات محصولات، برندها، دسته‌بندی‌ها و اطلاعات خودرو را بررسی کنید
            </p>
          </div>

          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw />}
            disabled={isLoading}
            onClick={() => void loadAuditLogs()}
          >
            بروزرسانی
          </Button>
        </section>

        {loadError ? (
          <div
            role='alert'
            className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
          >
            <div className='flex gap-2 text-danger'>
              <TriangleAlert className='mt-0.5 size-5 shrink-0' />
              <p className='text-sm font-semibold'>{loadError}</p>
            </div>

            <Button
              type='button'
              size='sm'
              variant='outline'
              iconStart={<RefreshCw />}
              onClick={() => void loadAuditLogs()}
            >
              تلاش مجدد
            </Button>
          </div>
        ) : null}

        <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
          <div className='flex gap-3 border-b border-border pb-5'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <History className='size-5' />
            </span>

            <div>
              <h2 className='type-section-title text-foreground'>تاریخچه عملیات مدیریتی</h2>

              <p className='mt-1 text-sm leading-6 text-foreground-muted'>
                برای مشاهده before / after هر تغییر، روی ردیف مربوطه کلیک کنید
              </p>
            </div>
          </div>

          <div className='pt-5'>
            <FilterBar>
              <FilterBarSearch>
                <SearchInput
                  value={searchInput}
                  onValueChange={handleSearchInputChange}
                  onSearch={handleSearch}
                  placeholder='جستجو در نام محصول، برند، دسته‌بندی یا خودرو'
                />
              </FilterBarSearch>

              <FilterBarFilters>
                <FilterBarField width='md'>
                  <Select
                    value={entityType}
                    onValueChange={(value) => {
                      setEntityType(value as AdminAuditEntityType | '');
                      setPage(1);
                    }}
                    options={[
                      {
                        value: '',
                        label: 'همه موجودیت‌ها',
                      },
                      ...adminAuditEntityTypeOptions,
                    ]}
                  />
                </FilterBarField>

                <FilterBarField width='md'>
                  <Select
                    value={action}
                    onValueChange={(value) => {
                      setAction(value as AdminAuditAction | '');
                      setPage(1);
                    }}
                    options={[
                      {
                        value: '',
                        label: 'همه عملیات‌ها',
                      },
                      ...adminAuditActionOptions,
                    ]}
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
                data={auditLogs}
                columns={columns}
                getRowId={(row) => row.id}
                loading={isLoading}
                loadingRows={10}
                tableClassName='min-w-[1180px]'
                emptyTitle='گزارش تغییری پیدا نشد'
                emptyDescription='فیلترها را تغییر دهید یا ابتدا یک عملیات مدیریتی انجام دهید'
                onRowClick={setSelectedAuditLog}
                rowActions={(row) => (
                  <Tooltip content='مشاهده جزئیات تغییر'>
                    <span className='inline-flex'>
                      <IconButton
                        type='button'
                        aria-label={`مشاهده جزئیات ${row.entityLabel ?? row.entityId}`}
                        icon={<Eye />}
                        variant='ghost'
                        size='sm'
                        onClick={() => setSelectedAuditLog(row)}
                      />
                    </span>
                  </Tooltip>
                )}
                pagination={{
                  page,
                  pageSize: PAGE_SIZE,
                  totalItems: meta?.totalItems ?? 0,
                  onPageChange: setPage,
                }}
              />
            </div>
          </div>
        </section>
      </div>

      <AdminAuditLogDetailsSheet
        auditLog={selectedAuditLog}
        open={Boolean(selectedAuditLog)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedAuditLog(null);
          }
        }}
      />
    </>
  );
}
