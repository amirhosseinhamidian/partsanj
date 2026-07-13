'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientApiError } from '@/lib/api/web-client';
import { storefrontPaymentApi } from '@/lib/api/storefront-payment-client';
import type {
  CustomerOrderInventoryStatus,
  CustomerOrderPaymentStatus,
  CustomerOrderStatus,
} from '@/lib/storefront/customer/orders/customer-order.types';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import { Clock3, CreditCard, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type ReservableCustomerOrder = {
  id: string;
  status: CustomerOrderStatus;
  paymentStatus: CustomerOrderPaymentStatus;
  inventoryStatus: CustomerOrderInventoryStatus;
  expiresAt: string | null;
};

type CustomerOrderReservationNoticeProps = {
  order: ReservableCustomerOrder;
  compact?: boolean;
  className?: string;
  onExpired?: () => void;
};

function getRemainingMilliseconds(expiresAtTimestamp: number): number {
  return Math.max(expiresAtTimestamp - Date.now(), 0);
}

function formatRemainingTime(remainingMilliseconds: number): string {
  const totalSeconds = Math.max(Math.ceil(remainingMilliseconds / 1000), 0);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const segments = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];

  return segments
    .map((segment) => String(segment).padStart(2, '0'))
    .map(toPersianDigits)
    .join(':');
}

function getPaymentErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    if (error.code === 'ORDER_PAYMENT_EXPIRED') {
      return 'مهلت پرداخت این سفارش به پایان رسیده است.';
    }

    if (error.code === 'PAYMENT_ALREADY_IN_PROGRESS') {
      return 'یک تلاش پرداخت برای این سفارش در حال انجام است.';
    }

    if (error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'شروع پرداخت با خطا مواجه شد. دوباره تلاش کنید.';
}

export function CustomerOrderReservationNotice({
  order,
  compact = false,
  className,
  onExpired,
}: CustomerOrderReservationNoticeProps) {
  const expiresAtTimestamp = useMemo(() => {
    if (!order.expiresAt) {
      return Number.NaN;
    }

    return Date.parse(order.expiresAt);
  }, [order.expiresAt]);

  const isReservedOrder =
    order.inventoryStatus === 'RESERVED' &&
    order.status === 'PENDING_PAYMENT' &&
    order.paymentStatus !== 'PAID' &&
    Number.isFinite(expiresAtTimestamp);

  const [remainingMilliseconds, setRemainingMilliseconds] = useState(() =>
    Number.isFinite(expiresAtTimestamp) ? getRemainingMilliseconds(expiresAtTimestamp) : 0,
  );

  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const expirationNotifiedRef = useRef(false);

  useEffect(() => {
    expirationNotifiedRef.current = false;

    setRemainingMilliseconds(
      Number.isFinite(expiresAtTimestamp) ? getRemainingMilliseconds(expiresAtTimestamp) : 0,
    );
  }, [expiresAtTimestamp]);

  useEffect(() => {
    if (!isReservedOrder || remainingMilliseconds <= 0) {
      return;
    }

    function updateRemainingTime() {
      setRemainingMilliseconds(getRemainingMilliseconds(expiresAtTimestamp));
    }

    updateRemainingTime();

    const intervalId = window.setInterval(updateRemainingTime, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [expiresAtTimestamp, isReservedOrder, remainingMilliseconds <= 0]);

  useEffect(() => {
    if (!isReservedOrder || remainingMilliseconds > 0 || expirationNotifiedRef.current) {
      return;
    }

    expirationNotifiedRef.current = true;
    onExpired?.();
  }, [isReservedOrder, onExpired, remainingMilliseconds]);

  if (!isReservedOrder) {
    return null;
  }

  const isExpired = remainingMilliseconds <= 0;

  const canStartPayment = !isExpired && !isStartingPayment && order.paymentStatus !== 'PENDING';

  const paymentButtonLabel =
    order.paymentStatus === 'PENDING'
      ? 'پرداخت در حال انجام است'
      : order.paymentStatus === 'FAILED'
        ? 'تلاش مجدد برای پرداخت'
        : 'پرداخت سریع سفارش';

  async function handleStartPayment() {
    if (!canStartPayment) {
      return;
    }

    setIsStartingPayment(true);
    setPaymentError(null);

    try {
      const response = await storefrontPaymentApi.startOrderPayment(order.id);

      window.location.assign(response.data.redirectUrl);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/login');
        return;
      }

      if (error instanceof ClientApiError && error.code === 'ORDER_PAYMENT_EXPIRED') {
        setRemainingMilliseconds(0);

        if (!expirationNotifiedRef.current) {
          expirationNotifiedRef.current = true;
          onExpired?.();
        }
      }

      setPaymentError(getPaymentErrorMessage(error));
    } finally {
      setIsStartingPayment(false);
    }
  }

  return (
    <section
      role={isExpired ? 'alert' : 'status'}
      className={cn(
        'rounded-card border',
        isExpired ? 'border-danger/35 bg-danger-soft' : 'border-warning/40 bg-warning-soft',
        compact ? 'p-3' : 'p-4 sm:p-5',
        className,
      )}
    >
      <div
        className={cn(
          'flex gap-3',
          compact ? 'flex-col' : 'flex-col sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='danger' dot>
              {isExpired ? 'مهلت رزرو پایان یافت' : 'موجودی برای شما رزرو شده'}
            </Badge>

            {!isExpired ? (
              <span
                role='timer'
                aria-label={`زمان باقی‌مانده رزرو ${formatRemainingTime(remainingMilliseconds)}`}
                className='numeric inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-surface px-2.5 py-1 text-sm font-black text-warning'
              >
                <Clock3 aria-hidden='true' className='size-4' />

                <span dir='ltr'>{formatRemainingTime(remainingMilliseconds)}</span>
              </span>
            ) : null}
          </div>

          <div className='mt-2 flex items-start gap-2'>
            {isExpired ? (
              <TriangleAlert aria-hidden='true' className='mt-1 size-4 shrink-0 text-danger' />
            ) : (
              <ShieldCheck aria-hidden='true' className='mt-1 size-4 shrink-0 text-warning' />
            )}

            <p
              className={cn(
                'text-xs leading-6 sm:text-sm',
                isExpired ? 'font-semibold text-danger' : 'text-foreground-secondary',
              )}
            >
              {isExpired
                ? 'زمان رزرو موجودی این سفارش به پایان رسیده و امکان شروع پرداخت جدید وجود ندارد.'
                : 'موجودی اقلام این سفارش تا پایان این زمان برای شما نگه داشته می‌شود. برای نهایی‌شدن سفارش، پرداخت را پیش از پایان زمان انجام دهید.'}
            </p>
          </div>
        </div>

        <Button
          type='button'
          size={compact ? 'sm' : 'md'}
          variant={isExpired ? 'outline' : 'primary'}
          disabled={!canStartPayment}
          isLoading={isStartingPayment}
          loadingLabel='در حال انتقال به درگاه'
          iconStart={<CreditCard className='size-4' />}
          onClick={() => void handleStartPayment()}
          className={cn('shrink-0', compact ? 'w-full sm:w-fit' : 'w-full sm:w-auto')}
        >
          {isExpired ? 'مهلت پرداخت پایان یافته' : paymentButtonLabel}
        </Button>
      </div>

      {paymentError ? (
        <p
          role='alert'
          className='mt-3 border-t border-danger/20 pt-3 text-xs leading-6 font-semibold text-danger'
        >
          {paymentError}
        </p>
      ) : null}
    </section>
  );
}
