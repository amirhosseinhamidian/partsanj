'use client';

import { CheckCircle2, CircleAlert, Clock3, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type PaymentResultState = 'paid' | 'cancelled' | 'failed' | 'pending' | 'invalid';

function getPaymentResultState(value: string | null): PaymentResultState {
  if (
    value === 'paid' ||
    value === 'cancelled' ||
    value === 'failed' ||
    value === 'pending' ||
    value === 'invalid'
  ) {
    return value;
  }

  return 'invalid';
}

function isUuid(value: string | null) {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function StorefrontPaymentResultPageClient() {
  const searchParams = useSearchParams();

  const state = getPaymentResultState(searchParams.get('state'));

  const orderId = isUuid(searchParams.get('orderId')) ? searchParams.get('orderId') : null;

  const content = {
    paid: {
      title: 'پرداخت با موفقیت تأیید شد',
      description: 'پرداخت سفارش شما ثبت شده و سفارش وارد مرحله بررسی و آماده‌سازی می‌شود',
      icon: CheckCircle2,
      iconClass: 'text-success',
      panelClass: 'border-success/30 bg-success-soft',
    },
    cancelled: {
      title: 'پرداخت لغو شد',
      description: 'پرداخت نهایی نشده است و می‌توانید از صفحه سفارش دوباره تلاش کنید',
      icon: XCircle,
      iconClass: 'text-warning',
      panelClass: 'border-warning/30 bg-warning-soft',
    },
    failed: {
      title: 'تأیید پرداخت ناموفق بود',
      description: 'پرداخت نهایی نشده است. در صورت کسر وجه، ابتدا با پشتیبانی تماس بگیرید',
      icon: CircleAlert,
      iconClass: 'text-danger',
      panelClass: 'border-danger/30 bg-danger-soft',
    },
    pending: {
      title: 'پرداخت در حال بررسی است',
      description:
        'وضعیت نهایی پرداخت هنوز از درگاه دریافت نشده است. چند لحظه دیگر صفحه سفارش را بررسی کنید',
      icon: Clock3,
      iconClass: 'text-brand',
      panelClass: 'border-brand/30 bg-brand-soft',
    },
    invalid: {
      title: 'نتیجه پرداخت معتبر نیست',
      description: 'اطلاعات بازگشت از درگاه برای اتصال به سفارش معتبر نبود',
      icon: CircleAlert,
      iconClass: 'text-danger',
      panelClass: 'border-danger/30 bg-danger-soft',
    },
  }[state];

  const Icon = content.icon;

  return (
    <div className='mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-4 py-12 sm:px-6'>
      <section
        className={`w-full rounded-card border p-6 text-center shadow-panel ${content.panelClass}`}
      >
        <Icon className={`mx-auto size-11 ${content.iconClass}`} />

        <h1 className='mt-5 text-xl font-extrabold text-foreground'>{content.title}</h1>

        <p className='mt-3 text-sm leading-7 text-foreground-secondary'>{content.description}</p>

        <div className='mt-7 flex flex-wrap justify-center gap-3'>
          {orderId ? (
            <Link
              href={`/orders/${encodeURIComponent(orderId)}`}
              className='text-on-brand inline-flex h-10 items-center justify-center rounded-control bg-brand px-4 text-sm font-bold transition-opacity hover:opacity-90'
            >
              مشاهده سفارش
            </Link>
          ) : null}

          <Link
            href='/products'
            className='inline-flex h-10 items-center justify-center rounded-control border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-surface-muted'
          >
            بازگشت به فروشگاه
          </Link>
        </div>
      </section>
    </div>
  );
}
