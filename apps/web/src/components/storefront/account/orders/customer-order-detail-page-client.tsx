'use client';

import { CustomerOrderReservationNotice } from '@/components/storefront/account/orders/customer-order-reservation-notice';
import {
  CustomerOrderStatusBadge,
  CustomerPaymentStatusBadge,
} from '@/components/storefront/account/orders/customer-order-status-badges';
import { CustomerOrderTimeline } from '@/components/storefront/account/orders/customer-order-timeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientApiError } from '@/lib/api/web-client';
import { storefrontCustomerOrderApi } from '@/lib/api/storefront-customer-order-client';
import {
  formatCustomerOrderNumber,
  formatOrderDateTime,
  formatToman,
  getFitmentStatusLabel,
  getPaymentMethodLabel,
} from '@/lib/storefront/customer/orders/customer-order-presentation';
import type {
  CustomerOrderDetail,
  CustomerOrderItem,
} from '@/lib/storefront/customer/orders/customer-order.types';
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  ImageOff,
  MapPin,
  PackageOpen,
  RefreshCw,
  Truck,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';
import Image from 'next/image';
import { storefrontPaymentApi } from '@/lib/api/storefront-payment-client';

type CustomerOrderDetailPageClientProps = {
  orderId: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    if (error.status === 404) {
      return 'سفارش موردنظر پیدا نشد';
    }

    if (error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت اطلاعات سفارش با خطا مواجه شد';
}

function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className='rounded-card border border-border bg-surface shadow-panel'>
      <header className='flex items-center gap-2 border-b border-border px-5 py-4'>
        <span className='text-brand'>{icon}</span>

        <h2 className='font-extrabold text-foreground'>{title}</h2>
      </header>

      <div className='p-5'>{children}</div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: ReactNode;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className='flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5'>
      <span className='shrink-0 text-sm text-foreground-muted'>{label}</span>

      <span
        dir={dir}
        className='min-w-0 text-sm leading-6 font-semibold break-words text-foreground-secondary sm:text-end'
      >
        {value || '—'}
      </span>
    </div>
  );
}

function CustomerFitmentBadge({ status }: { status: CustomerOrderItem['fitmentStatus'] }) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge size='sm' variant='success'>
          {getFitmentStatusLabel(status)}
        </Badge>
      );

    case 'REQUIRES_VERIFICATION':
      return (
        <Badge size='sm' variant='warning'>
          {getFitmentStatusLabel(status)}
        </Badge>
      );

    case 'NOT_CONFIRMED':
      return (
        <Badge size='sm' variant='danger'>
          {getFitmentStatusLabel(status)}
        </Badge>
      );

    default:
      return (
        <Badge size='sm' variant='neutral'>
          {getFitmentStatusLabel(status)}
        </Badge>
      );
  }
}

