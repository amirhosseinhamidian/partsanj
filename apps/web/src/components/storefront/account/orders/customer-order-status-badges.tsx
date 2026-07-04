import { Badge } from '@/components/ui/badge';
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '@/lib/storefront/customer/orders/customer-order-presentation';
import type {
  CustomerOrderPaymentStatus,
  CustomerOrderStatus,
} from '@/lib/storefront/customer/orders/customer-order.types';

export function CustomerOrderStatusBadge({ status }: { status: CustomerOrderStatus }) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return (
        <Badge variant='warning' dot>
          {getOrderStatusLabel(status)}
        </Badge>
      );

    case 'PAID':
    case 'PROCESSING':
    case 'SHIPPED':
      return (
        <Badge variant='brand' dot>
          {getOrderStatusLabel(status)}
        </Badge>
      );

    case 'DELIVERED':
      return (
        <Badge variant='success' dot>
          {getOrderStatusLabel(status)}
        </Badge>
      );

    case 'CANCELLED':
      return (
        <Badge variant='danger' dot>
          {getOrderStatusLabel(status)}
        </Badge>
      );

    default:
      return (
        <Badge variant='neutral' dot>
          {getOrderStatusLabel(status)}
        </Badge>
      );
  }
}

export function CustomerPaymentStatusBadge({ status }: { status: CustomerOrderPaymentStatus }) {
  switch (status) {
    case 'PAID':
      return (
        <Badge size='sm' variant='success'>
          {getPaymentStatusLabel(status)}
        </Badge>
      );

    case 'PENDING':
    case 'PARTIALLY_REFUNDED':
      return (
        <Badge size='sm' variant='warning'>
          {getPaymentStatusLabel(status)}
        </Badge>
      );

    case 'FAILED':
      return (
        <Badge size='sm' variant='danger'>
          {getPaymentStatusLabel(status)}
        </Badge>
      );

    default:
      return (
        <Badge size='sm' variant='neutral'>
          {getPaymentStatusLabel(status)}
        </Badge>
      );
  }
}
