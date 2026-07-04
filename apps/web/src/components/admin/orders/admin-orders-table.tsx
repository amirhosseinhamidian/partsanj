'use client';

import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import {
  formatOrderNumber,
  getCustomerDisplayName,
} from '@/lib/admin/orders/admin-order-presentation';
import type {
  AdminOrderListItem,
  AdminOrderPaymentStatus,
  AdminOrderStatus,
  AdminPaymentAttemptStatus,
} from '@/lib/admin/orders/admin-order.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { formatPrice } from '@/lib/utils/price';
import { Eye } from 'lucide-react';
import { useMemo } from 'react';

type AdminOrdersTableProps = {
  orders: AdminOrderListItem[];
  loading: boolean;

  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;
  onOpenDetails: (order: AdminOrderListItem) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function OrderStatusBadge({ status }: { status: AdminOrderStatus }) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return (
        <Badge variant='warning' dot>
          در انتظار پرداخت
        </Badge>
      );

    case 'PAID':
      return (
        <Badge variant='brand' dot>
          پرداخت‌شده
        </Badge>
      );

    case 'PROCESSING':
      return (
        <Badge variant='brand' dot>
          در حال آماده‌سازی
        </Badge>
      );

    case 'SHIPPED':
      return (
        <Badge variant='brand' dot>
          ارسال‌شده
        </Badge>
      );

    case 'DELIVERED':
      return (
        <Badge variant='success' dot>
          تحویل‌شده
        </Badge>
      );

    case 'CANCELLED':
      return (
        <Badge variant='danger' dot>
          لغوشده
        </Badge>
      );

    default:
      return (
        <Badge variant='neutral' dot>
          منقضی‌شده
        </Badge>
      );
  }
}

function PaymentStatusBadge({ status }: { status: AdminOrderPaymentStatus }) {
  switch (status) {
    case 'PAID':
      return (
        <Badge variant='success' dot>
          پرداخت‌شده
        </Badge>
      );

    case 'PENDING':
      return (
        <Badge variant='warning' dot>
          در حال بررسی
        </Badge>
      );

    case 'FAILED':
      return (
        <Badge variant='danger' dot>
          ناموفق
        </Badge>
      );

    case 'PARTIALLY_REFUNDED':
      return (
        <Badge variant='warning' dot>
          بازپرداخت جزئی
        </Badge>
      );

    case 'REFUNDED':
      return (
        <Badge variant='neutral' dot>
          بازپرداخت‌شده
        </Badge>
      );

    default:
      return (
        <Badge variant='neutral' dot>
          پرداخت‌نشده
        </Badge>
      );
  }
}

function PaymentAttemptBadge({ status }: { status: AdminPaymentAttemptStatus }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <Badge size='sm' variant='success'>
          تأییدشده
        </Badge>
      );

    case 'REDIRECTED':
      return (
        <Badge size='sm' variant='brand'>
          درگاه
        </Badge>
      );

    case 'CALLBACK_RECEIVED':
      return (
        <Badge size='sm' variant='warning'>
          بازگشت از درگاه
        </Badge>
      );

    case 'FAILED':
      return (
        <Badge size='sm' variant='danger'>
          ناموفق
        </Badge>
      );

    case 'CANCELLED':
      return (
        <Badge size='sm' variant='warning'>
          لغوشده
        </Badge>
      );

    case 'EXPIRED':
      return (
        <Badge size='sm' variant='neutral'>
          منقضی‌شده
        </Badge>
      );

    default:
      return (
        <Badge size='sm' variant='neutral'>
          ایجادشده
        </Badge>
      );
  }
}

export function AdminOrdersTable({
  orders,
  loading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onOpenDetails,
}: AdminOrdersTableProps) {
  const columns = useMemo<DataTableColumn<AdminOrderListItem>[]>(
    () => [
      {
        key: 'order',
        header: 'سفارش',
        minWidth: '180px',
        cell: (row) => (
          <div>
            <p className='numeric font-extrabold text-foreground'>
              {formatOrderNumber(row.orderNumber)}
            </p>

            <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted'>
              <span>{toPersianDigits(String(row._count.items))} قلم کالا</span>

              <span>{formatDate(row.createdAt)}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'مشتری',
        minWidth: '190px',
        cell: (row) => (
          <div>
            <p className='font-semibold text-foreground-secondary'>
              {getCustomerDisplayName(row.customerUser)}
            </p>

            <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
              {toPersianDigits(row.customerUser.mobile)}
            </p>
          </div>
        ),
      },
      {
        key: 'price',
        header: 'مبلغ سفارش',
        minWidth: '165px',
        align: 'center',
        cell: (row) => (
          <div className='space-y-1'>
            <p className='numeric text-sm font-extrabold text-foreground'>
              {formatPrice(row.payableToman)}
            </p>

            <p className='text-xs text-foreground-muted'>
              {row.paymentMethodCode === 'ONLINE' ? 'پرداخت آنلاین' : row.paymentMethodCode}
            </p>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'وضعیت سفارش',
        minWidth: '145px',
        align: 'center',
        cell: (row) => <OrderStatusBadge status={row.status} />,
      },
      {
        key: 'payment',
        header: 'وضعیت پرداخت',
        minWidth: '155px',
        align: 'center',
        cell: (row) => (
          <div className='flex flex-col items-center gap-1.5'>
            <PaymentStatusBadge status={row.paymentStatus} />

            {row.latestPaymentAttempt ? (
              <PaymentAttemptBadge status={row.latestPaymentAttempt.status} />
            ) : null}
          </div>
        ),
      },
      {
        key: 'shipment',
        header: 'ارسال',
        minWidth: '185px',
        cell: (row) => {
          if (!row.shippingCarrier && !row.trackingCode) {
            return <span className='text-sm text-foreground-muted'>ثبت نشده</span>;
          }

          return (
            <div>
              <p className='font-semibold text-foreground-secondary'>
                {row.shippingCarrier ?? 'بدون شرکت حمل'}
              </p>

              {row.trackingCode ? (
                <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
                  {toPersianDigits(row.trackingCode)}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'updatedAt',
        header: 'آخرین تغییر',
        minWidth: '130px',
        align: 'center',
        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatDate(row.updatedAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={orders}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingRows={10}
      tableClassName='min-w-[1280px]'
      emptyTitle='سفارشی پیدا نشد'
      emptyDescription='فیلترها را تغییر دهید یا بعداً دوباره بررسی کنید'
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
      onRowClick={onOpenDetails}
      rowActions={(row) => (
        <Tooltip content='مشاهده جزئیات سفارش'>
          <span className='inline-flex'>
            <IconButton
              aria-label={`مشاهده سفارش ${formatOrderNumber(row.orderNumber)}`}
              icon={<Eye />}
              variant='ghost'
              size='sm'
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetails(row);
              }}
            />
          </span>
        </Tooltip>
      )}
    />
  );
}
