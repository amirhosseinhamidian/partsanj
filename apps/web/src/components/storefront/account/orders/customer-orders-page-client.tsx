'use client';

import { CustomerOrderReservationNotice } from '@/components/storefront/account/orders/customer-order-reservation-notice';
import {
  CustomerOrderStatusBadge,
  CustomerPaymentStatusBadge,
} from '@/components/storefront/account/orders/customer-order-status-badges';
import { Button } from '@/components/ui/button';
import { ClientApiError } from '@/lib/api/web-client';
import { storefrontCustomerOrderApi } from '@/lib/api/storefront-customer-order-client';
import {
  formatCustomerOrderNumber,
  formatOrderDate,
  formatToman,
} from '@/lib/storefront/customer/orders/customer-order-presentation';
import type {
  CustomerOrderListItem,
  CustomerOrdersListResponse,
  CustomerOrderStatusCounts,
  CustomerOrderStatusTab,
} from '@/lib/storefront/customer/orders/customer-order.types';
import { ChevronLeft, CircleAlert, ImageOff, PackageOpen, RefreshCw, Truck } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';

const PAGE_SIZE = 10;

const EMPTY_STATUS_COUNTS: CustomerOrderStatusCounts = {
  ALL: 0,
  PENDING_PAYMENT: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  DELIVERED: 0,
  CANCELLED: 0,
};

const ORDER_STATUS_TABS: Array<{
  value: CustomerOrderStatusTab;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}> = [
  {
    value: 'ALL',
    label: 'همه',
    emptyTitle: 'هنوز سفارشی ثبت نکرده‌اید',
    emptyDescription:
      'بعد از ثبت اولین سفارش، وضعیت پرداخت و ارسال آن در این بخش نمایش داده می‌شود',
  },
  {
    value: 'PENDING_PAYMENT',
    label: 'منتظر پرداخت',
    emptyTitle: 'سفارش منتظر پرداختی ندارید',
    emptyDescription: 'سفارش‌هایی که هنوز پرداخت نشده‌اند در این تب نمایش داده می‌شوند',
  },
  {
    value: 'PROCESSING',
    label: 'در حال پردازش',
    emptyTitle: 'سفارشی در حال پردازش نیست',
    emptyDescription: 'سفارش‌های در حال آماده‌سازی در این تب نمایش داده می‌شوند',
  },
  {
    value: 'SHIPPED',
    label: 'ارسال‌شده',
    emptyTitle: 'سفارش ارسال‌شده‌ای ندارید',
    emptyDescription: 'سفارش‌های تحویل‌شده به شرکت حمل‌ونقل در این تب قرار می‌گیرند',
  },
  {
    value: 'DELIVERED',
    label: 'تحویل‌شده',
    emptyTitle: 'سفارش تحویل‌شده‌ای ندارید',
    emptyDescription: 'سفارش‌هایی که به شما تحویل شده‌اند در این تب نمایش داده می‌شوند',
  },
  {
    value: 'CANCELLED',
    label: 'لغوشده',
    emptyTitle: 'سفارش لغوشده‌ای ندارید',
    emptyDescription: 'سفارش‌های لغوشده یا منقضی‌شده در این تب نمایش داده می‌شوند',
  },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت سفارش‌ها با خطا مواجه شد';
}

function ProductPreview({ order }: { order: CustomerOrderListItem }) {
  const visibleItems = order.previewItems.slice(0, 3);
  const hiddenCount = Math.max(order.itemCount - visibleItems.length, 0);

  return (
    <div className='flex items-center gap-3'>
      <div className='flex -space-x-2 space-x-reverse'>
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <div
              key={item.id}
              className='grid size-12 shrink-0 place-items-center overflow-hidden rounded-control border-2 border-surface bg-surface-muted'
              title={item.productName}
            >
              {item.productImageUrl ? (
                <img
                  src={item.productImageUrl}
                  alt={item.productName}
                  className='size-full object-cover'
                />
              ) : (
                <ImageOff className='size-4 text-foreground-muted' />
              )}
            </div>
          ))
        ) : (
          <div className='grid size-12 place-items-center rounded-control border border-border bg-surface-muted'>
            <PackageOpen className='size-5 text-foreground-muted' />
          </div>
        )}

        {hiddenCount > 0 ? (
          <div className='grid size-12 shrink-0 place-items-center rounded-control border-2 border-surface bg-brand text-xs font-extrabold text-white'>
            +{new Intl.NumberFormat('fa-IR').format(hiddenCount)}
          </div>
        ) : null}
      </div>

      <div className='min-w-0'>
        <p className='text-sm font-bold text-foreground'>
          {new Intl.NumberFormat('fa-IR').format(order.itemCount)} قلم کالا
        </p>

        <p className='mt-1 truncate text-xs text-foreground-secondary'>
          {visibleItems.map((item) => item.productName).join('، ') ||
            'اطلاعات کالاها در دسترس نیست'}
        </p>
      </div>
    </div>
  );
}

