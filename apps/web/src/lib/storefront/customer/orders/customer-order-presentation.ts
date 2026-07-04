import type {
  CustomerOrderItem,
  CustomerOrderPaymentStatus,
  CustomerOrderStatus,
  CustomerOrderTimelineCode,
} from './customer-order.types';

const persianNumberFormatter = new Intl.NumberFormat('fa-IR');

const jalaliDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Tehran',
});

export function formatCustomerOrderNumber(orderNumber: number): string {
  return `#${persianNumberFormatter.format(orderNumber)}`;
}

export function formatToman(amount: number): string {
  return `${persianNumberFormatter.format(amount)} تومان`;
}

export function formatOrderDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return jalaliDateFormatter.format(date);
}

export function getOrderStatusLabel(status: CustomerOrderStatus): string {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 'در انتظار پرداخت';

    case 'PAID':
      return 'پرداخت‌شده';

    case 'PROCESSING':
      return 'در حال آماده‌سازی';

    case 'SHIPPED':
      return 'ارسال‌شده';

    case 'DELIVERED':
      return 'تحویل‌شده';

    case 'CANCELLED':
      return 'لغوشده';

    default:
      return 'منقضی‌شده';
  }
}

export function getPaymentStatusLabel(status: CustomerOrderPaymentStatus): string {
  switch (status) {
    case 'PAID':
      return 'پرداخت موفق';

    case 'PENDING':
      return 'در حال بررسی';

    case 'FAILED':
      return 'پرداخت ناموفق';

    case 'REFUNDED':
      return 'بازپرداخت‌شده';

    case 'PARTIALLY_REFUNDED':
      return 'بازپرداخت جزئی';

    default:
      return 'پرداخت‌نشده';
  }
}
const jalaliDateTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Tehran',
});

export function formatOrderDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return jalaliDateTimeFormatter.format(date);
}

export function getPaymentMethodLabel(paymentMethodCode: string): string {
  switch (paymentMethodCode) {
    case 'ONLINE':
      return 'پرداخت آنلاین';

    default:
      return paymentMethodCode;
  }
}

export function getTimelineLabel(code: CustomerOrderTimelineCode): string {
  switch (code) {
    case 'ORDER_CREATED':
      return 'سفارش ثبت شد';

    case 'PAYMENT_CONFIRMED':
      return 'پرداخت با موفقیت تأیید شد';

    case 'PROCESSING_STARTED':
      return 'سفارش وارد مرحله آماده‌سازی شد';

    case 'ORDER_SHIPPED':
      return 'سفارش ارسال شد';

    case 'ORDER_DELIVERED':
      return 'سفارش تحویل شد';

    default:
      return 'سفارش لغو شد';
  }
}

export function getFitmentStatusLabel(status: CustomerOrderItem['fitmentStatus']): string {
  switch (status) {
    case 'CONFIRMED':
      return 'سازگاری تأییدشده';

    case 'REQUIRES_VERIFICATION':
      return 'نیازمند بررسی';

    case 'NOT_CONFIRMED':
      return 'سازگاری تأیید نشده';

    default:
      return 'بدون انتخاب خودرو';
  }
}