function CustomerOrderItemCard({ item }: { item: CustomerOrderItem }) {
  const vehicleLabel = item.vehicle
    ? [item.vehicle.makeName, item.vehicle.modelName, item.vehicle.variantName].join(' · ')
    : 'برای این کالا خودرو انتخاب نشده است';

  const productHref = `/products/${encodeURIComponent(item.productSlug)}`;

  return (
    <article className='rounded-card border border-border bg-surface p-4'>
      <div className='flex gap-4'>
        <Link
          href={productHref}
          aria-label={`مشاهده محصول ${item.productName}`}
          className='grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-control border border-border bg-surface-muted transition hover:border-brand/50'
        >
          {item.productImageUrl ? (
            <Image
              src={item.productImageUrl}
              alt={item.productName}
              width={80}
              height={80}
              sizes='80px'
              className='size-full object-cover transition-transform duration-300 hover:scale-105'
            />
          ) : (
            <ImageOff className='size-6 text-foreground-muted' />
          )}
        </Link>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <h3 className='truncate font-extrabold'>
                <Link
                  href={productHref}
                  className='cursor-pointer text-foreground transition-colors hover:text-brand'
                >
                  {item.productName}
                </Link>
              </h3>

              <p className='mt-1 text-sm text-foreground-secondary'>{item.brandName}</p>
            </div>

            <p className='numeric shrink-0 text-sm font-extrabold text-foreground'>
              {formatToman(item.linePayableToman)}
            </p>
          </div>

          <div className='mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-start'>
            <div>
              <p className='text-xs text-foreground-muted'>تعداد</p>

              <p className='mt-1 font-bold text-foreground-secondary'>
                {new Intl.NumberFormat('fa-IR').format(item.quantity)} عدد
              </p>
            </div>

            <div className='sm:ms-auto sm:text-left'>
              <p className='text-xs text-foreground-muted'>قیمت واحد</p>

              <p className='numeric mt-1 font-bold text-foreground-secondary'>
                {formatToman(item.unitEffectivePriceToman)}
              </p>
            </div>
          </div>

          {item.lineDiscountToman > 0 ? (
            <p className='mt-3 text-xs font-semibold text-success'>
              {formatToman(item.lineDiscountToman)} تخفیف روی این کالا اعمال شده است
            </p>
          ) : null}

          <div className='mt-4 rounded-control border border-border bg-surface-muted p-3'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <p className='text-xs font-bold text-foreground-secondary'>خودرو و سازگاری</p>

              <CustomerFitmentBadge status={item.fitmentStatus} />
            </div>

            <p className='mt-2 text-sm leading-6 text-foreground-secondary'>{vehicleLabel}</p>

            {item.fitmentNotes ? (
              <p className='mt-2 text-xs leading-6 text-foreground-muted'>{item.fitmentNotes}</p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function createShippingAddress(order: CustomerOrderDetail) {
  return [
    order.shippingProvince,
    order.shippingCity,
    order.shippingDistrict,
    order.shippingAddressLine,
    order.shippingPlaque ? `پلاک ${order.shippingPlaque}` : null,
    order.shippingFloor ? `طبقه ${order.shippingFloor}` : null,
    order.shippingUnit ? `واحد ${order.shippingUnit}` : null,
  ]
    .filter(Boolean)
    .join('، ');
}

function OrderDetailsLoadingState() {
  return (
    <div className='space-y-6'>
      <div className='h-32 animate-pulse rounded-card bg-surface-muted' />

      <div className='grid gap-6 xl:grid-cols-2'>
        <div className='h-80 animate-pulse rounded-card bg-surface-muted' />
        <div className='h-80 animate-pulse rounded-card bg-surface-muted' />
      </div>

      <div className='h-96 animate-pulse rounded-card bg-surface-muted' />
    </div>
  );
}

function getTrustedPaymentRedirectUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error('آدرس درگاه پرداخت معتبر نیست');
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'gateway.zibal.ir' ||
    !url.pathname.startsWith('/start/')
  ) {
    throw new Error('آدرس درگاه پرداخت قابل اعتماد نیست');
  }

  return url.toString();
}

export function CustomerOrderDetailPageClient({ orderId }: CustomerOrderDetailPageClientProps) {
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await storefrontCustomerOrderApi.findById(orderId);

      setOrder(response.data);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/login');
        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const handleReservationExpired = useCallback(() => {
    window.setTimeout(() => {
      void loadOrder();
    }, 1500);
  }, [loadOrder]);

  const handleStartPayment = useCallback(async () => {
    if (!order || order.status !== 'PENDING_PAYMENT') {
      return;
    }

    setPaymentError(null);
    setIsStartingPayment(true);

    try {
      const response = await storefrontPaymentApi.startOrderPayment(order.id);

      const redirectUrl = getTrustedPaymentRedirectUrl(response.data.redirectUrl);

      window.location.assign(redirectUrl);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/login');

        return;
      }

      setPaymentError(getErrorMessage(error));

      /*
       * ممکن است سفارش هنگام درخواست منقضی شده باشد.
       */
      void loadOrder();
    } finally {
      setIsStartingPayment(false);
    }
  }, [loadOrder, order]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  if (isLoading && !order) {
    return <OrderDetailsLoadingState />;
  }

  if (!order) {
    return (
      <section role='alert' className='rounded-card border border-danger/30 bg-danger-soft p-6'>
        <div className='flex items-start gap-3'>
          <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

          <div>
            <h1 className='font-extrabold text-danger'>دریافت سفارش ناموفق بود</h1>

            <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
              {loadError ?? 'اطلاعات سفارش در دسترس نیست'}
            </p>

            <div className='mt-5 flex flex-wrap gap-3'>
              <Button type='button' variant='outline' onClick={() => void loadOrder()}>
                تلاش مجدد
              </Button>

              <Link
                href='/account/orders'
                className='inline-flex items-center justify-center rounded-control px-4 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand-soft'
              >
                بازگشت به سفارش‌ها
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const orderNumber = formatCustomerOrderNumber(order.orderNumber);
  const canStartPayment = order.status === 'PENDING_PAYMENT' && order.paymentStatus !== 'PAID';

  return (
    <div className='space-y-6'>
      <header className='flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <Link href='/account/orders'>
            <Button variant='secondary' iconStart={<ArrowRight className='size-4' />}>
              بازگشت به سفارش‌های من
            </Button>
          </Link>

          <div className='mt-4 flex flex-wrap items-center gap-2'>
            <h1 className='type-page-title text-foreground'>سفارش {orderNumber}</h1>

            <CustomerOrderStatusBadge status={order.status} />

            <CustomerPaymentStatusBadge status={order.paymentStatus} />
          </div>

          <p className='type-body mt-2 text-foreground-secondary'>
            ثبت‌شده در {formatOrderDateTime(order.createdAt)}
          </p>
        </div>

        <Button
          type='button'
          variant='outline'
          disabled={isLoading}
          isLoading={isLoading}
          loadingLabel='در حال دریافت'
          iconStart={<RefreshCw className='size-4' />}
          onClick={() => void loadOrder()}
        >
          به‌روزرسانی
        </Button>
      </header>

      {loadError ? (
        <section
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <p className='text-sm font-semibold text-danger'>{loadError}</p>

          <Button type='button' size='sm' variant='outline' onClick={() => setLoadError(null)}>
            بستن پیام
          </Button>
        </section>
      ) : null}

      <CustomerOrderReservationNotice order={order} onExpired={handleReservationExpired} />

      <div className='grid gap-6 xl:grid-cols-2'>
        <DetailCard title='وضعیت سفارش' icon={<ClipboardList className='size-5' />}>
          <CustomerOrderTimeline timeline={order.timeline} />
        </DetailCard>

        <DetailCard title='ارسال و تحویل' icon={<Truck className='size-5' />}>
          <DetailRow label='شرکت حمل' value={order.shippingCarrier} />

          <DetailRow label='کد رهگیری' value={order.trackingCode} dir='ltr' />

          <DetailRow label='زمان ارسال' value={formatOrderDateTime(order.shippedAt)} />

          <DetailRow label='زمان تحویل' value={formatOrderDateTime(order.deliveredAt)} />

          <DetailRow label='توضیحات ارسال' value={order.shipmentNote} />
        </DetailCard>

        <DetailCard title='نشانی تحویل' icon={<MapPin className='size-5' />}>
          <DetailRow
            label='نام گیرنده'
            value={`${order.shippingRecipientFirstName} ${order.shippingRecipientLastName}`}
          />

          <DetailRow
            label='شماره موبایل'
            value={toPersianDigits(order.shippingRecipientMobile)}
            dir='ltr'
          />

          <DetailRow label='نشانی' value={createShippingAddress(order)} />

          <DetailRow label='کد پستی' value={toPersianDigits(order.shippingPostalCode)} dir='ltr' />

          <DetailRow label='توضیحات نشانی' value={order.shippingNotes} />
        </DetailCard>

        <DetailCard title='مبلغ و پرداخت' icon={<WalletCards className='size-5' />}>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-surface-muted p-3'>
            <span className='text-sm font-bold text-foreground-secondary'>وضعیت پرداخت</span>

            <CustomerPaymentStatusBadge status={order.paymentStatus} />
          </div>

          <DetailRow label='روش پرداخت' value={getPaymentMethodLabel(order.paymentMethodCode)} />

          <DetailRow label='جمع قیمت کالاها' value={formatToman(order.itemsBaseTotalToman)} />

          <DetailRow label='تخفیف کالاها' value={formatToman(order.itemsDiscountToman)} />

          <DetailRow label='تخفیف سفارش' value={formatToman(order.orderDiscountToman)} />

          <DetailRow label='هزینه ارسال' value={formatToman(order.shippingToman)} />

          <DetailRow
            label='مبلغ نهایی'
            value={
              <span className='numeric text-base font-extrabold text-foreground'>
                {formatToman(order.payableToman)}
              </span>
            }
          />

          <DetailRow label='زمان پرداخت' value={formatOrderDateTime(order.paidAt)} />

          <DetailRow label='یادداشت سفارش' value={order.customerNote} />
        </DetailCard>
      </div>

      <section className='space-y-4'>
        <div>
          <h2 className='text-lg font-extrabold text-foreground'>اقلام سفارش</h2>

          <p className='mt-1 text-sm text-foreground-secondary'>
            قیمت‌ها و اطلاعات سازگاری بر اساس زمان ثبت سفارش نمایش داده می‌شوند
          </p>
        </div>

        {order.items.length > 0 ? (
          <div className='space-y-4'>
            {order.items.map((item) => (
              <CustomerOrderItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <section className='rounded-card border border-dashed border-border bg-surface p-8 text-center'>
            <PackageOpen className='mx-auto size-8 text-foreground-muted' />

            <p className='mt-3 text-sm text-foreground-secondary'>
              اطلاعات اقلام این سفارش در دسترس نیست
            </p>
          </section>
        )}
      </section>
    </div>
  );
}
