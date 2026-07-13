'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  ArrowUpLeft,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  History,
  LayoutDashboard,
  PackageSearch,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Truck,
  UsersRound,
  WalletCards,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/orders/admin-order-badges';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { adminDashboardApi } from '@/lib/api/admin-dashboard-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  AdminDashboardActivity,
  AdminDashboardAlerts,
  AdminDashboardData,
  AdminDashboardInventoryAttentionItem,
  AdminDashboardRange,
} from '@/lib/admin/dashboard/admin-dashboard.types';
import {
  formatDateTime,
  formatOrderNumber,
  formatToman,
  ORDER_STATUS_OPTIONS,
} from '@/lib/admin/orders/admin-order-presentation';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import { DashboardSalesChart } from './dashboard-sales-chart';

const RANGE_OPTIONS: Array<{
  value: AdminDashboardRange;
  label: string;
}> = [
  {
    value: '7d',
    label: '۷ روز',
  },
  {
    value: '30d',
    label: '۳۰ روز',
  },
  {
    value: '90d',
    label: '۹۰ روز',
  },
];

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت اطلاعات داشبورد با خطا مواجه شد';
}

function formatCount(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return 'بدون داده مقایسه‌ای';
  }

  const formatted = new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 1,
  }).format(Math.abs(value));

  if (value > 0) {
    return `${formatted}٪ رشد`;
  }

  if (value < 0) {
    return `${formatted}٪ کاهش`;
  }

  return 'بدون تغییر';
}

