import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  CustomerOrderStatusFilter,
  FindCustomerOrdersQueryDto,
} from './dto/find-customer-orders.query.dto.js';

type CustomerOrderTimelineSource = {
  createdAt: Date;
  paidAt: Date | null;
  processingStartedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
};

@Injectable()
export class CustomerOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrders(customerUserId: string, query: FindCustomerOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const selectedStatus = query.status ?? CustomerOrderStatusFilter.ALL;
    const skip = (page - 1) * limit;

    const customerWhere: Prisma.OrderWhereInput = {
      customerUserId,
    };

    const where: Prisma.OrderWhereInput = {
      ...customerWhere,
      ...this.createStatusWhere(selectedStatus),
    };

    const [
      orders,
      total,
      allCount,
      pendingPaymentCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
    ] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
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

          status: true,
          paymentStatus: true,
          inventoryStatus: true,
          paymentMethodCode: true,
          currencyCode: true,

          payableToman: true,

          shippingCarrier: true,
          trackingCode: true,

          expiresAt: true,
          createdAt: true,
          paidAt: true,
          processingStartedAt: true,
          shippedAt: true,
          deliveredAt: true,
          cancelledAt: true,

          _count: {
            select: {
              items: true,
            },
          },

          items: {
            take: 3,
            orderBy: {
              createdAt: 'asc',
            },
            select: {
              id: true,
              productName: true,
              productImageUrl: true,
              quantity: true,
            },
          },
        },
      }),

      this.prisma.order.count({
        where,
      }),

      this.prisma.order.count({
        where: customerWhere,
      }),

      this.prisma.order.count({
        where: {
          ...customerWhere,
          status: OrderStatus.PENDING_PAYMENT,
        },
      }),

      this.prisma.order.count({
        where: {
          ...customerWhere,
          status: {
            in: [OrderStatus.PAID, OrderStatus.PROCESSING],
          },
        },
      }),

      this.prisma.order.count({
        where: {
          ...customerWhere,
          status: OrderStatus.SHIPPED,
        },
      }),

      this.prisma.order.count({
        where: {
          ...customerWhere,
          status: OrderStatus.DELIVERED,
        },
      }),

      this.prisma.order.count({
        where: {
          ...customerWhere,
          status: {
            in: [OrderStatus.CANCELLED, OrderStatus.EXPIRED],
          },
        },
      }),
    ]);

    return {
      data: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,

        status: order.status,
        paymentStatus: order.paymentStatus,
        inventoryStatus: order.inventoryStatus,
        paymentMethodCode: order.paymentMethodCode,
        currencyCode: order.currencyCode,

        payableToman: order.payableToman,

        shippingCarrier: order.shippingCarrier,
        trackingCode: order.trackingCode,

        itemCount: order._count.items,
        previewItems: order.items,

        expiresAt: order.expiresAt,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        processingStartedAt: order.processingStartedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
      })),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },

      statusCounts: {
        ALL: allCount,
        PENDING_PAYMENT: pendingPaymentCount,
        PROCESSING: processingCount,
        SHIPPED: shippedCount,
        DELIVERED: deliveredCount,
        CANCELLED: cancelledCount,
      },
    };
  }

  private createStatusWhere(selectedStatus: CustomerOrderStatusFilter): Prisma.OrderWhereInput {
    switch (selectedStatus) {
      case CustomerOrderStatusFilter.PENDING_PAYMENT:
        return {
          status: OrderStatus.PENDING_PAYMENT,
        };

      // PAID برای سازگاری با لینک‌ها یا درخواست‌های قدیمی نگه داشته شده است.
      // در رابط جدید، PAID و PROCESSING هر دو داخل تب «در حال پردازش» هستند.
      case CustomerOrderStatusFilter.PAID:
      case CustomerOrderStatusFilter.PROCESSING:
        return {
          status: {
            in: [OrderStatus.PAID, OrderStatus.PROCESSING],
          },
        };

      case CustomerOrderStatusFilter.SHIPPED:
        return {
          status: OrderStatus.SHIPPED,
        };

      case CustomerOrderStatusFilter.DELIVERED:
        return {
          status: OrderStatus.DELIVERED,
        };

      case CustomerOrderStatusFilter.CANCELLED:
        return {
          status: {
            in: [OrderStatus.CANCELLED, OrderStatus.EXPIRED],
          },
        };

      case CustomerOrderStatusFilter.ALL:
      default:
        return {};
    }
  }

  async findOrderById(customerUserId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerUserId,
      },
      select: {
        id: true,
        orderNumber: true,

        status: true,
        paymentStatus: true,
        inventoryStatus: true,
        paymentMethodCode: true,
        currencyCode: true,

        shippingRecipientFirstName: true,
        shippingRecipientLastName: true,
        shippingRecipientMobile: true,

        shippingProvince: true,
        shippingCity: true,
        shippingDistrict: true,
        shippingAddressLine: true,
        shippingPostalCode: true,
        shippingPlaque: true,
        shippingFloor: true,
        shippingUnit: true,
        shippingNotes: true,

        itemsBaseTotalToman: true,
        itemsDiscountToman: true,
        orderDiscountToman: true,
        shippingToman: true,
        payableToman: true,

        customerNote: true,

        expiresAt: true,
        paidAt: true,
        processingStartedAt: true,

        shippingCarrier: true,
        trackingCode: true,
        shipmentNote: true,
        shippedAt: true,
        deliveredAt: true,

        cancelledAt: true,

        createdAt: true,
        updatedAt: true,

        items: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,

            productId: true,
            productSku: true,
            productName: true,
            brandName: true,
            productImageUrl: true,

            fitmentStatus: true,
            fitmentNotes: true,

            quantity: true,

            unitBasePriceToman: true,
            unitEffectivePriceToman: true,

            lineBaseTotalToman: true,
            lineDiscountToman: true,
            linePayableToman: true,

            vehicleVariant: {
              select: {
                id: true,
                name: true,
                model: {
                  select: {
                    id: true,
                    name: true,
                    make: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      // عمدی: نباید مشخص شود سفارش متعلق به کاربر دیگری است.
      throw new NotFoundException('Order not found');
    }

    return {
      data: {
        id: order.id,
        orderNumber: order.orderNumber,

        status: order.status,
        paymentStatus: order.paymentStatus,
        inventoryStatus: order.inventoryStatus,
        paymentMethodCode: order.paymentMethodCode,
        currencyCode: order.currencyCode,

        shippingRecipientFirstName: order.shippingRecipientFirstName,
        shippingRecipientLastName: order.shippingRecipientLastName,
        shippingRecipientMobile: order.shippingRecipientMobile,

        shippingProvince: order.shippingProvince,
        shippingCity: order.shippingCity,
        shippingDistrict: order.shippingDistrict,
        shippingAddressLine: order.shippingAddressLine,
        shippingPostalCode: order.shippingPostalCode,
        shippingPlaque: order.shippingPlaque,
        shippingFloor: order.shippingFloor,
        shippingUnit: order.shippingUnit,
        shippingNotes: order.shippingNotes,

        itemsBaseTotalToman: order.itemsBaseTotalToman,
        itemsDiscountToman: order.itemsDiscountToman,
        orderDiscountToman: order.orderDiscountToman,
        shippingToman: order.shippingToman,
        payableToman: order.payableToman,

        customerNote: order.customerNote,

        expiresAt: order.expiresAt,
        paidAt: order.paidAt,
        processingStartedAt: order.processingStartedAt,

        shippingCarrier: order.shippingCarrier,
        trackingCode: order.trackingCode,
        shipmentNote: order.shipmentNote,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,

        cancelledAt: order.cancelledAt,

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        timeline: this.createTimeline(order),

        items: order.items.map(({ vehicleVariant, ...item }) => ({
          ...item,

          vehicle: vehicleVariant
            ? {
                id: vehicleVariant.id,
                makeName: vehicleVariant.model.make.name,
                modelName: vehicleVariant.model.name,
                variantName: vehicleVariant.name,
              }
            : null,
        })),
      },
    };
  }

  private createTimeline(order: CustomerOrderTimelineSource) {
    return [
      {
        code: 'ORDER_CREATED',
        occurredAt: order.createdAt,
      },

      ...(order.paidAt
        ? [
            {
              code: 'PAYMENT_CONFIRMED',
              occurredAt: order.paidAt,
            },
          ]
        : []),

      ...(order.processingStartedAt
        ? [
            {
              code: 'PROCESSING_STARTED',
              occurredAt: order.processingStartedAt,
            },
          ]
        : []),

      ...(order.shippedAt
        ? [
            {
              code: 'ORDER_SHIPPED',
              occurredAt: order.shippedAt,
            },
          ]
        : []),

      ...(order.deliveredAt
        ? [
            {
              code: 'ORDER_DELIVERED',
              occurredAt: order.deliveredAt,
            },
          ]
        : []),

      ...(order.cancelledAt
        ? [
            {
              code: 'ORDER_CANCELLED',
              occurredAt: order.cancelledAt,
            },
          ]
        : []),
    ];
  }
}
