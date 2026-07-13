import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditEntityType,
  OrderInventoryStatus,
  OrderPaymentStatus,
  OrderStatus,
  Prisma,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { releaseOrderInventory } from '../order/order-inventory.utils.js';
import { CancelAdminOrderDto } from './dto/cancel-admin-order.dto.js';
import { FindAdminOrdersQueryDto } from './dto/find-admin-orders.query.dto.js';
import { MarkOrderShippedDto } from './dto/mark-order-shipped.dto.js';

type OrderMutationRecord = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  inventoryStatus: OrderInventoryStatus;

  shippingCarrier: string | null;
  trackingCode: string | null;
  shipmentNote: string | null;

  shippedAt: Date | null;
  deliveredAt: Date | null;
  processingStartedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
};

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrders(query: FindAdminOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    const createdFrom = query.createdFrom ? new Date(query.createdFrom) : undefined;

    const createdTo = query.createdTo ? new Date(query.createdTo) : undefined;

    if (createdFrom && createdTo && createdFrom.getTime() > createdTo.getTime()) {
      throw new BadRequestException('createdFrom cannot be greater than createdTo');
    }

    const where: Prisma.OrderWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.paymentStatus && {
        paymentStatus: query.paymentStatus,
      }),

      ...((createdFrom || createdTo) && {
        createdAt: {
          ...(createdFrom && {
            gte: createdFrom,
          }),
          ...(createdTo && {
            lte: createdTo,
          }),
        },
      }),
    };

    const search = query.q?.trim();

    if (search) {
      const orderNumber = this.parseOrderNumber(search);

      where.OR = [
        ...(orderNumber
          ? [
              {
                orderNumber,
              },
            ]
          : []),

        {
          customerUser: {
            is: {
              mobile: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },

        {
          customerUser: {
            is: {
              firstName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },

        {
          customerUser: {
            is: {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    const [orders, total] = await this.prisma.$transaction([
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
          paidAt: true,
          shippedAt: true,
          deliveredAt: true,
          cancelledAt: true,

          createdAt: true,
          updatedAt: true,

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
              paymentAttempts: true,
            },
          },

          paymentAttempts: {
            take: 1,
            orderBy: {
              attemptNumber: 'desc',
            },
            select: {
              id: true,
              attemptNumber: true,
              providerCode: true,
              status: true,
              amountToman: true,
              providerReferenceId: true,
              failureCode: true,
              failureMessage: true,
              createdAt: true,
              verifiedAt: true,
              failedAt: true,
            },
          },
        },
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      data: orders.map(({ paymentAttempts, ...order }) => ({
        ...order,
        latestPaymentAttempt: paymentAttempts[0] ?? null,
      })),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOrderById(orderId: string) {
    const [order, auditLogs] = await this.prisma.$transaction([
      this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          orderNumber: true,

          status: true,
          paymentStatus: true,
          paymentMethodCode: true,
          currencyCode: true,

          sourceCartId: true,

          shippingAddressId: true,

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
          adminNote: true,

          inventoryStatus: true,
          inventoryReservedAt: true,
          inventoryCommittedAt: true,
          inventoryReleasedAt: true,

          expiresAt: true,
          paidAt: true,
          processingStartedAt: true,
          shippingCarrier: true,
          trackingCode: true,
          shipmentNote: true,
          shippedAt: true,
          deliveredAt: true,

          cancelledAt: true,
          cancellationReason: true,

          createdAt: true,
          updatedAt: true,

          customerUser: {
            select: {
              id: true,
              mobile: true,
              firstName: true,
              lastName: true,
            },
          },

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

              vehicleVariantId: true,
              vehicleSnapshot: true,

              fitmentStatus: true,
              fitmentNotes: true,

              quantity: true,

              unitBasePriceToman: true,
              unitEffectivePriceToman: true,

              lineBaseTotalToman: true,
              lineDiscountToman: true,
              linePayableToman: true,

              createdAt: true,

              product: {
                select: {
                  id: true,
                  sku: true,
                  slug: true,
                  name: true,
                },
              },

              vehicleVariant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  engineCode: true,
                  engineName: true,
                  yearFrom: true,
                  yearTo: true,
                  yearCalendar: true,
                  model: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      make: {
                        select: {
                          id: true,
                          name: true,
                          slug: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          paymentAttempts: {
            orderBy: {
              attemptNumber: 'asc',
            },
            select: {
              id: true,
              attemptNumber: true,

              providerCode: true,
              status: true,
              amountToman: true,

              providerSessionId: true,
              providerTransactionId: true,
              providerReference: true,
              providerReferenceId: true,

              maskedCardNumber: true,
              providerCardPan: true,
              providerCardHash: true,

              failureCode: true,
              failureMessage: true,

              requestMetadata: true,
              responseMetadata: true,
              callbackPayload: true,
              verificationPayload: true,

              redirectedAt: true,
              callbackReceivedAt: true,
              verifiedAt: true,
              failedAt: true,
              cancelledAt: true,

              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),

      this.prisma.adminAuditLog.findMany({
        where: {
          entityType: AdminAuditEntityType.ORDER,
          entityId: orderId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
        select: {
          id: true,
          action: true,
          changes: true,
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
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      data: {
        ...order,
        auditLogs,
      },
    };
  }

  async markProcessing(orderId: string, actorUserId: string) {
    await this.prisma.$transaction(async (transaction) => {
      const order = await this.findOrderForMutation(transaction, orderId);

      this.assertProcessingTransition(order);

      const now = new Date();

      const result = await transaction.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PAID,
          paymentStatus: OrderPaymentStatus.PAID,
        },
        data: {
          status: OrderStatus.PROCESSING,
          processingStartedAt: now,
        },
      });

      this.assertSingleMutation(result.count);

      await this.writeAuditLog(transaction, {
        actorUserId,
        order,
        action: AdminAuditAction.ORDER_STATUS_UPDATED,
        changes: {
          event: 'admin_order_processing_started',
          fields: {
            status: {
              before: OrderStatus.PAID,
              after: OrderStatus.PROCESSING,
            },

            processingStartedAt: {
              before: order.processingStartedAt,
              after: now,
            },
          },
        },
      });
    });

    return this.findOrderById(orderId);
  }

  async markShipped(orderId: string, dto: MarkOrderShippedDto, actorUserId: string) {
    await this.prisma.$transaction(async (transaction) => {
      const order = await this.findOrderForMutation(transaction, orderId);

      this.assertShipmentTransition(order);

      const now = new Date();

      const result = await transaction.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PROCESSING,
          paymentStatus: OrderPaymentStatus.PAID,
        },
        data: {
          status: OrderStatus.SHIPPED,

          shippingCarrier: dto.shippingCarrier,
          trackingCode: dto.trackingCode,
          shipmentNote: dto.shipmentNote ?? null,

          shippedAt: now,
        },
      });

      this.assertSingleMutation(result.count);

      await this.writeAuditLog(transaction, {
        actorUserId,
        order,
        action: AdminAuditAction.ORDER_SHIPMENT_UPDATED,
        changes: {
          event: 'admin_order_shipment_registered',
          fields: {
            status: {
              before: OrderStatus.PROCESSING,
              after: OrderStatus.SHIPPED,
            },

            shippingCarrier: {
              before: order.shippingCarrier,
              after: dto.shippingCarrier,
            },

            trackingCode: {
              before: order.trackingCode,
              after: dto.trackingCode,
            },

            shipmentNote: {
              before: order.shipmentNote,
              after: dto.shipmentNote ?? null,
            },

            shippedAt: {
              before: order.shippedAt,
              after: now,
            },
          },
        },
      });
    });

    return this.findOrderById(orderId);
  }

  async markDelivered(orderId: string, actorUserId: string) {
    await this.prisma.$transaction(async (transaction) => {
      const order = await this.findOrderForMutation(transaction, orderId);

      this.assertDeliveryTransition(order);

      const now = new Date();

      const result = await transaction.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.SHIPPED,
          paymentStatus: OrderPaymentStatus.PAID,
        },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt: now,
        },
      });

      this.assertSingleMutation(result.count);

      await this.writeAuditLog(transaction, {
        actorUserId,
        order,
        action: AdminAuditAction.ORDER_STATUS_UPDATED,
        changes: {
          event: 'admin_order_delivered',
          fields: {
            status: {
              before: OrderStatus.SHIPPED,
              after: OrderStatus.DELIVERED,
            },

            deliveredAt: {
              before: order.deliveredAt,
              after: now,
            },
          },
        },
      });
    });

    return this.findOrderById(orderId);
  }

  async cancelOrder(orderId: string, dto: CancelAdminOrderDto, actorUserId: string) {
    await this.prisma.$transaction(async (transaction) => {
      const order = await this.findOrderForMutation(transaction, orderId);

      this.assertCancellationTransition(order);

      const now = new Date();

      const result = await transaction.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: {
            in: [OrderPaymentStatus.UNPAID, OrderPaymentStatus.FAILED],
          },
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: now,
          cancellationReason: dto.cancellationReason,
        },
      });

      this.assertSingleMutation(result.count);

      const inventoryReleased = await releaseOrderInventory(transaction, order.id, now);

      await this.writeAuditLog(transaction, {
        actorUserId,
        order,
        action: AdminAuditAction.ORDER_CANCELLED,
        changes: {
          event: 'admin_order_cancelled',
          fields: {
            status: {
              before: OrderStatus.PENDING_PAYMENT,
              after: OrderStatus.CANCELLED,
            },

            inventoryStatus: {
              before: order.inventoryStatus,
              after: inventoryReleased ? OrderInventoryStatus.RELEASED : order.inventoryStatus,
            },

            cancelledAt: {
              before: order.cancelledAt,
              after: now,
            },

            cancellationReason: {
              before: order.cancellationReason,
              after: dto.cancellationReason,
            },
          },
        },
      });
    });

    return this.findOrderById(orderId);
  }

  private async findOrderForMutation(
    transaction: Prisma.TransactionClient,
    orderId: string,
  ): Promise<OrderMutationRecord> {
    const order = await transaction.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,

        status: true,
        paymentStatus: true,
        inventoryStatus: true,
        processingStartedAt: true,

        shippingCarrier: true,
        trackingCode: true,
        shipmentNote: true,

        shippedAt: true,
        deliveredAt: true,

        cancelledAt: true,
        cancellationReason: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private assertProcessingTransition(order: OrderMutationRecord) {
    if (
      order.status !== OrderStatus.PAID ||
      order.paymentStatus !== OrderPaymentStatus.PAID ||
      order.inventoryStatus !== OrderInventoryStatus.COMMITTED
    ) {
      throw new ConflictException({
        code: 'ORDER_PROCESSING_TRANSITION_INVALID',
        message: 'فقط سفارش پرداخت‌شده می‌تواند وارد مرحله آماده‌سازی شود',
      });
    }
  }

  private assertShipmentTransition(order: OrderMutationRecord) {
    if (
      order.status !== OrderStatus.PROCESSING ||
      order.paymentStatus !== OrderPaymentStatus.PAID ||
      order.inventoryStatus !== OrderInventoryStatus.COMMITTED
    ) {
      throw new ConflictException({
        code: 'ORDER_SHIPMENT_TRANSITION_INVALID',
        message: 'فقط سفارش در حال آماده‌سازی می‌تواند ارسال شود',
      });
    }
  }

  private assertDeliveryTransition(order: OrderMutationRecord) {
    if (
      order.status !== OrderStatus.SHIPPED ||
      order.paymentStatus !== OrderPaymentStatus.PAID ||
      order.inventoryStatus !== OrderInventoryStatus.COMMITTED
    ) {
      throw new ConflictException({
        code: 'ORDER_DELIVERY_TRANSITION_INVALID',
        message: 'فقط سفارش ارسال‌شده می‌تواند تحویل‌شده ثبت شود',
      });
    }
  }

  private assertCancellationTransition(order: OrderMutationRecord) {
    const canCancelPaymentStatus =
      order.paymentStatus === OrderPaymentStatus.UNPAID ||
      order.paymentStatus === OrderPaymentStatus.FAILED;

    if (order.status !== OrderStatus.PENDING_PAYMENT || !canCancelPaymentStatus) {
      throw new ConflictException({
        code: 'ORDER_CANCELLATION_TRANSITION_INVALID',
        message: 'فقط سفارش پرداخت‌نشده یا پرداخت ناموفق قابل لغو است',
      });
    }
  }

  private assertSingleMutation(count: number) {
    if (count !== 1) {
      throw new ConflictException({
        code: 'ORDER_STATE_CHANGED',
        message: 'وضعیت سفارش هم‌زمان تغییر کرده است، صفحه را تازه‌سازی کنید',
      });
    }
  }

  private async writeAuditLog(
    transaction: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      order: OrderMutationRecord;
      action: AdminAuditAction;
      changes: unknown;
    },
  ) {
    await transaction.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,

        entityType: AdminAuditEntityType.ORDER,
        entityId: input.order.id,
        entityLabel: `Order #${input.order.orderNumber}`,

        action: input.action,
        changes: this.toJson(input.changes),
      },
    });
  }

  private parseOrderNumber(value: string): number | null {
    const normalized = value.trim().replace(/^ps-/i, '');

    if (!/^\d+$/.test(normalized)) {
      return null;
    }

    const orderNumber = Number(normalized);

    if (!Number.isSafeInteger(orderNumber) || orderNumber < 1) {
      return null;
    }

    return orderNumber;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new BadRequestException('Value cannot be converted to JSON');
    }

    return JSON.parse(serialized) as Prisma.InputJsonValue;
  }
}