export function AdminDashboardPageClient() {
  const [range, setRange] = useState<AdminDashboardRange>('30d');

  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await adminDashboardApi.getDashboard(range);

      setDashboard(response.data);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const summaryCards = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        title: 'فروش امروز',
        value: formatToman(dashboard.summary.todayRevenueToman),
        description: 'مجموع سفارش‌های پرداخت‌شده امروز',
        icon: CircleDollarSign,
      },
      {
        title: 'فروش ماه جاری',
        value: formatToman(dashboard.summary.currentMonthRevenueToman),
        description: 'فروش پرداخت‌شده از ابتدای ماه',
        icon: WalletCards,
      },
      {
        title: 'سفارش‌های امروز',
        value: formatCount(dashboard.summary.todayOrdersCount),
        description: 'تمام سفارش‌های ثبت‌شده امروز',
        icon: ClipboardList,
      },
      {
        title: 'نیازمند رسیدگی',
        value: formatCount(dashboard.summary.actionableOrdersCount),
        description: 'سفارش‌های پرداخت‌شده یا در حال آماده‌سازی',
        icon: ClipboardCheck,
        attention: dashboard.summary.actionableOrdersCount > 0,
      },
      {
        title: 'محصولات فعال',
        value: formatCount(dashboard.summary.activeProductsCount),
        description: 'محصولات فعال و منتشرشده',
        icon: Boxes,
      },
      {
        title: 'مشتریان فعال',
        value: formatCount(dashboard.summary.customersCount),
        description: 'کاربران مشتری فعال فروشگاه',
        icon: UsersRound,
      },
    ];
  }, [dashboard]);

  return (
    <div className='space-y-6'>
      <PageHeader
        icon={<LayoutDashboard className='size-5 lg:size-8' />}
        title='داشبورد مدیریت'
        description='مرور سریع فروش، سفارش‌ها، محصولات و فعالیت‌های اخیر فروشگاه'
        actions={
          <Button
            variant='outline'
            iconStart={<RefreshCw />}
            isLoading={isLoading}
            loadingLabel='در حال بروزرسانی'
            onClick={() => {
              void loadDashboard();
            }}
          >
            بروزرسانی
          </Button>
        }
      />

      {loadError ? (
        <div
          role='alert'
          className='flex flex-col gap-4 rounded-card border border-danger/30 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between'
        >
          <div className='flex items-start gap-3'>
            <XCircle className='mt-0.5 size-5 shrink-0 text-danger' />

            <div>
              <h2 className='font-extrabold text-danger'>دریافت داشبورد ناموفق بود</h2>

              <p className='mt-1 text-sm leading-7 text-danger'>{loadError}</p>
            </div>
          </div>

          <Button
            variant='danger'
            size='sm'
            onClick={() => {
              void loadDashboard();
            }}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      {!dashboard && isLoading ? <DashboardSkeleton /> : null}

      {dashboard ? (
        <>
          <section aria-label='خلاصه عملکرد' className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {summaryCards.map((item) => (
              <SummaryCard key={item.title} {...item} />
            ))}
          </section>

          <div className='grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]'>
            <DashboardSalesCard
              dashboard={dashboard}
              range={range}
              isLoading={isLoading}
              onRangeChange={setRange}
            />

            <OrderStatusBreakdown dashboard={dashboard} />
          </div>

          <DashboardAlertsSection alerts={dashboard.alerts} />

          <InventoryAttentionSection items={dashboard.inventoryAttention} />

          <div className='grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]'>
            <RecentOrdersSection dashboard={dashboard} />

            <RecentActivitiesSection activities={dashboard.recentActivities} />
          </div>

          <QuickActions />

          <p className='text-xs text-foreground-muted'>
            آخرین بروزرسانی: {formatDateTime(dashboard.generatedAt)}
          </p>
        </>
      ) : null}
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  attention?: boolean;
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  attention = false,
}: SummaryCardProps) {
  return (
    <article
      className={cn(
        'group rounded-card border bg-surface p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-panel',
        attention ? 'border-warning/40' : 'border-border',
      )}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='text-sm font-bold text-foreground-secondary'>{title}</p>

          <p className='mt-3 truncate text-2xl font-black text-foreground'>{value}</p>
        </div>

        <span
          className={cn(
            'grid size-12 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105',
            attention ? 'bg-warning-soft text-warning' : 'bg-brand-soft text-brand',
          )}
        >
          <Icon className='size-6' />
        </span>
      </div>

      <p className='mt-4 text-xs leading-6 text-foreground-muted'>{description}</p>
    </article>
  );
}

function DashboardSalesCard({
  dashboard,
  range,
  isLoading,
  onRangeChange,
}: {
  dashboard: AdminDashboardData;
  range: AdminDashboardRange;
  isLoading: boolean;
  onRangeChange: (range: AdminDashboardRange) => void;
}) {
  const revenueChange = dashboard.summary.revenueChangePercent;

  const ordersChange = dashboard.summary.ordersChangePercent;

  return (
    <section className='rounded-card border border-border bg-surface p-5 shadow-panel sm:p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-lg font-extrabold text-foreground'>روند فروش</h2>

          <p className='mt-1 text-sm text-foreground-secondary'>
            فروش و تعداد سفارش‌های پرداخت‌شده در بازه انتخابی
          </p>
        </div>

        <div
          className='inline-flex w-fit rounded-control border border-border bg-surface-muted p-1'
          aria-label='انتخاب بازه داشبورد'
        >
          {RANGE_OPTIONS.map((option) => {
            const active = option.value === range;

            return (
              <button
                key={option.value}
                type='button'
                disabled={isLoading}
                aria-pressed={active}
                onClick={() => {
                  onRangeChange(option.value);
                }}
                className={cn(
                  'h-9 rounded-[calc(var(--radius-control)-4px)] px-3 text-xs font-bold transition',
                  active
                    ? 'bg-surface text-brand shadow-sm'
                    : 'text-foreground-secondary hover:text-foreground',
                  isLoading && 'cursor-wait opacity-60',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className='mt-6 grid gap-3 sm:grid-cols-2'>
        <ChangeMetric
          label='فروش این بازه'
          value={formatToman(dashboard.summary.rangeRevenueToman)}
          change={revenueChange}
        />

        <ChangeMetric
          label='سفارش پرداخت‌شده'
          value={formatCount(dashboard.summary.rangeOrdersCount)}
          change={ordersChange}
        />
      </div>

      <DashboardSalesChart items={dashboard.salesChart} />
    </section>
  );
}

function ChangeMetric({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number | null;
}) {
  const positive = change !== null && change > 0;

  const negative = change !== null && change < 0;

  const ChangeIcon = negative ? TrendingDown : TrendingUp;

  return (
    <div className='rounded-2xl border border-border bg-background/60 p-4'>
      <p className='text-xs font-bold text-foreground-muted'>{label}</p>

      <div className='mt-2 flex flex-wrap items-center gap-3'>
        <strong className='text-lg font-black text-foreground'>{value}</strong>

        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-bold',
            positive && 'text-success',
            negative && 'text-danger',
            !positive && !negative && 'text-foreground-muted',
          )}
        >
          <ChangeIcon className='size-3.5' />
          {formatPercent(change)}
        </span>
      </div>
    </div>
  );
}

function OrderStatusBreakdown({ dashboard }: { dashboard: AdminDashboardData }) {
  const total = dashboard.orderStatusBreakdown.reduce((sum, item) => sum + item.count, 0);

  const statusMap = new Map(
    dashboard.orderStatusBreakdown.map((item) => [item.status, item.count]),
  );

  return (
    <section className='rounded-card border border-border bg-surface p-5 shadow-panel sm:p-6'>
      <h2 className='text-lg font-extrabold text-foreground'>وضعیت سفارش‌ها</h2>

      <p className='mt-1 text-sm text-foreground-secondary'>توزیع کل سفارش‌ها بر اساس وضعیت</p>

      <div className='mt-6 space-y-5'>
        {ORDER_STATUS_OPTIONS.map((option) => {
          const count = statusMap.get(option.value) ?? 0;

          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={option.value}>
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm font-bold text-foreground-secondary'>{option.label}</span>

                <span className='text-sm font-black text-foreground'>{formatCount(count)}</span>
              </div>

              <div className='mt-2 h-2 overflow-hidden rounded-full bg-surface-muted'>
                <div
                  className='h-full rounded-full bg-brand transition-[width]'
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DashboardAlertsSection({ alerts }: { alerts: AdminDashboardAlerts }) {
  const items = [
    {
      title: 'منتظر شروع آماده‌سازی',
      value: alerts.paidOrdersWaitingForProcessing,
      description: 'سفارش‌های پرداخت‌شده‌ای که هنوز پردازش نشده‌اند',
      href: '/admin/orders?status=PAID',
      icon: ClipboardCheck,
      urgent: alerts.paidOrdersWaitingForProcessing > 0,
    },
    {
      title: 'منتظر ارسال',
      value: alerts.processingOrdersWaitingForShipment,
      description: 'سفارش‌های در حال آماده‌سازی که باید ارسال شوند',
      href: '/admin/orders?status=PROCESSING',
      icon: Truck,
      urgent: alerts.processingOrdersWaitingForShipment > 0,
    },
    {
      title: 'رزرو موجودی فعال',
      value: alerts.reservedOrders,
      description: 'سفارش‌های در انتظار پرداخت که موجودی برای آن‌ها رزرو شده است',
      href: '/admin/orders?status=PENDING_PAYMENT',
      icon: ClipboardList,
      urgent: false,
    },
    {
      title: 'پرداخت ناموفق',
      value: alerts.failedPaymentsLast24Hours,
      description: 'تلاش‌های پرداخت ناموفق در ۲۴ ساعت اخیر',
      href: '/admin/orders?paymentStatus=FAILED',
      icon: AlertTriangle,
      urgent: alerts.failedPaymentsLast24Hours > 0,
    },
    {
      title: 'محصول کم‌موجود',
      value: alerts.lowStockProducts,
      description: 'موجودی این محصولات به حد هشدار یا کمتر رسیده است',
      href: '/admin/catalog/products?stockStatus=IN_STOCK',
      icon: AlertTriangle,
      urgent: alerts.lowStockProducts > 0,
    },
    {
      title: 'محصول ناموجود',
      value: alerts.outOfStockProducts,
      description: 'محصولات فعال و منتشرشده با موجودی صفر',
      href: '/admin/catalog/products?stockStatus=OUT_OF_STOCK',
      icon: PackageSearch,
      urgent: alerts.outOfStockProducts > 0,
    },
    {
      title: 'نیازمند استعلام',
      value: alerts.checkAvailabilityProducts,
      description: 'محصولاتی که موجودی آن‌ها باید بررسی شود',
      href: '/admin/catalog/products?stockStatus=CHECK_AVAILABILITY',
      icon: ShoppingBag,
      urgent: false,
    },
    {
      title: 'منتشرنشده',
      value: alerts.unpublishedProducts,
      description: 'محصولات غیرآرشیوی که هنوز منتشر نشده‌اند',
      href: '/admin/catalog/products',
      icon: Boxes,
      urgent: false,
    },
  ];

  return (
    <section>
      <div className='mb-4'>
        <h2 className='text-lg font-extrabold text-foreground'>هشدارهای عملیاتی</h2>

        <p className='mt-1 text-sm text-foreground-secondary'>
          سفارش‌ها و اقلامی که ممکن است نیازمند اقدام مدیر باشند
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                'group flex items-start gap-4 rounded-card border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel',
                item.urgent ? 'border-warning/40' : 'border-border',
              )}
            >
              <span
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-2xl',
                  item.urgent
                    ? 'bg-warning-soft text-warning'
                    : 'bg-surface-muted text-foreground-secondary',
                )}
              >
                <Icon className='size-5' />
              </span>

              <span className='min-w-0 flex-1'>
                <span className='flex items-center justify-between gap-3'>
                  <strong className='text-sm text-foreground'>{item.title}</strong>

                  <span className='text-xl font-black text-foreground'>
                    {formatCount(item.value)}
                  </span>
                </span>

                <span className='mt-2 block text-xs leading-6 text-foreground-muted'>
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function InventoryAttentionSection({ items }: { items: AdminDashboardInventoryAttentionItem[] }) {
  return (
    <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
      <div className='flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='font-extrabold text-foreground'>نیازمند توجه انبار</h2>

          <p className='mt-1 text-xs text-foreground-muted'>
            محصولات ناموجود، کم‌موجود یا نیازمند استعلام
          </p>
        </div>

        <Link
          href='/admin/catalog/products'
          className='inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline'
        >
          مدیریت محصولات
          <ArrowUpLeft className='size-4' />
        </Link>
      </div>

      {items.length > 0 ? (
        <div className='grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4'>
          {items.map((item) => {
            const presentation = getInventoryAttentionPresentation(item);

            return (
              <Link
                key={item.id}
                href={`/admin/catalog/products/${encodeURIComponent(item.id)}`}
                className='group rounded-2xl border border-border bg-background/50 p-4 transition hover:border-brand/30 hover:bg-brand-soft/30'
              >
                <div className='flex items-start justify-between gap-3'>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-extrabold',
                      presentation.badgeClassName,
                    )}
                  >
                    {presentation.label}
                  </span>

                  <ArrowUpLeft className='size-4 shrink-0 text-foreground-muted transition group-hover:text-brand' />
                </div>

                <h3 className='mt-3 line-clamp-2 text-sm leading-6 font-extrabold text-foreground'>
                  {item.name}
                </h3>

                <p dir='ltr' className='mt-1 truncate text-right text-xs text-foreground-muted'>
                  SKU: {item.sku}
                </p>

                <div className='mt-4 border-t border-border pt-3 text-xs text-foreground-secondary'>
                  {item.reason === 'CHECK_AVAILABILITY' ? (
                    <span>موجودی عددی برای فروش قابل اتکا نیست.</span>
                  ) : (
                    <span>
                      موجودی فعلی:{' '}
                      <strong className='text-foreground'>
                        {toPersianDigits(item.stockQuantity)} عدد
                      </strong>
                      {' · '}حد هشدار: {toPersianDigits(item.lowStockThreshold)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptySection
          icon={Boxes}
          title='انبار در وضعیت مناسبی است'
          description='در حال حاضر محصول ناموجود، کم‌موجود یا نیازمند استعلامی وجود ندارد.'
        />
      )}
    </section>
  );
}

function getInventoryAttentionPresentation(item: AdminDashboardInventoryAttentionItem) {
  switch (item.reason) {
    case 'OUT_OF_STOCK':
      return {
        label: 'ناموجود',
        badgeClassName: 'bg-danger-soft text-danger',
      };

    case 'LOW_STOCK':
      return {
        label: 'کم‌موجود',
        badgeClassName: 'bg-warning-soft text-warning',
      };

    case 'CHECK_AVAILABILITY':
      return {
        label: 'نیازمند استعلام',
        badgeClassName: 'bg-brand-soft text-brand',
      };
  }
}

function RecentOrdersSection({ dashboard }: { dashboard: AdminDashboardData }) {
  return (
    <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
      <div className='flex items-center justify-between gap-4 border-b border-border px-5 py-4'>
        <div>
          <h2 className='font-extrabold text-foreground'>سفارش‌های اخیر</h2>

          <p className='mt-1 text-xs text-foreground-muted'>آخرین سفارش‌های ثبت‌شده فروشگاه</p>
        </div>

        <Link
          href='/admin/orders'
          className='inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline'
        >
          مشاهده همه
          <ArrowUpLeft className='size-4' />
        </Link>
      </div>

      {dashboard.recentOrders.length > 0 ? (
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[820px] text-right'>
            <thead className='bg-surface-muted text-xs text-foreground-secondary'>
              <tr>
                <th className='px-5 py-3 font-bold'>سفارش</th>
                <th className='px-5 py-3 font-bold'>مشتری</th>
                <th className='px-5 py-3 font-bold'>مبلغ</th>
                <th className='px-5 py-3 font-bold'>وضعیت</th>
                <th className='px-5 py-3 font-bold'>پرداخت</th>
                <th className='px-5 py-3 font-bold'>تاریخ</th>
              </tr>
            </thead>

            <tbody className='divide-y divide-border'>
              {dashboard.recentOrders.map((order) => (
                <tr key={order.id} className='transition hover:bg-surface-muted/60'>
                  <td className='px-5 py-4'>
                    <Link
                      href={`/admin/orders/${encodeURIComponent(order.id)}`}
                      className='font-extrabold text-brand hover:underline'
                    >
                      {formatOrderNumber(order.orderNumber)}
                    </Link>

                    <span className='mt-1 block text-xs text-foreground-muted'>
                      {toPersianDigits(order.itemsCount)} قلم
                    </span>
                  </td>

                  <td className='px-5 py-4'>
                    <span className='block text-sm font-bold text-foreground'>
                      {order.customer.fullName}
                    </span>

                    <span dir='ltr' className='mt-1 block text-right text-xs text-foreground-muted'>
                      {toPersianDigits(order.customer.mobile)}
                    </span>
                  </td>

                  <td className='px-5 py-4 text-sm font-extrabold text-foreground'>
                    {formatToman(order.payableToman)}
                  </td>

                  <td className='px-5 py-4'>
                    <OrderStatusBadge status={order.status} />
                  </td>

                  <td className='px-5 py-4'>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>

                  <td className='px-5 py-4 text-xs text-foreground-secondary'>
                    {formatDateTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptySection
          icon={ClipboardList}
          title='سفارشی ثبت نشده است'
          description='با ثبت اولین سفارش، اطلاعات آن در این بخش نمایش داده می‌شود.'
        />
      )}
    </section>
  );
}

function RecentActivitiesSection({ activities }: { activities: AdminDashboardActivity[] }) {
  return (
    <section className='rounded-card border border-border bg-surface shadow-panel'>
      <div className='flex items-center justify-between gap-4 border-b border-border px-5 py-4'>
        <div>
          <h2 className='font-extrabold text-foreground'>فعالیت‌های اخیر</h2>

          <p className='mt-1 text-xs text-foreground-muted'>آخرین تغییرات ثبت‌شده توسط مدیران</p>
        </div>

        <Link href='/admin/audit-logs' className='text-brand' aria-label='مشاهده همه گزارش تغییرات'>
          <History className='size-5' />
        </Link>
      </div>

      {activities.length > 0 ? (
        <div className='divide-y divide-border px-5'>
          {activities.map((activity) => (
            <article key={activity.id} className='flex gap-3 py-4'>
              <span className='grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand'>
                <Activity className='size-4' />
              </span>

              <div className='min-w-0'>
                <p className='text-sm leading-7 text-foreground'>
                  <strong>{activity.actor.fullName}</strong>{' '}
                  {getActivityActionLabel(activity.action)}{' '}
                  <span className='font-bold'>
                    {activity.entityLabel || getEntityTypeLabel(activity.entityType)}
                  </span>
                </p>

                <p className='mt-1 text-xs text-foreground-muted'>
                  {formatDateTime(activity.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptySection
          icon={Activity}
          title='فعالیتی ثبت نشده است'
          description='گزارش تغییرات مدیران در این بخش نمایش داده می‌شود.'
        />
      )}
    </section>
  );
}

function getActivityActionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: 'ایجاد کرد:',
    UPDATE: 'ویرایش کرد:',
    DELETE: 'حذف کرد:',
    STATUS_CHANGE: 'وضعیت را تغییر داد:',
    PUBLISH: 'منتشر کرد:',
    UNPUBLISH: 'از انتشار خارج کرد:',
  };

  return labels[action] || 'تغییر داد:';
}

function getEntityTypeLabel(entityType: string) {
  const labels: Record<string, string> = {
    PRODUCT: 'محصول',
    ORDER: 'سفارش',
    USER: 'کاربر',
    BLOG_POST: 'مقاله',
    BLOG_CATEGORY: 'دسته‌بندی بلاگ',
    CATEGORY: 'دسته‌بندی',
    BRAND: 'برند',
    VEHICLE: 'خودرو',
    SETTINGS: 'تنظیمات',
  };

  return labels[entityType] || entityType;
}

function QuickActions() {
  const actions = [
    {
      title: 'مدیریت محصولات',
      href: '/admin/catalog/products',
      icon: Boxes,
    },
    {
      title: 'مدیریت سفارش‌ها',
      href: '/admin/orders',
      icon: ClipboardList,
    },
    {
      title: 'مدیریت مشتریان',
      href: '/admin/users',
      icon: UsersRound,
    },
    {
      title: 'گزارش تغییرات',
      href: '/admin/audit-logs',
      icon: History,
    },
    {
      title: 'مشاهده فروشگاه',
      href: '/',
      icon: ShoppingBag,
      external: true,
    },
  ];

  return (
    <section>
      <h2 className='mb-4 text-lg font-extrabold text-foreground'>دسترسی سریع</h2>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noopener noreferrer' : undefined}
              className='group flex items-center gap-3 rounded-card border border-border bg-surface p-4 text-sm font-bold text-foreground-secondary transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand hover:shadow-sm'
            >
              <span className='grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white'>
                <Icon className='size-5' />
              </span>

              {action.title}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function EmptySection({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className='flex min-h-52 flex-col items-center justify-center px-5 text-center'>
      <Icon className='size-9 text-foreground-muted' />

      <p className='mt-3 font-extrabold text-foreground'>{title}</p>

      <p className='mt-1 max-w-sm text-sm leading-7 text-foreground-secondary'>{description}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({
          length: 6,
        }).map((_item, index) => (
          <div
            key={index}
            className='h-36 animate-pulse rounded-card border border-border bg-surface-muted'
          />
        ))}
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]'>
        <div className='h-96 animate-pulse rounded-card border border-border bg-surface-muted' />
        <div className='h-96 animate-pulse rounded-card border border-border bg-surface-muted' />
      </div>
    </div>
  );
}
