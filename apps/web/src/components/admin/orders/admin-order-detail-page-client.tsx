'use client';

import {
  AdminOrderAuditLogSection,
  AdminOrderPaymentAttemptsSection,
} from '@/components/admin/orders/admin-order-history-sections';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/orders/admin-order-badges';
import { AdminOrderShipmentSheet } from '@/components/admin/orders/admin-order-shipment-sheet';
import {
  CancelOrderDialog,
  ConfirmOrderActionDialog,
} from '@/components/admin/orders/admin-order-action-dialogs';
import { AdminOrderItemsTable } from '@/components/admin/orders/admin-order-items-table';
import { Button } from '@/components/ui/button';
import { adminOrderApi } from '@/lib/api/admin-order-client';
import { ClientApiError } from '@/lib/api/web-client';
import {
  formatDateTime,
  formatOrderNumber,
  formatToman,
  getCustomerDisplayName,
} from '@/lib/admin/orders/admin-order-presentation';
import type {
  AdminOrderDetail,
  AdminOrderResponse,
  MarkOrderShippedInput,
} from '@/lib/admin/orders/admin-order.types';
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  MapPin,
  PackageCheck,
  RefreshCw,
  Truck,
  UserRound,
  WalletCards,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';

type MutationKind = 'processing' | 'shipment' | 'delivered' | 'cancel';

type AdminOrderDetailPageClientProps = {
  orderId: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'انجام عملیات با خطا مواجه شد';
}

function DetailsCard({
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
    <div className='flex items-start justify-between gap-4 border-b border-border py-3 last:border-b-0'>
      <span className='shrink-0 text-sm text-foreground-muted'>{label}</span>

      <span dir={dir} className='min-w-0 text-end text-sm font-semibold text-foreground-secondary'>
        {value || '—'}
      </span>
    </div>
  );
}

function OrderOperationsCard({
  order,
  loading,
  onStartProcessing,
  onOpenShipment,
  onMarkDelivered,
  onCancel,
}: {
  order: AdminOrderDetail;
  loading: boolean;

  onStartProcessing: () => void;
  onOpenShipment: () => void;
  onMarkDelivered: () => void;
  onCancel: () => void;
}) {
  const canStartProcessing = order.status === 'PAID' && order.paymentStatus === 'PAID';

  const canShip = order.status === 'PROCESSING' && order.paymentStatus === 'PAID';

  const canDeliver = order.status === 'SHIPPED' && order.paymentStatus === 'PAID';

  const canCancel =
    order.status === 'PENDING_PAYMENT' &&
    (order.paymentStatus === 'UNPAID' || order.paymentStatus === 'FAILED');

  const hasAction = canStartProcessing || canShip || canDeliver || canCancel;

  return (
    <DetailsCard title='عملیات سفارش' icon={<ClipboardList className='size-5' />}>
      {hasAction ? (
        <div className='flex flex-wrap gap-3'>
          {canStartProcessing ? (
            <Button disabled={loading} onClick={onStartProcessing}>
              شروع آماده‌سازی
            </Button>
          ) : null}

          {canShip ? (
            <Button
              disabled={loading}
              iconStart={<Truck className='size-4' />}
              onClick={onOpenShipment}
            >
              ثبت ارسال سفارش
            </Button>
          ) : null}

          {canDeliver ? (
            <Button
              disabled={loading}
              iconStart={<PackageCheck className='size-4' />}
              onClick={onMarkDelivered}
            >
              ثبت تحویل سفارش
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              variant='outline'
              disabled={loading}
              iconStart={<XCircle className='size-4' />}
              className='border-danger/40 text-danger hover:bg-danger-soft'
              onClick={onCancel}
            >
              لغو سفارش
            </Button>
          ) : null}
        </div>
      ) : (
        <p className='text-sm leading-7 text-foreground-secondary'>
          برای وضعیت فعلی سفارش، عملیات مدیریتی قابل انجامی وجود ندارد
        </p>
      )}
    </DetailsCard>
  );
}

