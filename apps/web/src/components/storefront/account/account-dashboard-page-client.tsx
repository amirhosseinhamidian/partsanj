'use client';

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
import type { CustomerOrderListItem } from '@/lib/storefront/customer/orders/customer-order.types';
import { storefrontCustomerAddressApi } from '@/lib/api/storefront-customer-address-client';
import type { StorefrontCustomerAddress } from '@/lib/storefront/customer-address/customer-address.types';

// مسیر را با محل واقعی فایل Provider خودت تطبیق بده

import {
  ArrowLeft,
  CircleAlert,
  ClipboardList,
  Home,
  MapPinned,
  Package,
  PackageOpen,
  RefreshCw,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStorefrontCustomerAuth } from '../customer-auth/storefront-customer-auth-provider';
import { toPersianDigits } from '@/lib/utils/digits';

type AccountDashboardData = {
  latestOrder: CustomerOrderListItem | null;
  ordersTotal: number;
  addresses: StorefrontCustomerAddress[];
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت اطلاعات حساب کاربری با خطا مواجه شد';
}

function getDisplayName(firstName: string | null, lastName: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || 'کاربر عزیز';
}

function DashboardCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className='min-w-0 overflow-hidden rounded-card border border-border bg-surface p-5 shadow-panel'>
      <div className='flex items-center gap-2'>
        <span className='text-brand'>{icon}</span>

        <h2 className='font-extrabold text-foreground'>{title}</h2>
      </div>

      <div className='mt-5'>{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <section className='rounded-card border border-border bg-surface p-5 shadow-panel'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold text-foreground-secondary'>{label}</p>

          <p className='numeric mt-3 text-2xl font-extrabold text-foreground'>{value}</p>
        </div>

        <span className='grid size-11 place-items-center rounded-control bg-brand-soft text-brand'>
          {icon}
        </span>
      </div>

      <p className='mt-3 text-xs leading-6 text-foreground-muted'>{description}</p>
    </section>
  );
}

function LatestOrderCard({
  order,
  onViewOrder,
  onViewOrders,
}: {
  order: CustomerOrderListItem | null;
  onViewOrder: (orderId: string) => void;
  onViewOrders: () => void;
}) {
  if (!order) {
    return (
      <DashboardCard title='آخرین سفارش' icon={<PackageOpen className='size-5' />}>
        <div className='bg-card mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center'>
          <ShoppingBag className='mx-auto size-9 text-foreground-muted' />

          <h3 className='mt-3 font-extrabold text-foreground'>هنوز سفارشی ثبت نکرده‌اید</h3>

          <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
            بعد از ثبت اولین سفارش، وضعیت پرداخت و ارسال آن در اینجا قابل پیگیری است
          </p>

          <Button
            className='mt-5'
            iconStart={<ShoppingBag className='size-4' />}
            onClick={onViewOrders}
          >
            مشاهده سفارش‌ها
          </Button>
        </div>
      </DashboardCard>
    );
  }

  const firstProduct = order.previewItems[0];

  return (
    <DashboardCard title='آخرین سفارش' icon={<PackageOpen className='size-5' />}>
      <div className='min-w-0 space-y-5'>
        <div className='grid gap-4 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-lg font-extrabold text-foreground'>
                سفارش {formatCustomerOrderNumber(order.orderNumber)}
              </p>

              <CustomerOrderStatusBadge status={order.status} />

              <CustomerPaymentStatusBadge status={order.paymentStatus} />
            </div>

            <p className='mt-2 text-sm text-foreground-secondary'>
              ثبت‌شده در {formatOrderDate(order.createdAt)}
            </p>
          </div>

          <div className='shrink-0 sm:text-end'>
            <p className='text-xs text-foreground-muted'>مبلغ قابل پرداخت</p>

            <p className='numeric mt-1 text-lg font-extrabold text-foreground'>
              {formatToman(order.payableToman)}
            </p>
          </div>
        </div>

        <div className='flex min-w-0 items-center gap-3'>
          <div className='grid size-14 shrink-0 place-items-center overflow-hidden rounded-control border border-border bg-surface-muted'>
            {firstProduct?.productImageUrl ? (
              <img
                src={firstProduct.productImageUrl}
                alt={firstProduct.productName}
                className='size-full object-cover'
              />
            ) : (
              <Package className='size-5 text-foreground-muted' />
            )}
          </div>

          <div className='min-w-0 flex-1'>
            <p className='leading-7 font-bold break-words text-foreground'>
              {firstProduct?.productName ?? 'اطلاعات اقلام سفارش'}
            </p>

            <p className='mt-1 text-sm text-foreground-secondary'>
              {new Intl.NumberFormat('fa-IR').format(order.itemCount)} قلم کالا
            </p>
          </div>
        </div>

        <Button
          className='w-full sm:w-auto'
          variant='secondary'
          iconStart={<ArrowLeft className='size-4' />}
          onClick={() => onViewOrder(order.id)}
        >
          پیگیری سفارش
        </Button>
      </div>
    </DashboardCard>
  );
}

