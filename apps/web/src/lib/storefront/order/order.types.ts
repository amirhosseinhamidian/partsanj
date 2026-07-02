export type StorefrontOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type StorefrontOrderPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type StorefrontOrderItemFitmentStatus =
  | 'NOT_SELECTED'
  | 'CONFIRMED'
  | 'REQUIRES_VERIFICATION'
  | 'NOT_CONFIRMED';

export type CreateOrderFromCartInput = {
  shippingAddressId: string;
  customerNote?: string | null;
};

export type StorefrontCreatedOrder = {
  id: string;
  orderNumber: number;
  status: StorefrontOrderStatus;
  paymentStatus: StorefrontOrderPaymentStatus;
  paymentMethodCode: string;
  currencyCode: string;
  payableToman: number;
  itemCount: number;
  createdAt: string;
};

export type StorefrontOrderItem = {
  id: string;
  productId: string;
  vehicleVariantId: string | null;

  productSku: string;
  productName: string;
  brandName: string;
  productImageUrl: string | null;

  vehicleSnapshot: Record<string, unknown> | null;

  fitmentStatus: StorefrontOrderItemFitmentStatus;
  fitmentNotes: string | null;

  quantity: number;

  unitBasePriceToman: number;
  unitEffectivePriceToman: number;

  lineBaseTotalToman: number;
  lineDiscountToman: number;
  linePayableToman: number;
};

export type StorefrontOrderDetail = {
  id: string;
  orderNumber: number;
  status: StorefrontOrderStatus;
  paymentStatus: StorefrontOrderPaymentStatus;
  paymentMethodCode: string;
  currencyCode: string;

  itemsBaseTotalToman: number;
  itemsDiscountToman: number;
  orderDiscountToman: number;
  shippingToman: number;
  payableToman: number;

  shippingRecipientFirstName: string;
  shippingRecipientLastName: string;
  shippingRecipientMobile: string;

  shippingProvince: string;
  shippingCity: string;
  shippingDistrict: string | null;
  shippingAddressLine: string;
  shippingPostalCode: string;
  shippingPlaque: string | null;
  shippingFloor: string | null;
  shippingUnit: string | null;
  shippingNotes: string | null;

  customerNote: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;

  items: StorefrontOrderItem[];
};

export type OrderApiResponse<T> = {
  data: T;
};
