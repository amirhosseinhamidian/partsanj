import { Badge } from '@/components/ui/badge';
import type {
  AdminOrderFitmentStatus,
  AdminOrderPaymentStatus,
  AdminOrderStatus,
  AdminPaymentAttemptStatus,
} from '@/lib/admin/orders/admin-order.types';

export function OrderStatusBadge({ status }: { status: AdminOrderStatus }) {
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

export function PaymentStatusBadge({ status }: { status: AdminOrderPaymentStatus }) {
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

    case 'REFUNDED':
      return (
        <Badge variant='neutral' dot>
          بازپرداخت‌شده
        </Badge>
      );

    case 'PARTIALLY_REFUNDED':
      return (
        <Badge variant='warning' dot>
          بازپرداخت جزئی
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

export function PaymentAttemptStatusBadge({ status }: { status: AdminPaymentAttemptStatus }) {
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
          منتقل‌شده به درگاه
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

export function FitmentStatusBadge({ status }: { status: AdminOrderFitmentStatus }) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge size='sm' variant='success'>
          تأییدشده
        </Badge>
      );

    case 'REQUIRES_VERIFICATION':
      return (
        <Badge size='sm' variant='warning'>
          نیازمند بررسی
        </Badge>
      );

    case 'NOT_CONFIRMED':
      return (
        <Badge size='sm' variant='danger'>
          تأیید نشده
        </Badge>
      );

    default:
      return (
        <Badge size='sm' variant='neutral'>
          بدون خودرو
        </Badge>
      );
  }
}
