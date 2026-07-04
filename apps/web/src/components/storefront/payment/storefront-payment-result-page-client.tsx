'use client';

import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  HeartHandshake,
  XCircle,
  ClipboardList,
  PackageSearch,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

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
  const router = useRouter();

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
      title: 'پرداخت تأیید نشد',
      description:
        'درگاه پرداخت این تراکنش را تأیید نکرد. اگر مبلغی از حساب شما کسر شده است، فعلاً از پرداخت مجدد خودداری کنید، وضعیت سفارش را بررسی کنید و در صورت نیاز با پشتیبانی تماس بگیرید.',
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
      title: 'نتیجه پرداخت قابل تأیید نیست',
      description:
        'اطلاعات بازگشتی از درگاه برای تطبیق با سفارش کافی نبود. اگر مبلغی از حساب شما کسر شده است، فعلاً پرداخت را دوباره انجام ندهید. ابتدا وضعیت سفارش‌های خود را بررسی کنید و در صورت باقی ماندن ابهام با پشتیبانی تماس بگیرید.',
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

        {state === 'paid' ? (
          <section className='mt-5 flex items-start gap-3 rounded-card border border-brand/25 bg-brand-soft p-4 text-right'>
            <HeartHandshake className='mt-0.5 size-6 shrink-0 text-brand' />

            <div>
              <p className='font-extrabold text-foreground'>از اعتماد شما صمیمانه سپاسگزاریم</p>

              <p className='mt-1 text-sm leading-7 text-foreground-secondary'>
                پرداخت شما با موفقیت ثبت شد. سفارش‌تان با دقت بررسی و آماده‌سازی می‌شود و می‌توانید
                وضعیت آن را در هر مرحله پیگیری کنید.
              </p>
            </div>
          </section>
        ) : null}

        <div className='mt-7 flex flex-wrap justify-center gap-3'>
          {orderId ? (
            <Button
              iconStart={<PackageSearch className='size-4' />}
              onClick={() => {
                router.push(`/account/orders/${encodeURIComponent(orderId)}`);
              }}
            >
              مشاهده سفارش
            </Button>
          ) : null}

          <Button
            variant='secondary'
            iconStart={<ClipboardList className='size-4' />}
            onClick={() => {
              router.push('/account/orders');
            }}
          >
            سفارش‌های من
          </Button>

          <Button
            variant='secondary'
            iconStart={<Store className='size-4' />}
            onClick={() => {
              router.push('/products');
            }}
          >
            بازگشت به فروشگاه
          </Button>
        </div>
      </section>
    </div>
  );
}
