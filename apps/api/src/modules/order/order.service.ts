import { randomInt } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CartOwnerType,
  CartStatus,
  OrderInventoryStatus,
  OrderItemFitmentStatus,
  OrderPaymentStatus,
  OrderStatus,
  Prisma,
  ProductStatus,
  StockStatus,
} from '../../generated/prisma/client.js';

import { createLogContext } from '../../common/logging/logging.utils.js';
import { getComputedProductPricing } from '../catalog/catalog-pricing.utils.js';
import { PrismaService } from '../database/prisma.service.js';
import { OrderSmsOutboxService } from '../order-sms/order-sms-outbox.service.js';
import type { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto.js';
import { reserveOrderInventory } from './order-inventory.utils.js';

const ORDER_NUMBER_MIN = 100_001;
const ORDER_NUMBER_MAX_EXCLUSIVE = 1_000_000;
const MAX_ORDER_NUMBER_ATTEMPTS = 5;
const MAX_SERIALIZATION_ATTEMPTS = 2;

type PreparedOrderItem = {
  productId: string;
  vehicleVariantId: string | null;

  productSku: string;
  productName: string;
  brandName: string;
  productImageUrl: string | null;

  vehicleSnapshot?: Prisma.InputJsonObject;

  fitmentStatus: OrderItemFitmentStatus;
  fitmentNotes: string | null;

  quantity: number;

  unitBasePriceToman: number;
  unitEffectivePriceToman: number;

  lineBaseTotalToman: number;
  lineDiscountToman: number;
  linePayableToman: number;
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  
    private readonly orderSmsOutbox: OrderSmsOutboxService,) {}

  async createFromCart(userId: string, dto: CreateOrderFromCartDto) {
    let serializationAttempts = 0;
    let orderNumberAttempts = 0;

    while (true) {
      try {
        const order = await this.prisma.$transaction(
          (transaction) => this.createFromCartInTransaction(transaction, userId, dto),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        this.logger.log(
          createLogContext('order_created', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId,
            itemCount: order.itemCount,
            payableToman: order.payableToman,
            status: order.status,
            paymentStatus: order.paymentStatus,
            inventoryStatus: OrderInventoryStatus.RESERVED,
          }),
        );

        return order;
      } catch (error) {
        if (this.isSerializationConflict(error)) {
          serializationAttempts += 1;

          if (serializationAttempts < MAX_SERIALIZATION_ATTEMPTS) {
            continue;
          }

          throw error;
        }

        if (this.isOrderNumberCollision(error)) {
          orderNumberAttempts += 1;

          if (orderNumberAttempts < MAX_ORDER_NUMBER_ATTEMPTS) {
            continue;
          }

          throw new InternalServerErrorException({
            code: 'ORDER_NUMBER_GENERATION_FAILED',
            message: 'امکان تولید شماره یکتای سفارش وجود نداشت. لطفاً دوباره تلاش کنید.',
          });
        }

        throw error;
      }
    }
  }

  async findOneForCustomer(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        customerUserId: userId,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethodCode: true,
        currencyCode: true,

        itemsBaseTotalToman: true,
        itemsDiscountToman: true,
        orderDiscountToman: true,
        shippingToman: true,
        payableToman: true,

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

        customerNote: true,
        expiresAt: true,
        paidAt: true,
        createdAt: true,

        items: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            productId: true,
            vehicleVariantId: true,

            productSku: true,
            productName: true,
            brandName: true,
            productImageUrl: true,

            vehicleSnapshot: true,
            fitmentStatus: true,
            fitmentNotes: true,

            quantity: true,

            unitBasePriceToman: true,
            unitEffectivePriceToman: true,

            lineBaseTotalToman: true,
            lineDiscountToman: true,
            linePayableToman: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async createFromCartInTransaction(
    transaction: Prisma.TransactionClient,
    userId: string,
    dto: CreateOrderFromCartDto,
  ) {
    const cart = await transaction.cart.findFirst({
      where: {
        ownerType: CartOwnerType.CUSTOMER,
        status: CartStatus.ACTIVE,
        userId,
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            product: {
              include: {
                brand: true,
                images: {
                  orderBy: {
                    sortOrder: 'asc',
                  },
                  take: 1,
                },
              },
            },
            vehicleVariant: {
              include: {
                model: {
                  include: {
                    make: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ConflictException('سبد خرید فعالی برای ثبت سفارش وجود ندارد');
    }

    const address = await transaction.customerAddress.findFirst({
      where: {
        id: dto.shippingAddressId,
        userId,
        isActive: true,
      },
    });

    if (!address) {
      throw new NotFoundException('آدرس انتخاب‌شده یافت نشد');
    }

    const productIds = [...new Set(cart.items.map((item) => item.productId))];

    const vehicleVariantIds = [
      ...new Set(
        cart.items
          .map((item) => item.vehicleVariantId)
          .filter((vehicleVariantId): vehicleVariantId is string => Boolean(vehicleVariantId)),
      ),
    ];

    const compatibilities =
      vehicleVariantIds.length > 0
        ? await transaction.productVehicleCompatibility.findMany({
            where: {
              productId: {
                in: productIds,
              },
              vehicleVariantId: {
                in: vehicleVariantIds,
              },
            },
            select: {
              productId: true,
              vehicleVariantId: true,
              notes: true,
              requiresVerification: true,
            },
          })
        : [];

    const compatibilityByKey = new Map(
      compatibilities.map((compatibility) => [
        `${compatibility.productId}:${compatibility.vehicleVariantId}`,
        compatibility,
      ]),
    );

    const validationMessages: string[] = [];
    const preparedItems: PreparedOrderItem[] = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      if (product.status !== ProductStatus.ACTIVE || !product.isPublished) {
        validationMessages.push(`«${product.name}» دیگر برای ثبت سفارش فعال نیست`);
        continue;
      }

      if (product.stockStatus === StockStatus.CHECK_AVAILABILITY) {
        validationMessages.push(`موجودی «${product.name}» نیازمند استعلام است`);
        continue;
      }

      if (product.stockStatus !== StockStatus.IN_STOCK || product.stockQuantity <= 0) {
        validationMessages.push(`«${product.name}» در حال حاضر ناموجود است`);
        continue;
      }

      if (cartItem.quantity > product.stockQuantity) {
        validationMessages.push(`موجودی «${product.name}» فقط ${product.stockQuantity} عدد است`);
        continue;
      }

      const pricing = getComputedProductPricing(product);

      const unitBasePriceToman = product.priceToman;
      const unitEffectivePriceToman = pricing.effectivePriceToman;

      if (
        !unitBasePriceToman ||
        unitBasePriceToman <= 0 ||
        !unitEffectivePriceToman ||
        unitEffectivePriceToman <= 0
      ) {
        validationMessages.push(`قیمت «${product.name}» نیازمند استعلام است`);
        continue;
      }

      const vehicle = cartItem.vehicleVariant;

      const compatibility = vehicle ? compatibilityByKey.get(`${product.id}:${vehicle.id}`) : null;

      const fitmentStatus = !vehicle
        ? OrderItemFitmentStatus.NOT_SELECTED
        : !compatibility
          ? OrderItemFitmentStatus.NOT_CONFIRMED
          : compatibility.requiresVerification
            ? OrderItemFitmentStatus.REQUIRES_VERIFICATION
            : OrderItemFitmentStatus.CONFIRMED;

      const lineBaseTotalToman = unitBasePriceToman * cartItem.quantity;

      const linePayableToman = unitEffectivePriceToman * cartItem.quantity;

      preparedItems.push({
        productId: product.id,
        vehicleVariantId: vehicle?.id ?? null,

        productSku: product.sku,
        productName: product.name,
        brandName: product.brand.name,
        productImageUrl: product.images[0]?.url ?? null,

        vehicleSnapshot: vehicle
          ? {
              id: vehicle.id,
              name: vehicle.name,
              slug: vehicle.slug,
              engineCode: vehicle.engineCode,
              engineName: vehicle.engineName,
              yearFrom: vehicle.yearFrom,
              yearTo: vehicle.yearTo,
              yearCalendar: vehicle.yearCalendar,
              model: {
                id: vehicle.model.id,
                name: vehicle.model.name,
                slug: vehicle.model.slug,
                make: {
                  id: vehicle.model.make.id,
                  name: vehicle.model.make.name,
                  slug: vehicle.model.make.slug,
                },
              },
            }
          : undefined,

        fitmentStatus,
        fitmentNotes: compatibility?.notes ?? null,

        quantity: cartItem.quantity,

        unitBasePriceToman,
        unitEffectivePriceToman,

        lineBaseTotalToman,
        lineDiscountToman: lineBaseTotalToman - linePayableToman,
        linePayableToman,
      });
    }

    if (validationMessages.length > 0) {
      throw new ConflictException({
        code: 'CHECKOUT_CART_INVALID',
        message: 'برخی از آیتم‌های سبد خرید دیگر قابل ثبت سفارش نیستند',
        details: validationMessages,
      });
    }

    const itemsBaseTotalToman = preparedItems.reduce(
      (total, item) => total + item.lineBaseTotalToman,
      0,
    );

    const itemsDiscountToman = preparedItems.reduce(
      (total, item) => total + item.lineDiscountToman,
      0,
    );

    const orderDiscountToman = 0;
    const shippingToman = 0;

    const payableToman =
      itemsBaseTotalToman - itemsDiscountToman - orderDiscountToman + shippingToman;

    const now = new Date();

    const expiresAt = new Date(now.getTime() + this.getPaymentOrderTtlMinutes() * 60_000);

    const orderNumber = this.generateOrderNumber();

    await reserveOrderInventory(transaction, preparedItems);

    const order = await transaction.order.create({
      data: {
        orderNumber,
        customerUserId: userId,
        sourceCartId: cart.id,

        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: OrderPaymentStatus.UNPAID,

        inventoryStatus: OrderInventoryStatus.RESERVED,
        inventoryReservedAt: now,

        paymentMethodCode: 'ONLINE',
        currencyCode: 'TOMAN',

        shippingAddressId: address.id,

        shippingRecipientFirstName: address.recipientFirstName,
        shippingRecipientLastName: address.recipientLastName,
        shippingRecipientMobile: address.recipientMobile,

        shippingProvince: address.province,
        shippingCity: address.city,
        shippingDistrict: address.district,

        shippingAddressLine: address.addressLine,
        shippingPostalCode: address.postalCode,

        shippingPlaque: address.plaque,
        shippingFloor: address.floor,
        shippingUnit: address.unit,

        shippingNotes: address.deliveryNotes,

        itemsBaseTotalToman,
        itemsDiscountToman,
        orderDiscountToman,
        shippingToman,
        payableToman,
        expiresAt,

        customerNote: this.normalizeOptionalText(dto.customerNote),

        items: {
          create: preparedItems,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethodCode: true,
        currencyCode: true,
        payableToman: true,
        createdAt: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    await this.orderSmsOutbox.enqueuePaymentReminder(
      transaction,
      {
        orderId: order.id,
        recipient: address.recipientMobile,
        createdAt: now,
      },
    );

    await transaction.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        status: CartStatus.CHECKED_OUT,
        lastActivityAt: now,
      },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethodCode: order.paymentMethodCode,
      currencyCode: order.currencyCode,
      payableToman: order.payableToman,
      itemCount: order._count.items,
      createdAt: order.createdAt,
    };
  }

  private generateOrderNumber() {
    return randomInt(ORDER_NUMBER_MIN, ORDER_NUMBER_MAX_EXCLUSIVE);
  }

  private isSerializationConflict(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
  }

  private isOrderNumberCollision(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target;

    if (Array.isArray(target)) {
      return target.some(
        (value) => typeof value === 'string' && value.toLowerCase().includes('ordernumber'),
      );
    }

    if (typeof target === 'string') {
      return target.toLowerCase().includes('ordernumber');
    }

    return error.message.toLowerCase().includes('ordernumber');
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();

    return normalized || null;
  }

  private getPaymentOrderTtlMinutes() {
    const rawValue = this.configService.get<string>('PAYMENT_ORDER_TTL_MINUTES') ?? '15';

    const value = Number(rawValue);

    if (!Number.isSafeInteger(value) || value < 1) {
      return 15;
    }

    return value;
  }
}