function CustomerOrdersStatusTabs({
  activeStatus,
  counts,
  disabled,
  onStatusChange,
}: {
  activeStatus: CustomerOrderStatusTab;
  counts: CustomerOrderStatusCounts;
  disabled: boolean;
  onStatusChange: (status: CustomerOrderStatusTab) => void;
}) {
  return (
    <div className='[scrollbar-width:none] overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden'>
      <div
        role='tablist'
        aria-label='فیلتر سفارش‌ها بر اساس وضعیت'
        className='flex min-w-max items-center gap-2 rounded-card border border-border bg-surface p-2'
      >
        {ORDER_STATUS_TABS.map((tab) => {
          const isActive = tab.value === activeStatus;

          return (
            <button
              key={tab.value}
              type='button'
              role='tab'
              aria-selected={isActive}
              disabled={disabled && !isActive}
              onClick={() => onStatusChange(tab.value)}
              className={[
                'inline-flex h-10 items-center gap-2 rounded-control px-4 text-sm font-bold whitespace-nowrap transition-colors',
                'focus:ring-2 focus:ring-brand/30 focus:outline-none disabled:cursor-wait disabled:opacity-60',
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-foreground-secondary hover:bg-brand-soft hover:text-brand',
              ].join(' ')}
            >
              <span>{tab.label}</span>

              <span
                className={[
                  'numeric grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-xs font-extrabold',
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-muted text-foreground-muted',
                ].join(' ')}
              >
                {toPersianDigits(counts[tab.value])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomerOrderCard({
  order,
  onReservationExpired,
}: {
  order: CustomerOrderListItem;
  onReservationExpired: () => void;
}) {
  const shippingSummary = [
    order.shippingCarrier,
    order.trackingCode ? `کد رهگیری: ${order.trackingCode}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className='rounded-card border border-border bg-surface p-5 shadow-panel'>
      <div className='flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-base font-extrabold text-foreground'>
              سفارش {formatCustomerOrderNumber(order.orderNumber)}
            </h2>

            <CustomerOrderStatusBadge status={order.status} />

            <CustomerPaymentStatusBadge status={order.paymentStatus} />
          </div>

          <p className='mt-2 text-sm text-foreground-secondary'>
            ثبت‌شده در {formatOrderDate(order.createdAt)}
          </p>
        </div>

        <div className='text-start sm:text-end'>
          <p className='text-xs text-foreground-muted'>مبلغ قابل پرداخت</p>

          <p className='numeric mt-1 text-lg font-extrabold text-foreground'>
            {formatToman(order.payableToman)}
          </p>
        </div>
      </div>

      <CustomerOrderReservationNotice
        order={order}
        compact
        className='mt-4'
        onExpired={onReservationExpired}
      />

      <div className='py-5'>
        <ProductPreview order={order} />
      </div>

      <div className='flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 items-center gap-2 text-sm text-foreground-secondary'>
          <Truck className='size-4 shrink-0 text-brand' />

          <p className='truncate'>{shippingSummary || 'اطلاعات ارسال هنوز ثبت نشده است'}</p>
        </div>

        <Link
          href={`/account/orders/${order.id}`}
          className='inline-flex shrink-0 items-center justify-center gap-1 rounded-control bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand/90 focus:ring-2 focus:ring-brand/30 focus:outline-none'
        >
          مشاهده جزئیات
          <ChevronLeft className='size-4' />
        </Link>
      </div>
    </article>
  );
}

function OrdersPagination({
  page,
  totalPages,
  total,
  loading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label='صفحه‌بندی سفارش‌ها'
      className='flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between'
    >
      <p className='text-sm text-foreground-secondary'>
        {new Intl.NumberFormat('fa-IR').format(total)} سفارش ثبت شده
      </p>

      <div className='flex items-center justify-end gap-3'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          صفحه قبل
        </Button>

        <span className='numeric text-sm font-bold text-foreground-secondary'>
          {new Intl.NumberFormat('fa-IR').format(page)}
          {' از '}
          {new Intl.NumberFormat('fa-IR').format(totalPages)}
        </span>

        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          صفحه بعد
        </Button>
      </div>
    </nav>
  );
}

function OrdersLoadingState() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className='h-56 animate-pulse rounded-card border border-border bg-surface-muted'
        />
      ))}
    </div>
  );
}

export function CustomerOrdersPageClient() {
  const [result, setResult] = useState<CustomerOrdersListResponse | null>(null);

  const [page, setPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState<CustomerOrderStatusTab>('ALL');
  const [statusCounts, setStatusCounts] = useState<CustomerOrderStatusCounts>(EMPTY_STATUS_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const expirationRefreshTimeoutRef = useRef<number | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await storefrontCustomerOrderApi.list({
        page,
        limit: PAGE_SIZE,
        status: activeStatus,
      });

      setResult(response);
      setStatusCounts(response.statusCounts);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/login');
        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus, page]);

  const handleStatusChange = useCallback(
    (status: CustomerOrderStatusTab) => {
      if (status === activeStatus) {
        return;
      }

      setActiveStatus(status);
      setPage(1);
      setResult(null);
      setLoadError(null);
    },
    [activeStatus],
  );

  const handleReservationExpired = useCallback(() => {
    if (expirationRefreshTimeoutRef.current !== null) {
      return;
    }

    expirationRefreshTimeoutRef.current = window.setTimeout(() => {
      expirationRefreshTimeoutRef.current = null;
      void loadOrders();
    }, 1500);
  }, [loadOrders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    return () => {
      if (expirationRefreshTimeoutRef.current !== null) {
        window.clearTimeout(expirationRefreshTimeoutRef.current);
      }
    };
  }, []);

  const orders = result?.data ?? [];
  const meta = result?.meta;
  const activeTab =
    ORDER_STATUS_TABS.find((tab) => tab.value === activeStatus) ?? ORDER_STATUS_TABS[0];

  return (
    <div className='space-y-6'>
      <section className='border-b border-border pb-6'>
        <p className='text-sm font-semibold text-brand'>حساب کاربری</p>

        <h1 className='type-page-title mt-1 text-foreground'>سفارش‌های من</h1>

        <p className='type-body mt-2 text-foreground-secondary'>
          وضعیت پرداخت، آماده‌سازی، ارسال و تحویل سفارش‌های خود را پیگیری کنید
        </p>
      </section>

      <CustomerOrdersStatusTabs
        activeStatus={activeStatus}
        counts={statusCounts}
        disabled={isLoading}
        onStatusChange={handleStatusChange}
      />

      {loadError ? (
        <section
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between'
        >
          <div className='flex items-start gap-3'>
            <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

            <p className='text-sm leading-7 font-semibold text-danger'>{loadError}</p>
          </div>

          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw className='size-4' />}
            onClick={() => void loadOrders()}
          >
            تلاش مجدد
          </Button>
        </section>
      ) : null}

      {isLoading && !result ? <OrdersLoadingState /> : null}

      {!isLoading && !loadError && orders.length === 0 ? (
        <section className='bg-card mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center'>
          <PackageOpen className='mx-auto size-9 text-foreground-muted' />

          <h2 className='mt-4 font-extrabold text-foreground'>{activeTab.emptyTitle}</h2>

          <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
            {activeTab.emptyDescription}
          </p>

          {activeStatus !== 'ALL' && statusCounts.ALL > 0 ? (
            <Button
              type='button'
              variant='outline'
              className='mt-5'
              onClick={() => handleStatusChange('ALL')}
            >
              مشاهده همه سفارش‌ها
            </Button>
          ) : null}
        </section>
      ) : null}

      {orders.length > 0 ? (
        <>
          <div aria-busy={isLoading} className='space-y-4'>
            {orders.map((order) => (
              <CustomerOrderCard
                key={order.id}
                order={order}
                onReservationExpired={handleReservationExpired}
              />
            ))}
          </div>

          {meta ? (
            <OrdersPagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              loading={isLoading}
              onPageChange={setPage}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
