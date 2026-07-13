export type CustomerOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type CustomerOrderStatusFilter =
  | 'ALL'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type CustomerOrderPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type CustomerOrderInventoryStatus = 'NOT_RESERVED' | 'RESERVED' | 'COMMITTED' | 'RELEASED';

export type CustomerOrderTimelineCode =
  | 'ORDER_CREATED'
  | 'PAYMENT_CONFIRMED'
  | 'PROCESSING_STARTED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED';

export type CustomerOrderStatusTab =
  | 'ALL'
  | 'PENDING_PAYMENT'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type CustomerOrderStatusCounts = {
  ALL: number;
  PENDING_PAYMENT: number;
  PROCESSING: number;
  SHIPPED: number;
  DELIVERED: number;
  CANCELLED: number;
};

export type CustomerOrderTimelineItem = {
  code: CustomerOrderTimelineCode;
  occurredAt: string;
};

export type CustomerOrderPreviewItem = {
  id: string;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
};

export type CustomerOrderVehicle = {
  id: string;
  makeName: string;
  modelName: string;
  variantName: string;
};

export type CustomerOrderItem = {
  id: string;

  productId: string;
  productSku: string;
  productName: string;
  brandName: string;
  productImageUrl: string | null;

  fitmentStatus: 'NOT_SELECTED' | 'CONFIRMED' | 'REQUIRES_VERIFICATION' | 'NOT_CONFIRMED';

  fitmentNotes: string | null;
  vehicle: CustomerOrderVehicle | null;

  quantity: number;

  unitBasePriceToman: number;
  unitEffectivePriceToman: number;

  lineBaseTotalToman: number;
  lineDiscountToman: number;
  linePayableToman: number;
};

export type CustomerOrderListItem = {
  id: string;
  orderNumber: number;

  status: CustomerOrderStatus;
  paymentStatus: CustomerOrderPaymentStatus;
  inventoryStatus: CustomerOrderInventoryStatus;

  paymentMethodCode: string;
  currencyCode: string;

  payableToman: number;

  shippingCarrier: string | null;
  trackingCode: string | null;

  itemCount: number;
  previewItems: CustomerOrderPreviewItem[];

  expiresAt: string | null;
  createdAt: string;
  paidAt: string | null;
  processingStartedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
};

export type CustomerOrderListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CustomerOrdersListResponse = {
  data: CustomerOrderListItem[];
  meta: CustomerOrderListMeta;
  statusCounts: CustomerOrderStatusCounts;
};

export type CustomerOrderDetail = {
  id: string;
  orderNumber: number;

  status: CustomerOrderStatus;
  paymentStatus: CustomerOrderPaymentStatus;
  inventoryStatus: CustomerOrderInventoryStatus;

  paymentMethodCode: string;
  currencyCode: string;

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

  itemsBaseTotalToman: number;
  itemsDiscountToman: number;
  orderDiscountToman: number;
  shippingToman: number;
  payableToman: number;

  customerNote: string | null;

  expiresAt: string | null;
  paidAt: string | null;
  processingStartedAt: string | null;

  shippingCarrier: string | null;
  trackingCode: string | null;
  shipmentNote: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;

  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;

  timeline: CustomerOrderTimelineItem[];
  items: CustomerOrderItem[];
};

export type CustomerOrderDetailResponse = {
  data: CustomerOrderDetail;
};

export type FindCustomerOrdersInput = {
  page?: number;
  limit?: number;
  status?: CustomerOrderStatusFilter;
};
