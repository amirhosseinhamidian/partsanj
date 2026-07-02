'use client';

import { Button } from '@/components/ui/button';
import { storefrontOrderApi } from '@/lib/api/storefront-order-client';
import type { StorefrontOrderDetail } from '@/lib/storefront/order/order.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { formatPrice } from '@/lib/utils/price';
import {
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  CreditCard,
  PackageOpen,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Props = {
  orderId: string;
};

export function StorefrontOrderDetailPageClient({ orderId }: Props) {
  const [order, setOrder] = useState<StorefrontOrderDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await storefrontOrderApi.getById(orderId);

      setOrder(response.data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'دریافت اطلاعات سفارش انجام نشد');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  if (isLoading) {
    return (
      <div className='mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:px-8'>
        <div className='h-96 animate-pulse rounded-card bg-surface-muted' />
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className='mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8'>
        <div className='rounded-card border border-danger/30 bg-danger-soft p-8'>
          <CircleAlert className='mx-auto size-8 text-danger' />

          <h1 className='mt-4 text-xl font-extrabold text-foreground'>دریافت سفارش انجام نشد</h1>

          <p className='mt-2 text-sm text-foreground-secondary'>{loadError}</p>

          <Button
            type='button'
            variant='outline'
            className='mt-5'
            iconStart={<RefreshCw className='size-4' />}
            onClick={() => void loadOrder()}
          >
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8'>
      <section className='rounded-card border border-border bg-surface p-6 text-center shadow-panel sm:p-8'>
        <span className='mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success'>
          <CheckCircle2 className='size-9' />
        </span>

        <h1 className='mt-5 text-2xl font-extrabold text-foreground'>سفارش شما ثبت شد</h1>

        <p className='mt-3 text-sm leading-7 text-foreground-secondary'>
          شماره سفارش شما{' '}
          <span className='numeric font-extrabold text-foreground'>
            {toPersianDigits(order.orderNumber)}
          </span>{' '}
          است
        </p>

        <div className='mt-6 rounded-control border border-border bg-surface-muted p-4'>
          <p className='text-xs text-foreground-muted'>مبلغ پرداخت شده</p>

          <p className='numeric mt-1 text-2xl font-extrabold text-foreground'>
            {formatPrice(order.payableToman)}
          </p>
        </div>

        <div className='mt-6 rounded-control border border-warning/30 bg-warning-soft p-4 text-start'>
          <div className='flex gap-3'>
            <CreditCard className='mt-0.5 size-5 shrink-0 text-warning' />

            <div>
              <p className='font-extrabold text-foreground'>پرداخت آنلاین هنوز فعال نشده است</p>

              <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                اتصال زرین‌پال در مرحله بعدی روی همین Order انجام می‌شود
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Link
            href='/products'
            className='inline-flex h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface px-5 text-sm font-bold text-foreground transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand'
          >
            ادامه خرید
            <ChevronLeft className='size-4' />
          </Link>
        </div>
      </section>

      <section className='mt-6 rounded-card border border-border bg-surface p-5 shadow-panel'>
        <div className='flex items-center gap-2'>
          <PackageOpen className='size-5 text-brand' />

          <h2 className='text-lg font-extrabold text-foreground'>اقلام سفارش</h2>
        </div>

        <div className='mt-5 divide-y divide-border'>
          {order.items.map((item) => (
            <div
              key={item.id}
              className='flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0'
            >
              <div className='min-w-0'>
                <p className='text-xs font-semibold text-foreground-muted'>{item.brandName}</p>

                <p className='mt-1 text-sm font-extrabold text-foreground'>{item.productName}</p>

                <p className='mt-1 text-xs text-foreground-secondary'>
                  تعداد: {toPersianDigits(item.quantity)}
                </p>
              </div>

              <p className='numeric shrink-0 text-sm font-extrabold text-foreground'>
                {formatPrice(item.linePayableToman)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
