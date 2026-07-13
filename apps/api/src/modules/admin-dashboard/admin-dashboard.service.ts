import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  OrderInventoryStatus,
  OrderPaymentStatus,
  OrderStatus,
  PaymentAttemptStatus,
  ProductStatus,
  StockStatus,
  UserRole,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  AdminDashboardRange,
  GetAdminDashboardQueryDto,
} from './dto/get-admin-dashboard-query.dto.js';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const RANGE_DAYS: Record<AdminDashboardRange, number> = {
  [AdminDashboardRange.LAST_7_DAYS]: 7,
  [AdminDashboardRange.LAST_30_DAYS]: 30,
  [AdminDashboardRange.LAST_90_DAYS]: 90,
};

const DASHBOARD_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
  OrderStatus.EXPIRED,
];

type DashboardTimeBoundaries = {
  todayStart: Date;
  tomorrowStart: Date;
  monthStart: Date;
};

type DashboardPaidOrder = {
  paidAt: Date | null;
  payableToman: number;
};

type DashboardCountRow = {
  count: number;
};

type DashboardInventoryAttentionReason = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'CHECK_AVAILABILITY';

type DashboardInventoryAttentionRow = {
  id: string;
  name: string;
  sku: string;
  stockStatus: StockStatus;
  stockQuantity: number;
  lowStockThreshold: number;
  updatedAt: Date;
  reason: DashboardInventoryAttentionReason;
};

