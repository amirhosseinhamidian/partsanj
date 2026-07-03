'use client';

import { Button } from '@/components/ui/button';
import { storefrontPaymentApi } from '@/lib/api/storefront-payment-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  StorefrontOrderPaymentStatus,
  StorefrontOrderStatus,
} from '@/lib/storefront/order/order.types';
import { CheckCircle2, CircleAlert, CreditCard, RefreshCw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

type StorefrontOrderPaymentCardProps = {
  orderId: string;
  orderStatus: StorefrontOrderStatus;
  paymentStatus: StorefrontOrderPaymentStatus;
  payableToman: number;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'شروع پرداخت با خطا مواجه شد';
}

export function StorefrontOrderPaymentCard({
  orderId,
  orderStatus,
  paymentStatus,
  payableToman,
}: StorefrontOrderPaymentCardProps) {
  const [isStartingPayment, setIsStartingPayment] = useState(false);

  const [paymentError, setPaymentError] = useState<string | null>(null);

  const isPaid = orderStatus === 'PAID' || paymentStatus === 'PAID';

  const isPaymentPending = paymentStatus === 'PENDING';

  const isOrderPayable = orderStatus === 'PENDING_PAYMENT' && payableToman > 0;

  async function handleStartPayment() {
    if (!isOrderPayable || isPaid || isPaymentPending) {
      return;
    }

    setPaymentError(null);
    setIsStartingPayment(true);

    try {
      const response = await storefrontPaymentApi.startOrderPayment(orderId);

      const redirectUrl = new URL(response.data.redirectUrl);

      if (redirectUrl.protocol !== 'https:') {
        throw new Error('آدرس درگاه پرداخت معتبر نیست');
      }

      window.location.assign(redirectUrl.toString());
    } catch (error) {
      setPaymentError(getErrorMessage(error));
    } finally {
      setIsStartingPayment(false);
    }
  }

  if (isPaid) {
    return (
      <div className='mt-6 rounded-control border border-success/30 bg-success-soft p-4 text-start'>
        <div className='flex gap-3'>
          <CheckCircle2 className='mt-0.5 size-5 shrink-0 text-success' />

          <div>
            <p className='font-extrabold text-success'>پرداخت این سفارش با موفقیت انجام شده است</p>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
              سفارش شما وارد مرحله بررسی و آماده‌سازی خواهد شد
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isPaymentPending) {
    return (
      <div className='mt-6 rounded-control border border-warning/30 bg-warning-soft p-4 text-start'>
        <div className='flex gap-3'>
          <TriangleAlert className='mt-0.5 size-5 shrink-0 text-warning' />

          <div>
            <p className='font-extrabold text-foreground'>یک تلاش پرداخت در حال پیگیری است</p>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
              در صورت بازگشت از درگاه، وضعیت سفارش به‌صورت خودکار به‌روزرسانی می‌شود
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOrderPayable) {
    return (
      <div className='mt-6 rounded-control border border-warning/30 bg-warning-soft p-4 text-start'>
        <div className='flex gap-3'>
          <TriangleAlert className='mt-0.5 size-5 shrink-0 text-warning' />

          <div>
            <p className='font-extrabold text-foreground'>این سفارش در حال حاضر قابل پرداخت نیست</p>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
              وضعیت سفارش یا مبلغ آن برای شروع پرداخت آنلاین معتبر نیست
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-6 rounded-control border border-border bg-surface-muted p-4 text-start'>
      <div className='flex gap-3'>
        <CreditCard className='mt-0.5 size-5 shrink-0 text-brand' />

        <div className='min-w-0 flex-1'>
          <p className='font-extrabold text-foreground'>پرداخت آنلاین سفارش</p>

          <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
            برای تکمیل خرید، پرداخت آنلاین سفارش را آغاز کنید
          </p>

          {paymentError ? (
            <div className='mt-4 rounded-control border border-danger/30 bg-danger-soft p-3'>
              <div className='flex gap-2'>
                <CircleAlert className='mt-0.5 size-4 shrink-0 text-danger' />

                <p className='text-xs leading-6 text-foreground-secondary'>{paymentError}</p>
              </div>
            </div>
          ) : null}

          <Button
            type='button'
            className='mt-5'
            isLoading={isStartingPayment}
            loadingLabel='در حال انتقال به درگاه'
            iconStart={isStartingPayment ? undefined : <CreditCard className='size-4' />}
            onClick={() => void handleStartPayment()}
          >
            {paymentStatus === 'FAILED' ? 'تلاش مجدد برای پرداخت' : 'پرداخت آنلاین'}
          </Button>

          <p className='mt-3 text-xs leading-6 text-foreground-muted'>
            پرداخت شما از طریق درگاه امن پرداخت انجام می‌شود
          </p>
        </div>
      </div>
    </div>
  );
}
