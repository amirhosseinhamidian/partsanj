export type AdminOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type AdminOrderPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type AdminPaymentAttemptStatus =
  | 'CREATED'
  | 'REDIRECTED'
  | 'CALLBACK_RECEIVED'
  | 'VERIFIED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type AdminOrderFitmentStatus =
  | 'NOT_SELECTED'
  | 'CONFIRMED'
  | 'REQUIRES_VERIFICATION'
  | 'NOT_CONFIRMED';

export type AdminOrderCustomer = {
  id: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
};

export type AdminOrderPaymentAttemptSummary = {
  id: string;
  attemptNumber: number;
  providerCode: string;
  status: AdminPaymentAttemptStatus;
  amountToman: number;
  providerReferenceId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: string;
  verifiedAt: string | null;
  failedAt: string | null;
};

export type AdminOrderListItem = {
  id: string;
  orderNumber: number;

  status: AdminOrderStatus;
  paymentStatus: AdminOrderPaymentStatus;

  paymentMethodCode: string;
  currencyCode: string;
  payableToman: number;

  shippingCarrier: string | null;
  trackingCode: string | null;

  expiresAt: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;

  customerUser: AdminOrderCustomer;

  _count: {
    items: number;
    paymentAttempts: number;
  };

  latestPaymentAttempt: AdminOrderPaymentAttemptSummary | null;
};

export type AdminOrderItem = {
  id: string;

  productId: string;
  productSku: string;
  productName: string;
  brandName: string;
  productImageUrl: string | null;

  vehicleVariantId: string | null;
  vehicleSnapshot: unknown;

  fitmentStatus: AdminOrderFitmentStatus;
  fitmentNotes: string | null;

  quantity: number;

  unitBasePriceToman: number;
  unitEffectivePriceToman: number;

  lineBaseTotalToman: number;
  lineDiscountToman: number;
  linePayableToman: number;

  createdAt: string;

  product: {
    id: string;
    sku: string;
    slug: string;
    name: string;
  };

  vehicleVariant: {
    id: string;
    name: string;
    slug: string;
    engineCode: string | null;
    engineName: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    yearCalendar: string;
    model: {
      id: string;
      name: string;
      slug: string;
      make: {
        id: string;
        name: string;
        slug: string;
      };
    };
  } | null;
};

export type AdminOrderPaymentAttempt = {
  id: string;
  attemptNumber: number;

  providerCode: string;
  status: AdminPaymentAttemptStatus;
  amountToman: number;

  providerSessionId: string | null;
  providerTransactionId: string | null;
  providerReference: string | null;
  providerReferenceId: string | null;

  maskedCardNumber: string | null;
  providerCardPan: string | null;
  providerCardHash: string | null;

  failureCode: string | null;
  failureMessage: string | null;

  requestMetadata: unknown;
  responseMetadata: unknown;
  callbackPayload: unknown;
  verificationPayload: unknown;

  redirectedAt: string | null;
  callbackReceivedAt: string | null;
  verifiedAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;
};

export type AdminOrderAuditLog = {
  id: string;
  action: string;
  changes: unknown;
  createdAt: string;
  actorUser: {
    id: string;
    mobile: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: number;

  status: AdminOrderStatus;
  paymentStatus: AdminOrderPaymentStatus;
  paymentMethodCode: string;
  currencyCode: string;

  sourceCartId: string;
  shippingAddressId: string | null;

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
  adminNote: string | null;

  expiresAt: string | null;
  paidAt: string | null;

  shippingCarrier: string | null;
  trackingCode: string | null;
  shipmentNote: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;

  cancelledAt: string | null;
  cancellationReason: string | null;

  createdAt: string;
  updatedAt: string;

  customerUser: AdminOrderCustomer;
  items: AdminOrderItem[];
  paymentAttempts: AdminOrderPaymentAttempt[];
  auditLogs: AdminOrderAuditLog[];
};

export type AdminOrdersMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FindAdminOrdersInput = {
  q?: string;
  status?: AdminOrderStatus;
  paymentStatus?: AdminOrderPaymentStatus;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
};

export type MarkOrderShippedInput = {
  shippingCarrier: string;
  trackingCode: string;
  shipmentNote?: string;
};

export type CancelAdminOrderInput = {
  cancellationReason: string;
};

export type AdminOrdersListResponse = {
  data: AdminOrderListItem[];
  meta: AdminOrdersMeta;
};

export type AdminOrderResponse = {
  data: AdminOrderDetail;
};