export function AdminOrderDetailPageClient({ orderId }: AdminOrderDetailPageClientProps) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const [mutatingAction, setMutatingAction] = useState<MutationKind | null>(null);

  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);

  const [isShipmentSheetOpen, setIsShipmentSheetOpen] = useState(false);

  const [isDeliveredDialogOpen, setIsDeliveredDialogOpen] = useState(false);

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await adminOrderApi.findOrderById(orderId);

      setOrder(response.data);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');
        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function runMutation(action: MutationKind, operation: () => Promise<AdminOrderResponse>) {
    setMutatingAction(action);
    setActionError(null);

    try {
      const response = await operation();

      setOrder(response.data);

      return true;
    } catch (error) {
      setActionError(getErrorMessage(error));
      return false;
    } finally {
      setMutatingAction(null);
    }
  }

  if (isLoading && !order) {
    return (
      <div className='space-y-6'>
        <div className='h-24 animate-pulse rounded-card bg-surface-muted' />

        <div className='grid gap-6 xl:grid-cols-2'>
          <div className='h-72 animate-pulse rounded-card bg-surface-muted' />
          <div className='h-72 animate-pulse rounded-card bg-surface-muted' />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <section className='rounded-card border border-danger/30 bg-danger-soft p-6'>
        <div className='flex gap-3'>
          <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

          <div>
            <h1 className='font-extrabold text-danger'>دریافت سفارش ناموفق بود</h1>

            <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
              {loadError ?? 'اطلاعات سفارش در دسترس نیست'}
            </p>

            <Button className='mt-4' variant='outline' onClick={() => void loadOrder()}>
              تلاش مجدد
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const orderNumber = formatOrderNumber(order.orderNumber);

  const shipmentInitialValue = {
    shippingCarrier: order.shippingCarrier ?? '',
    trackingCode: order.trackingCode ?? '',
    shipmentNote: order.shipmentNote ?? '',
  };

  return (
    <div className='space-y-6'>
      <header className='flex flex-col gap-4 border-b border-border pb-6 xl:flex-row xl:items-start xl:justify-between'>
        <div>
          <Link
            href='/admin/orders'
            className='inline-flex items-center gap-1 text-sm font-bold text-foreground-secondary transition-colors hover:text-brand'
          >
            <ArrowRight className='size-4' />
            بازگشت به سفارش‌ها
          </Link>

          <div className='mt-4 flex flex-wrap items-center gap-3'>
            <h1 className='type-page-title text-foreground'>سفارش {orderNumber}</h1>

            <OrderStatusBadge status={order.status} />

            <PaymentStatusBadge status={order.paymentStatus} />
          </div>

          <p className='type-body mt-2 text-foreground-secondary'>
            ثبت‌شده در {formatDateTime(order.createdAt)}
          </p>
        </div>

        <Button
          type='button'
          variant='outline'
          disabled={isLoading || mutatingAction !== null}
          isLoading={isLoading}
          loadingLabel='در حال دریافت'
          iconStart={<RefreshCw className='size-4' />}
          onClick={() => void loadOrder()}
        >
          به‌روزرسانی
        </Button>
      </header>

      {actionError ? (
        <section className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sm font-semibold text-danger'>{actionError}</p>

          <Button type='button' size='sm' variant='outline' onClick={() => setActionError(null)}>
            بستن پیام
          </Button>
        </section>
      ) : null}

      <div className='grid gap-6 xl:grid-cols-2'>
        <DetailsCard title='مشتری و نشانی ارسال' icon={<UserRound className='size-5' />}>
          <DetailRow
            label='نام گیرنده'
            value={`${order.shippingRecipientFirstName} ${order.shippingRecipientLastName}`}
          />

          <DetailRow
            label='شماره موبایل'
            dir='ltr'
            value={toPersianDigits(order.shippingRecipientMobile)}
          />

          <DetailRow
            label='استان و شهر'
            value={`${order.shippingProvince}، ${order.shippingCity}`}
          />

          <DetailRow
            label='نشانی'
            value={[
              order.shippingDistrict,
              order.shippingAddressLine,
              order.shippingPlaque && `پلاک ${order.shippingPlaque}`,
              order.shippingFloor && `طبقه ${order.shippingFloor}`,
              order.shippingUnit && `واحد ${order.shippingUnit}`,
            ]
              .filter(Boolean)
              .join('، ')}
          />

          <DetailRow label='کد پستی' dir='ltr' value={toPersianDigits(order.shippingPostalCode)} />

          <DetailRow label='یادداشت ارسال' value={order.shippingNotes} />

          <div className='mt-4 rounded-control border border-border bg-surface-muted p-3'>
            <p className='text-xs text-foreground-muted'>حساب کاربری مشتری</p>

            <p className='mt-1 font-bold text-foreground'>
              {getCustomerDisplayName(order.customerUser)}
            </p>

            <p dir='ltr' className='mt-1 text-sm text-foreground-secondary'>
              {toPersianDigits(order.customerUser.mobile)}
            </p>
          </div>
        </DetailsCard>

        <DetailsCard title='مبالغ و پرداخت' icon={<WalletCards className='size-5' />}>
          <DetailRow label='جمع قیمت پایه کالاها' value={formatToman(order.itemsBaseTotalToman)} />

          <DetailRow label='تخفیف کالاها' value={formatToman(order.itemsDiscountToman)} />

          <DetailRow label='تخفیف سفارش' value={formatToman(order.orderDiscountToman)} />

          <DetailRow label='هزینه ارسال' value={formatToman(order.shippingToman)} />

          <DetailRow label='مبلغ قابل پرداخت' value={formatToman(order.payableToman)} />

          <DetailRow label='روش پرداخت' value={order.paymentMethodCode} />

          <DetailRow label='زمان پرداخت' value={formatDateTime(order.paidAt)} />

          <DetailRow label='یادداشت مشتری' value={order.customerNote} />
        </DetailsCard>

        <DetailsCard title='ارسال و تحویل' icon={<MapPin className='size-5' />}>
          <DetailRow label='شرکت حمل' value={order.shippingCarrier} />

          <DetailRow label='کد رهگیری' dir='ltr' value={order.trackingCode} />

          <DetailRow label='یادداشت ارسال' value={order.shipmentNote} />

          <DetailRow label='زمان ارسال' value={formatDateTime(order.shippedAt)} />

          <DetailRow label='زمان تحویل' value={formatDateTime(order.deliveredAt)} />
        </DetailsCard>

        <OrderOperationsCard
          order={order}
          loading={mutatingAction !== null}
          onStartProcessing={() => setIsProcessingDialogOpen(true)}
          onOpenShipment={() => setIsShipmentSheetOpen(true)}
          onMarkDelivered={() => setIsDeliveredDialogOpen(true)}
          onCancel={() => setIsCancelDialogOpen(true)}
        />
      </div>

      {order.status === 'CANCELLED' ? (
        <DetailsCard title='اطلاعات لغو' icon={<XCircle className='size-5' />}>
          <DetailRow label='زمان لغو' value={formatDateTime(order.cancelledAt)} />

          <DetailRow label='دلیل لغو' value={order.cancellationReason} />
        </DetailsCard>
      ) : null}

      <section className='space-y-4'>
        <div>
          <h2 className='text-lg font-extrabold text-foreground'>اقلام سفارش</h2>

          <p className='mt-1 text-sm text-foreground-secondary'>
            قیمت‌ها و سازگاری خودرو بر اساس Snapshot زمان ثبت سفارش هستند
          </p>
        </div>

        <AdminOrderItemsTable items={order.items} />
      </section>

      <AdminOrderPaymentAttemptsSection attempts={order.paymentAttempts} />

      <AdminOrderAuditLogSection auditLogs={order.auditLogs} />

      <ConfirmOrderActionDialog
        open={isProcessingDialogOpen}
        title='شروع آماده‌سازی سفارش'
        description='وضعیت سفارش از پرداخت‌شده به در حال آماده‌سازی تغییر می‌کند'
        confirmLabel='شروع آماده‌سازی'
        loading={mutatingAction === 'processing'}
        onOpenChange={setIsProcessingDialogOpen}
        onConfirm={() => runMutation('processing', () => adminOrderApi.markProcessing(order.id))}
      />

      <AdminOrderShipmentSheet
        open={isShipmentSheetOpen}
        orderNumber={orderNumber}
        loading={mutatingAction === 'shipment'}
        initialValue={shipmentInitialValue}
        onOpenChange={setIsShipmentSheetOpen}
        onSubmit={(input: MarkOrderShippedInput) =>
          runMutation('shipment', () => adminOrderApi.markShipped(order.id, input))
        }
      />

      <ConfirmOrderActionDialog
        open={isDeliveredDialogOpen}
        title='ثبت تحویل سفارش'
        description='پس از ثبت، وضعیت سفارش به تحویل‌شده تغییر می‌کند'
        confirmLabel='ثبت تحویل'
        loading={mutatingAction === 'delivered'}
        onOpenChange={setIsDeliveredDialogOpen}
        onConfirm={() => runMutation('delivered', () => adminOrderApi.markDelivered(order.id))}
      />

      <CancelOrderDialog
        open={isCancelDialogOpen}
        orderNumber={orderNumber}
        loading={mutatingAction === 'cancel'}
        onOpenChange={setIsCancelDialogOpen}
        onConfirm={(reason) =>
          runMutation('cancel', () =>
            adminOrderApi.cancelOrder(order.id, {
              cancellationReason: reason,
            }),
          )
        }
      />
    </div>
  );
}
