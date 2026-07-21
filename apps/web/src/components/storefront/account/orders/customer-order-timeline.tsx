import { Check, CircleX, ClipboardCheck, PackageCheck, ShoppingBag, Truck } from 'lucide-react';
import type {
  CustomerOrderTimelineCode,
  CustomerOrderTimelineItem,
} from '@/lib/storefront/customer/orders/customer-order.types';
import {
  formatOrderDateTime,
  getTimelineLabel,
} from '@/lib/storefront/customer/orders/customer-order-presentation';

type CustomerOrderTimelineProps = {
  timeline: CustomerOrderTimelineItem[];
};

function getTimelineIcon(code: CustomerOrderTimelineCode) {
  switch (code) {
    case 'ORDER_CREATED':
      return <ShoppingBag className='size-4' />;

    case 'PAYMENT_CONFIRMED':
      return <Check className='size-4' />;

    case 'PROCESSING_STARTED':
      return <ClipboardCheck className='size-4' />;

    case 'ORDER_SHIPPED':
      return <Truck className='size-4' />;

    case 'ORDER_DELIVERED':
      return <PackageCheck className='size-4' />;

    default:
      return <CircleX className='size-4' />;
  }
}

function getTimelineTone(code: CustomerOrderTimelineCode) {
  return code === 'ORDER_CANCELLED'
    ? 'border-danger/30 bg-danger-soft text-danger'
    : 'border-brand/30 bg-brand-soft text-brand';
}

export function CustomerOrderTimeline({ timeline }: CustomerOrderTimelineProps) {
  if (timeline.length === 0) {
    return <p className='text-sm text-foreground-muted'>تاریخچه وضعیت سفارش در دسترس نیست</p>;
  }

  return (
    <ol dir='rtl' className='space-y-0'>
      {timeline.map((item, index) => {
        const isLastItem = index === timeline.length - 1;

        return (
          <li
            key={`${item.code}-${item.occurredAt}`}
            className='relative flex gap-4 pb-6 last:pb-0'
          >
            <div className='relative flex w-9 shrink-0 justify-center'>
              {!isLastItem ? (
                <span
                  aria-hidden='true'
                  className='absolute top-8 -bottom-6 left-1/2 w-px -translate-x-1/2 bg-border'
                />
              ) : null}

              <span
                className={[
                  'relative z-10 grid size-8 place-items-center rounded-full border',
                  getTimelineTone(item.code),
                ].join(' ')}
              >
                {getTimelineIcon(item.code)}
              </span>
            </div>

            <div className='min-w-0 flex-1 pt-1 text-right'>
              <p className='text-sm font-extrabold text-foreground'>
                {getTimelineLabel(item.code)}
              </p>

              <p className='mt-1 text-xs text-foreground-secondary'>
                {formatOrderDateTime(item.occurredAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