@Injectable()
export class AdminDashboardService {
  private readonly timeZone: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.timeZone = configService.get<string>('DASHBOARD_TIME_ZONE')?.trim() || 'Asia/Tehran';
  }

  async getDashboard(query: GetAdminDashboardQueryDto) {
    const rangeKey = query.range ?? AdminDashboardRange.LAST_30_DAYS;

    const rangeDays = RANGE_DAYS[rangeKey];
    const now = new Date();

    const { todayStart, tomorrowStart, monthStart } = await this.getTimeBoundaries();

    /**
     * برای بازه ۷ روزه:
     * امروز + ۶ روز قبل
     */
    const rangeStart = new Date(todayStart.getTime() - (rangeDays - 1) * DAY_IN_MILLISECONDS);

    /**
     * بازه قبلی با طول زمانی مشابه بازه فعلی،
     * برای محاسبه درصد رشد.
     */
    const currentRangeDuration = Math.max(now.getTime() - rangeStart.getTime(), 1);

    const previousRangeEnd = rangeStart;

    const previousRangeStart = new Date(previousRangeEnd.getTime() - currentRangeDuration);

    const last24HoursStart = new Date(now.getTime() - DAY_IN_MILLISECONDS);

    const [
      todayRevenueResult,
      currentMonthRevenueResult,
      todayOrdersCount,
      actionableOrdersCount,
      customersCount,
      activeProductsCount,

      paidOrdersInRange,
      previousRangeResult,

      orderStatusRows,
      recentOrders,
      recentActivities,

      paidOrdersWaitingForProcessing,
      processingOrdersWaitingForShipment,
      failedPaymentsLast24Hours,
      reservedOrders,
      lowStockProductsResult,
      inventoryAttention,
      outOfStockProducts,
      checkAvailabilityProducts,
      unpublishedProducts,
    ] = await Promise.all([
      /**
       * فروش امروز
       */
      this.prisma.order.aggregate({
        where: {
          paymentStatus: OrderPaymentStatus.PAID,

          paidAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },

        _sum: {
          payableToman: true,
        },
      }),

      /**
       * فروش ماه جاری
       */
      this.prisma.order.aggregate({
        where: {
          paymentStatus: OrderPaymentStatus.PAID,

          paidAt: {
            gte: monthStart,
            lt: tomorrowStart,
          },
        },

        _sum: {
          payableToman: true,
        },
      }),

      /**
       * تمام سفارش‌های ثبت‌شده امروز
       */
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      }),

      /**
       * سفارش‌هایی که مدیر باید رسیدگی کند:
       *
       * - پرداخت‌شده و منتظر شروع آماده‌سازی
       * - در حال آماده‌سازی و منتظر ارسال
       */
      this.prisma.order.count({
        where: {
          paymentStatus: OrderPaymentStatus.PAID,

          status: {
            in: [OrderStatus.PAID, OrderStatus.PROCESSING],
          },
        },
      }),

      /**
       * تعداد مشتریان
       */
      this.prisma.user.count({
        where: {
          role: UserRole.CUSTOMER,
          isActive: true,
        },
      }),

      /**
       * محصولات فعال و منتشرشده
       */
      this.prisma.product.count({
        where: {
          status: ProductStatus.ACTIVE,
          isPublished: true,
        },
      }),

      /**
       * سفارش‌های پرداخت‌شده بازه انتخابی
       * برای ساخت نمودار و محاسبه فروش.
       */
      this.prisma.order.findMany({
        where: {
          paymentStatus: OrderPaymentStatus.PAID,

          paidAt: {
            gte: rangeStart,
            lte: now,
          },
        },

        orderBy: {
          paidAt: 'asc',
        },

        select: {
          paidAt: true,
          payableToman: true,
        },
      }),

      /**
       * بازه قبلی برای محاسبه درصد رشد
       */
      this.prisma.order.aggregate({
        where: {
          paymentStatus: OrderPaymentStatus.PAID,

          paidAt: {
            gte: previousRangeStart,
            lt: previousRangeEnd,
          },
        },

        _sum: {
          payableToman: true,
        },

        _count: {
          _all: true,
        },
      }),

      /**
       * تفکیک سفارش‌ها بر اساس وضعیت
       */
      this.prisma.order.groupBy({
        by: ['status'],

        _count: {
          _all: true,
        },
      }),

      /**
       * سفارش‌های اخیر
       */
      this.prisma.order.findMany({
        take: 8,

        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],

        select: {
          id: true,
          orderNumber: true,
          payableToman: true,
          currencyCode: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          paidAt: true,

          customerUser: {
            select: {
              id: true,
              mobile: true,
              firstName: true,
              lastName: true,
            },
          },

          _count: {
            select: {
              items: true,
            },
          },
        },
      }),

      /**
       * فعالیت‌های اخیر مدیران
       */
      this.prisma.adminAuditLog.findMany({
        take: 8,

        orderBy: {
          createdAt: 'desc',
        },

        select: {
          id: true,
          entityType: true,
          entityId: true,
          entityLabel: true,
          action: true,
          createdAt: true,

          actorUser: {
            select: {
              id: true,
              mobile: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),

      /**
       * سفارش پرداخت‌شده و منتظر آماده‌سازی
       */
      this.prisma.order.count({
        where: {
          status: OrderStatus.PAID,
          paymentStatus: OrderPaymentStatus.PAID,
        },
      }),

      /**
       * سفارش آماده‌سازی‌شده و منتظر ارسال
       */
      this.prisma.order.count({
        where: {
          status: OrderStatus.PROCESSING,
          paymentStatus: OrderPaymentStatus.PAID,
        },
      }),

      /**
       * پرداخت‌های ناموفق ۲۴ ساعت اخیر
       */
      this.prisma.paymentAttempt.count({
        where: {
          status: PaymentAttemptStatus.FAILED,

          updatedAt: {
            gte: last24HoursStart,
          },
        },
      }),

      /**
       * سفارش‌هایی که موجودی آن‌ها برای پرداخت رزرو شده است.
       */
      this.prisma.order.count({
        where: {
          inventoryStatus: OrderInventoryStatus.RESERVED,
        },
      }),

      /**
       * محصولات کم‌موجود واقعی؛ یعنی محصول فعال و منتشرشده‌ای که
       * موجودی آن بیشتر از صفر و کمتر یا مساوی آستانه هشدار است.
       * مقایسه دو ستون با SQL انجام می‌شود.
       */
      this.prisma.$queryRaw<DashboardCountRow[]>`
        SELECT COUNT(*)::integer AS "count"
        FROM "Product"
        WHERE "status" = 'ACTIVE'
          AND "isPublished" = true
          AND "stockStatus" = 'IN_STOCK'
          AND "stockQuantity" > 0
          AND "stockQuantity" <= "lowStockThreshold"
      `,

      /**
       * مهم‌ترین محصولات نیازمند توجه انبار.
       */
      this.prisma.$queryRaw<DashboardInventoryAttentionRow[]>`
        SELECT
          "id",
          "name",
          "sku",
          "stockStatus"::text AS "stockStatus",
          "stockQuantity",
          "lowStockThreshold",
          "updatedAt",
          CASE
            WHEN "stockStatus" = 'OUT_OF_STOCK' THEN 'OUT_OF_STOCK'
            WHEN "stockStatus" = 'IN_STOCK'
              AND "stockQuantity" > 0
              AND "stockQuantity" <= "lowStockThreshold" THEN 'LOW_STOCK'
            ELSE 'CHECK_AVAILABILITY'
          END AS "reason"
        FROM "Product"
        WHERE "status" = 'ACTIVE'
          AND "isPublished" = true
          AND (
            "stockStatus" = 'OUT_OF_STOCK'
            OR "stockStatus" = 'CHECK_AVAILABILITY'
            OR (
              "stockStatus" = 'IN_STOCK'
              AND "stockQuantity" > 0
              AND "stockQuantity" <= "lowStockThreshold"
            )
          )
        ORDER BY
          CASE
            WHEN "stockStatus" = 'OUT_OF_STOCK' THEN 1
            WHEN "stockStatus" = 'IN_STOCK'
              AND "stockQuantity" > 0
              AND "stockQuantity" <= "lowStockThreshold" THEN 2
            ELSE 3
          END,
          "stockQuantity" ASC,
          "updatedAt" DESC
        LIMIT 8
      `,

      /**
       * محصولات ناموجود
       */
      this.prisma.product.count({
        where: {
          status: ProductStatus.ACTIVE,
          isPublished: true,

          stockStatus: StockStatus.OUT_OF_STOCK,
        },
      }),

      /**
       * محصولات نیازمند استعلام موجودی
       */
      this.prisma.product.count({
        where: {
          status: ProductStatus.ACTIVE,
          isPublished: true,

          stockStatus: StockStatus.CHECK_AVAILABILITY,
        },
      }),

      /**
       * محصولات منتشرنشده، به‌جز آرشیوی‌ها
       */
      this.prisma.product.count({
        where: {
          status: {
            not: ProductStatus.ARCHIVED,
          },

          isPublished: false,
        },
      }),
    ]);

    const lowStockProducts = lowStockProductsResult[0]?.count ?? 0;

    const rangeRevenueToman = paidOrdersInRange.reduce(
      (total, order) => total + order.payableToman,
      0,
    );

    const rangeOrdersCount = paidOrdersInRange.length;

    const previousRevenueToman = previousRangeResult._sum.payableToman ?? 0;

    const previousOrdersCount = previousRangeResult._count._all;

    const statusCountMap = new Map(orderStatusRows.map((row) => [row.status, row._count._all]));

    return {
      data: {
        generatedAt: now,
        timeZone: this.timeZone,

        range: {
          key: rangeKey,
          days: rangeDays,
          from: rangeStart,
          to: now,
        },

        summary: {
          todayRevenueToman: todayRevenueResult._sum.payableToman ?? 0,

          currentMonthRevenueToman: currentMonthRevenueResult._sum.payableToman ?? 0,

          todayOrdersCount,
          actionableOrdersCount,
          customersCount,
          activeProductsCount,

          rangeRevenueToman,
          rangeOrdersCount,

          revenueChangePercent: this.calculateChangePercent(
            rangeRevenueToman,
            previousRevenueToman,
          ),

          ordersChangePercent: this.calculateChangePercent(rangeOrdersCount, previousOrdersCount),
        },

        salesChart: this.buildSalesChart({
          rangeStart,
          rangeDays,
          paidOrders: paidOrdersInRange,
        }),

        orderStatusBreakdown: DASHBOARD_ORDER_STATUSES.map((status) => ({
          status,
          count: statusCountMap.get(status) ?? 0,
        })),

        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,

          payableToman: order.payableToman,

          currencyCode: order.currencyCode,

          status: order.status,

          paymentStatus: order.paymentStatus,

          itemsCount: order._count.items,

          createdAt: order.createdAt,

          paidAt: order.paidAt,

          customer: {
            id: order.customerUser.id,

            fullName: this.getFullName(order.customerUser.firstName, order.customerUser.lastName),

            mobile: order.customerUser.mobile,
          },
        })),

        alerts: {
          paidOrdersWaitingForProcessing,
          processingOrdersWaitingForShipment,
          failedPaymentsLast24Hours,
          reservedOrders,
          lowStockProducts,
          outOfStockProducts,
          checkAvailabilityProducts,
          unpublishedProducts,
        },

        inventoryAttention: inventoryAttention.map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          stockStatus: item.stockStatus,
          stockQuantity: item.stockQuantity,
          lowStockThreshold: item.lowStockThreshold,
          updatedAt: item.updatedAt,
          reason: item.reason,
        })),

        recentActivities: recentActivities.map((activity) => ({
          id: activity.id,
          entityType: activity.entityType,
          entityId: activity.entityId,
          entityLabel: activity.entityLabel,
          action: activity.action,
          createdAt: activity.createdAt,

          actor: {
            id: activity.actorUser.id,

            fullName: this.getFullName(activity.actorUser.firstName, activity.actorUser.lastName),

            mobile: activity.actorUser.mobile,

            role: activity.actorUser.role,
          },
        })),
      },
    };
  }

  /**
   * شروع روز، روز بعد و ماه جاری را
   * با منطقه زمانی فروشگاه از PostgreSQL می‌گیرد.
   *
   * این کار مانع از اشتباه‌شدن «امروز» روی
   * سرورهایی می‌شود که timezone آن‌ها UTC است.
   */
  private async getTimeBoundaries(): Promise<DashboardTimeBoundaries> {
    const rows = await this.prisma.$queryRaw<DashboardTimeBoundaries[]>`
        SELECT
          (
            date_trunc(
              'day',
              CURRENT_TIMESTAMP AT TIME ZONE ${this.timeZone}
            )
            AT TIME ZONE ${this.timeZone}
          ) AS "todayStart",

          (
            (
              date_trunc(
                'day',
                CURRENT_TIMESTAMP AT TIME ZONE ${this.timeZone}
              )
              + INTERVAL '1 day'
            )
            AT TIME ZONE ${this.timeZone}
          ) AS "tomorrowStart",

          (
            date_trunc(
              'month',
              CURRENT_TIMESTAMP AT TIME ZONE ${this.timeZone}
            )
            AT TIME ZONE ${this.timeZone}
          ) AS "monthStart"
      `;

    const boundaries = rows[0];

    if (!boundaries) {
      throw new InternalServerErrorException('Dashboard time boundaries could not be calculated');
    }

    return boundaries;
  }

  private buildSalesChart(input: {
    rangeStart: Date;
    rangeDays: number;
    paidOrders: DashboardPaidOrder[];
  }) {
    const buckets = new Map<
      string,
      {
        date: string;
        revenueToman: number;
        ordersCount: number;
      }
    >();

    for (let dayIndex = 0; dayIndex < input.rangeDays; dayIndex += 1) {
      const day = new Date(input.rangeStart.getTime() + dayIndex * DAY_IN_MILLISECONDS);

      const dateKey = this.formatDateKey(day);

      buckets.set(dateKey, {
        date: dateKey,
        revenueToman: 0,
        ordersCount: 0,
      });
    }

    for (const order of input.paidOrders) {
      if (!order.paidAt) {
        continue;
      }

      const dateKey = this.formatDateKey(order.paidAt);

      const bucket = buckets.get(dateKey);

      if (!bucket) {
        continue;
      }

      bucket.revenueToman += order.payableToman;

      bucket.ordersCount += 1;
    }

    return Array.from(buckets.values());
  }

  private formatDateKey(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-gregory', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);

    const values = new Map(parts.map((part) => [part.type, part.value]));

    return [values.get('year'), values.get('month'), values.get('day')].join('-');
  }

  private calculateChangePercent(currentValue: number, previousValue: number): number | null {
    if (previousValue === 0) {
      return currentValue === 0 ? 0 : null;
    }

    const change = ((currentValue - previousValue) / previousValue) * 100;

    return Number(change.toFixed(1));
  }

  private getFullName(firstName: string | null, lastName: string | null): string {
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return fullName || 'کاربر بدون نام';
  }
}
