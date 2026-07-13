import type {
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from '@/lib/admin/orders/admin-order.types';

export type AdminDashboardRange = '7d' | '30d' | '90d';

export type AdminDashboardSummary = {
  todayRevenueToman: number;
  currentMonthRevenueToman: number;

  todayOrdersCount: number;
  actionableOrdersCount: number;

  customersCount: number;
  activeProductsCount: number;

  rangeRevenueToman: number;
  rangeOrdersCount: number;

  revenueChangePercent: number | null;
  ordersChangePercent: number | null;
};

export type AdminDashboardSalesChartItem = {
  date: string;
  revenueToman: number;
  ordersCount: number;
};

export type AdminDashboardOrderStatusItem = {
  status: AdminOrderStatus;
  count: number;
};

export type AdminDashboardRecentOrder = {
  id: string;
  orderNumber: number;

  payableToman: number;
  currencyCode: string;

  status: AdminOrderStatus;
  paymentStatus: AdminOrderPaymentStatus;

  itemsCount: number;

  createdAt: string;
  paidAt: string | null;

  customer: {
    id: string;
    fullName: string;
    mobile: string;
  };
};

export type AdminDashboardAlerts = {
  paidOrdersWaitingForProcessing: number;
  processingOrdersWaitingForShipment: number;
  failedPaymentsLast24Hours: number;
  reservedOrders: number;

  lowStockProducts: number;
  outOfStockProducts: number;
  checkAvailabilityProducts: number;
  unpublishedProducts: number;
};

export type AdminDashboardInventoryAttentionReason =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'CHECK_AVAILABILITY';

export type AdminDashboardInventoryAttentionItem = {
  id: string;
  name: string;
  sku: string;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'CHECK_AVAILABILITY';
  stockQuantity: number;
  lowStockThreshold: number;
  updatedAt: string;
  reason: AdminDashboardInventoryAttentionReason;
};

export type AdminDashboardActivity = {
  id: string;

  entityType: string;
  entityId: string;
  entityLabel: string | null;

  action: string;
  createdAt: string;

  actor: {
    id: string;
    fullName: string;
    mobile: string;
    role: string;
  };
};

export type AdminDashboardData = {
  generatedAt: string;
  timeZone: string;

  range: {
    key: AdminDashboardRange;
    days: number;
    from: string;
    to: string;
  };

  summary: AdminDashboardSummary;

  salesChart: AdminDashboardSalesChartItem[];

  orderStatusBreakdown: AdminDashboardOrderStatusItem[];

  recentOrders: AdminDashboardRecentOrder[];

  alerts: AdminDashboardAlerts;

  inventoryAttention: AdminDashboardInventoryAttentionItem[];

  recentActivities: AdminDashboardActivity[];
};

export type AdminDashboardResponse = {
  data: AdminDashboardData;
};