function DashboardLoadingState() {
  return (
    <div className='space-y-6'>
      <div className='h-36 animate-pulse rounded-card bg-surface-muted' />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='h-40 animate-pulse rounded-card bg-surface-muted' />
        ))}
      </div>

      <div className='h-80 animate-pulse rounded-card bg-surface-muted' />
    </div>
  );
}

export function AccountDashboardPageClient() {
  const router = useRouter();

  const { status, user, openLogin } = useStorefrontCustomerAuth();

  const hasOpenedLoginRef = useRef(false);

  const [dashboard, setDashboard] = useState<AccountDashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'guest' || hasOpenedLoginRef.current) {
      return;
    }

    hasOpenedLoginRef.current = true;

    openLogin({
      returnTo: '/account',
    });
  }, [openLogin, status]);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [ordersResponse, addressesResponse] = await Promise.all([
        storefrontCustomerOrderApi.list({
          page: 1,
          limit: 1,
        }),
        storefrontCustomerAddressApi.list(),
      ]);

      setDashboard({
        latestOrder: ordersResponse.data[0] ?? null,
        ordersTotal: ordersResponse.meta.total,
        addresses: addressesResponse.data,
      });
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        openLogin({
          returnTo: '/account',
        });

        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [openLogin]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void loadDashboard();
  }, [loadDashboard, status]);

  const defaultAddress = useMemo(() => {
    if (!dashboard?.addresses.length) {
      return null;
    }

    return dashboard.addresses.find((address) => address.isDefault) ?? dashboard.addresses[0];
  }, [dashboard?.addresses]);

  if (status === 'loading' || (status === 'authenticated' && isLoading && !dashboard)) {
    return <DashboardLoadingState />;
  }

  if (status === 'guest') {
    return (
      <section className='rounded-card border border-border bg-surface p-8 text-center shadow-panel'>
        <UserRound className='mx-auto size-10 text-brand' />

        <h1 className='mt-4 text-2xl font-extrabold text-foreground'>ورود به حساب کاربری</h1>

        <p className='mx-auto mt-3 max-w-xl text-sm leading-7 text-foreground-secondary'>
          برای مشاهده سفارش‌ها، مدیریت آدرس‌ها و اطلاعات حساب، وارد حساب کاربری خود شوید
        </p>

        <Button
          className='mt-5'
          onClick={() => {
            openLogin({
              returnTo: '/account',
            });
          }}
        >
          ورود یا ثبت‌نام
        </Button>
      </section>
    );
  }

  const displayName = getDisplayName(user?.firstName ?? null, user?.lastName ?? null);

  const addressesCount = dashboard?.addresses.length ?? 0;
  const ordersTotal = dashboard?.ordersTotal ?? 0;

  return (
    <div className='space-y-6'>
      <section className='rounded-card border border-border bg-surface p-6 shadow-panel sm:p-7'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <p className='text-sm font-semibold text-brand'>حساب کاربری</p>

            <h1 className='type-page-title mt-2 text-foreground'>سلام {displayName}</h1>

            <p className='type-body mt-3 text-foreground-secondary'>
              سفارش‌ها، نشانی‌های ارسال و اطلاعات حساب خود را از این بخش مدیریت کنید
            </p>
          </div>
        </div>

        {user?.mobile ? (
          <p
            dir='ltr'
            className='mt-5 w-fit rounded-control border border-border bg-surface-muted px-3 py-2 text-sm font-bold text-foreground-secondary'
          >
            {toPersianDigits(user.mobile)}
          </p>
        ) : null}
      </section>

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
            onClick={() => void loadDashboard()}
          >
            تلاش مجدد
          </Button>
        </section>
      ) : null}

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        <MetricCard
          label='تعداد سفارش‌ها'
          value={new Intl.NumberFormat('fa-IR').format(ordersTotal)}
          description='تمام سفارش‌های ثبت‌شده در حساب شما'
          icon={<ClipboardList className='size-5' />}
        />

        <MetricCard
          label='نشانی‌های ثبت‌شده'
          value={new Intl.NumberFormat('fa-IR').format(addressesCount)}
          description={
            defaultAddress
              ? `نشانی پیش‌فرض: ${defaultAddress.label}`
              : 'هنوز نشانی برای ارسال ثبت نشده است'
          }
          icon={<MapPinned className='size-5' />}
        />

        <MetricCard
          label='وضعیت حساب'
          value='فعال'
          description='شماره موبایل شما با موفقیت تأیید شده است'
          icon={<UserRound className='size-5' />}
        />
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]'>
        <LatestOrderCard
          order={dashboard?.latestOrder ?? null}
          onViewOrder={(orderId) => {
            router.push(`/account/orders/${encodeURIComponent(orderId)}`);
          }}
          onViewOrders={() => {
            router.push('/account/orders');
          }}
        />
      </div>
    </div>
  );
}
