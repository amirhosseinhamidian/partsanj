import type {
  AdminOrderPaymentStatus,
  AdminOrderStatus,
  AdminPaymentAttemptStatus,
} from './admin-order.types';

type StatusPresentation = {
  label: string;
  className: string;
};

export const ORDER_STATUS_OPTIONS: Array<{
  value: AdminOrderStatus;
  label: string;
}> = [
  { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
  { value: 'PAID', label: 'پرداخت‌شده' },
  { value: 'PROCESSING', label: 'در حال آماده‌سازی' },
  { value: 'SHIPPED', label: 'ارسال‌شده' },
  { value: 'DELIVERED', label: 'تحویل‌شده' },
  { value: 'CANCELLED', label: 'لغوشده' },
  { value: 'EXPIRED', label: 'منقضی‌شده' },
];

export const PAYMENT_STATUS_OPTIONS: Array<{
  value: AdminOrderPaymentStatus;
  label: string;
}> = [
  { value: 'UNPAID', label: 'پرداخت‌نشده' },
  { value: 'PENDING', label: 'در حال بررسی پرداخت' },
  { value: 'PAID', label: 'پرداخت‌شده' },
  { value: 'FAILED', label: 'ناموفق' },
  { value: 'REFUNDED', label: 'بازپرداخت‌شده' },
  { value: 'PARTIALLY_REFUNDED', label: 'بازپرداخت جزئی' },
];

const orderStatusPresentation: Record<AdminOrderStatus, StatusPresentation> = {
  PENDING_PAYMENT: {
    label: 'در انتظار پرداخت',
    className: 'border-warning/30 bg-warning-soft text-warning',
  },
  PAID: {
    label: 'پرداخت‌شده',
    className: 'border-brand/30 bg-brand-soft text-brand',
  },
  PROCESSING: {
    label: 'در حال آماده‌سازی',
    className: 'border-brand/30 bg-brand-soft text-brand',
  },
  SHIPPED: {
    label: 'ارسال‌شده',
    className: 'border-brand/30 bg-brand-soft text-brand',
  },
  DELIVERED: {
    label: 'تحویل‌شده',
    className: 'border-success/30 bg-success-soft text-success',
  },
  CANCELLED: {
    label: 'لغوشده',
    className: 'border-danger/30 bg-danger-soft text-danger',
  },
  EXPIRED: {
    label: 'منقضی‌شده',
    className: 'border-border bg-surface-muted text-foreground-secondary',
  },
};

const paymentStatusPresentation: Record<AdminOrderPaymentStatus, StatusPresentation> = {
  UNPAID: {
    label: 'پرداخت‌نشده',
    className: 'border-border bg-surface-muted text-foreground-secondary',
  },
  PENDING: {
    label: 'در حال بررسی',
    className: 'border-warning/30 bg-warning-soft text-warning',
  },
  PAID: {
    label: 'پرداخت‌شده',
    className: 'border-success/30 bg-success-soft text-success',
  },
  FAILED: {
    label: 'ناموفق',
    className: 'border-danger/30 bg-danger-soft text-danger',
  },
  REFUNDED: {
    label: 'بازپرداخت‌شده',
    className: 'border-border bg-surface-muted text-foreground-secondary',
  },
  PARTIALLY_REFUNDED: {
    label: 'بازپرداخت جزئی',
    className: 'border-warning/30 bg-warning-soft text-warning',
  },
};

const paymentAttemptPresentation: Record<AdminPaymentAttemptStatus, StatusPresentation> = {
  CREATED: {
    label: 'ایجادشده',
    className: 'border-border bg-surface-muted text-foreground-secondary',
  },
  REDIRECTED: {
    label: 'منتقل‌شده به درگاه',
    className: 'border-brand/30 bg-brand-soft text-brand',
  },
  CALLBACK_RECEIVED: {
    label: 'بازگشت از درگاه',
    className: 'border-warning/30 bg-warning-soft text-warning',
  },
  VERIFIED: {
    label: 'تأییدشده',
    className: 'border-success/30 bg-success-soft text-success',
  },
  FAILED: {
    label: 'ناموفق',
    className: 'border-danger/30 bg-danger-soft text-danger',
  },
  CANCELLED: {
    label: 'لغوشده',
    className: 'border-warning/30 bg-warning-soft text-warning',
  },
  EXPIRED: {
    label: 'منقضی‌شده',
    className: 'border-border bg-surface-muted text-foreground-secondary',
  },
};

export function getOrderStatusPresentation(status: AdminOrderStatus) {
  return orderStatusPresentation[status];
}

export function getPaymentStatusPresentation(status: AdminOrderPaymentStatus) {
  return paymentStatusPresentation[status];
}

export function getPaymentAttemptPresentation(status: AdminPaymentAttemptStatus) {
  return paymentAttemptPresentation[status];
}

export function formatOrderNumber(orderNumber: number) {
  return `PS-${new Intl.NumberFormat('fa-IR', {
    useGrouping: false,
  }).format(orderNumber)}`;
}

export function formatToman(amount: number) {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tehran',
  }).format(date);
}

export function getCustomerDisplayName(customer: {
  firstName: string | null;
  lastName: string | null;
  mobile: string;
}) {
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();

  return fullName || 'بدون نام';
}
