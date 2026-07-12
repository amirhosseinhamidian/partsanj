'use client';

import { Button } from '@/components/ui/button';
import { adminOrderApi } from '@/lib/api/admin-order-client';
import { ClientApiError } from '@/lib/api/web-client';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '@/lib/admin/orders/admin-order-presentation';
import type {
  AdminOrderPaymentStatus,
  AdminOrderStatus,
  AdminOrdersListResponse,
  FindAdminOrdersInput,
} from '@/lib/admin/orders/admin-order.types';
import { CircleAlert, ClipboardList, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AdminOrdersTable } from '@/components/admin/orders/admin-orders-table';
import {
  AdminOrdersFilterBar,
  type OrderFiltersDraft,
} from '@/components/admin/orders/admin-orders-filter-bar';
import { PageHeader } from '@/components/ui/page-header';

type UrlPatch = Partial<
  Record<
    'q' | 'status' | 'paymentStatus' | 'createdFrom' | 'createdTo' | 'page' | 'limit',
    string | null
  >
>;

const DEFAULT_LIMIT = 25;

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت فهرست سفارش‌ها با خطا مواجه شد';
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function isOrderStatus(value: string | null): value is AdminOrderStatus {
  return ORDER_STATUS_OPTIONS.some((item) => item.value === value);
}

function isPaymentStatus(value: string | null): value is AdminOrderPaymentStatus {
  return PAYMENT_STATUS_OPTIONS.some((item) => item.value === value);
}

function readFilters(searchParamsString: string): FindAdminOrdersInput {
  const params = new URLSearchParams(searchParamsString);

  const statusValue = params.get('status');
  const paymentStatusValue = params.get('paymentStatus');

  return {
    q: params.get('q')?.trim() || undefined,
    status: isOrderStatus(statusValue) ? statusValue : undefined,
    paymentStatus: isPaymentStatus(paymentStatusValue) ? paymentStatusValue : undefined,
    createdFrom: params.get('createdFrom') || undefined,
    createdTo: params.get('createdTo') || undefined,
    page: parsePositiveInteger(params.get('page'), 1),
    limit: parsePositiveInteger(params.get('limit'), DEFAULT_LIMIT),
  };
}

function toDraft(filters: FindAdminOrdersInput): OrderFiltersDraft {
  return {
    q: filters.q ?? '',
    status: filters.status ?? '',
    paymentStatus: filters.paymentStatus ?? '',
    createdFrom: filters.createdFrom ?? '',
    createdTo: filters.createdTo ?? '',
  };
}

export function AdminOrdersPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsString = searchParams.toString();

  const filters = useMemo(() => readFilters(searchParamsString), [searchParamsString]);

  const [draft, setDraft] = useState<OrderFiltersDraft>(() => toDraft(filters));

  const [result, setResult] = useState<AdminOrdersListResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toDraft(filters));
  }, [filters]);

  const replaceUrl = useCallback(
    (patch: UrlPatch) => {
      const nextParams = new URLSearchParams(searchParamsString);

      for (const [key, value] of Object.entries(patch)) {
        const normalizedValue = value?.trim() ?? '';

        if (
          !normalizedValue ||
          (key === 'page' && normalizedValue === '1') ||
          (key === 'limit' && normalizedValue === String(DEFAULT_LIMIT))
        ) {
          nextParams.delete(key);
          continue;
        }

        nextParams.set(key, normalizedValue);
      }

      const nextQueryString = nextParams.toString();

      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;

      const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

      if (nextUrl === currentUrl) {
        return;
      }

      router.replace(nextUrl, {
        scroll: false,
      });
    },
    [pathname, router, searchParamsString],
  );

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await adminOrderApi.findOrders(filters);

      setResult(response);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function handleApplyFilters() {
    replaceUrl({
      q: draft.q,
      status: draft.status,
      paymentStatus: draft.paymentStatus,
      createdFrom: draft.createdFrom,
      createdTo: draft.createdTo,
      page: '1',
    });
  }

  function handleReset() {
    setDraft({
      q: '',
      status: '',
      paymentStatus: '',
      createdFrom: '',
      createdTo: '',
    });

    router.replace(pathname, {
      scroll: false,
    });
  }

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8'>
      <PageHeader
        title='سفارش‌ها'
        description='وضعیت سفارش، پرداخت، ارسال و پیگیری مشتریان را از این بخش مدیریت کنید'
        icon={<ClipboardList className='size-5 lg:size-8' />}
        actions={
          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw className='size-4' />}
            isLoading={isLoading}
            loadingLabel='در حال به‌روزرسانی'
            onClick={() => void loadOrders()}
          >
            به‌روزرسانی
          </Button>
        }
      />

      <AdminOrdersFilterBar
        draft={draft}
        loading={isLoading}
        onDraftChange={(patch) => {
          setDraft((current) => ({
            ...current,
            ...patch,
          }));
        }}
        onApply={handleApplyFilters}
        onReset={handleReset}
      />

      {loadError ? (
        <section className='rounded-card border border-danger/30 bg-danger-soft p-5'>
          <div className='flex items-start gap-3'>
            <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

            <div className='min-w-0'>
              <h2 className='font-extrabold text-danger'>دریافت سفارش‌ها ناموفق بود</h2>

              <p className='mt-2 text-sm leading-7 text-foreground-secondary'>{loadError}</p>

              <Button
                type='button'
                variant='outline'
                className='mt-4'
                onClick={() => void loadOrders()}
              >
                تلاش مجدد
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <AdminOrdersTable
        orders={result?.data ?? []}
        loading={isLoading}
        page={result?.meta.page ?? filters.page ?? 1}
        pageSize={result?.meta.limit ?? filters.limit ?? DEFAULT_LIMIT}
        totalItems={result?.meta.total ?? 0}
        onPageChange={(nextPage) => {
          replaceUrl({
            page: String(nextPage),
          });
        }}
        onOpenDetails={(order) => {
          router.push(`/admin/orders/${encodeURIComponent(order.id)}`);
        }}
      />
    </div>
  );
}
