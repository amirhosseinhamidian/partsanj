import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CartOwnerType,
  CartStatus,
  ProductStatus,
  StockStatus,
} from '../../generated/prisma/client.js';
import { getComputedProductPricing } from '../catalog/catalog-pricing.utils.js';
import { PrismaService } from '../database/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { createHmac, randomBytes } from 'node:crypto';
import { MAX_CART_ITEM_QUANTITY } from './cart.constants.js';
import type { AddCartItemDto } from './dto/add-cart-item.dto.js';
import type { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import type { UpdateCartItemVehicleDto } from './dto/update-cart-item-vehicle.dto.js';

type CartItemFitmentStatus =
  | 'NOT_SELECTED'
  | 'CONFIRMED'
  | 'REQUIRES_VERIFICATION'
  | 'NOT_CONFIRMED';

type CartItemAvailabilityReason =
  | 'PRODUCT_INACTIVE'
  | 'CHECK_AVAILABILITY'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_STOCK'
  | 'PRICE_UNAVAILABLE';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getCart(user: AuthenticatedUser | undefined, guestToken: string | undefined) {
    if (user) {
      const cart = await this.getOrCreateCustomerCart(user.id);

      return {
        cart: await this.serializeCart(cart.id),
      };
    }

    const guestCart = await this.findActiveGuestCart(guestToken);

    if (!guestCart) {
      return {
        cart: null,
      };
    }

    await this.touchCart(guestCart.id);

    return {
      cart: await this.serializeCart(guestCart.id),
    };
  }

  async addItem(
    user: AuthenticatedUser | undefined,
    guestToken: string | undefined,
    dto: AddCartItemDto,
  ) {
    const cartResolution = await this.resolveCartForMutation(user, guestToken);

    const product = await this.getPurchasableProduct(dto.productId);

    if (dto.vehicleVariantId) {
      await this.ensureActiveVehicleVariant(dto.vehicleVariantId);
    }

    const fitmentKey = dto.vehicleVariantId ?? '';

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId_fitmentKey: {
          cartId: cartResolution.cart.id,

          productId: dto.productId,
          fitmentKey,
        },
      },
    });

    const nextQuantity = (existingItem?.quantity ?? 0) + dto.quantity;

    if (nextQuantity > MAX_CART_ITEM_QUANTITY) {
      throw new BadRequestException(
        `حداکثر تعداد مجاز برای هر آیتم سبد خرید ${MAX_CART_ITEM_QUANTITY} عدد است.`,
      );
    }

    this.assertQuantityIsAvailable(nextQuantity, product.maxOrderQuantity);

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: nextQuantity,
          unitBasePriceToman: product.unitBasePriceToman,
          unitEffectivePriceToman: product.unitEffectivePriceToman,
          priceSnapshotAt: new Date(),
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cartResolution.cart.id,
          productId: dto.productId,
          vehicleVariantId: dto.vehicleVariantId,
          fitmentKey,
          quantity: dto.quantity,
          unitBasePriceToman: product.unitBasePriceToman,
          unitEffectivePriceToman: product.unitEffectivePriceToman,
        },
      });
    }

    await this.touchCart(cartResolution.cart.id);

    return {
      cart: await this.serializeCart(cartResolution.cart.id),
      issuedGuestToken: cartResolution.issuedGuestToken,
    };
  }

  async updateItemQuantity(
    user: AuthenticatedUser | undefined,
    guestToken: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.resolveExistingCart(user, guestToken);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('آیتم سبد خرید یافت نشد.');
    }

    /**
     * ارسال دوباره همان quantity تغییری ایجاد نمی‌کند.
     */
    if (dto.quantity === item.quantity) {
      return {
        cart: await this.serializeCart(cart.id),
      };
    }

    /**
     * کاهش تعداد باید همیشه مجاز باشد؛ حتی اگر محصول بعداً ناموجود،
     * غیرفعال یا موجودی آن کمتر از تعداد فعلی سبد شده باشد.
     * در غیر این صورت کاربر نمی‌تواند تعارض موجودی را برطرف کند.
     */
    if (dto.quantity < item.quantity) {
      await this.prisma.cartItem.update({
        where: {
          id: item.id,
        },
        data: {
          quantity: dto.quantity,
        },
      });

      await this.touchCart(cart.id);

      return {
        cart: await this.serializeCart(cart.id),
      };
    }

    /**
     * فقط افزایش تعداد نیازمند کنترل وضعیت محصول، قیمت و موجودی است.
     */
    const product = await this.getPurchasableProduct(item.productId);

    this.assertQuantityIsAvailable(dto.quantity, product.maxOrderQuantity);

    await this.prisma.cartItem.update({
      where: {
        id: item.id,
      },
      data: {
        quantity: dto.quantity,
        unitBasePriceToman: product.unitBasePriceToman,
        unitEffectivePriceToman: product.unitEffectivePriceToman,
        priceSnapshotAt: new Date(),
      },
    });

    await this.touchCart(cart.id);

    return {
      cart: await this.serializeCart(cart.id),
    };
  }

  async updateItemVehicle(
    user: AuthenticatedUser | undefined,
    guestToken: string | undefined,
    itemId: string,
    dto: UpdateCartItemVehicleDto,
  ) {
    const cart = await this.resolveExistingCart(user, guestToken);

    const nextVehicleVariantId = dto.vehicleVariantId;
    const nextFitmentKey = nextVehicleVariantId ?? '';

    if (nextVehicleVariantId) {
      await this.ensureActiveVehicleVariant(nextVehicleVariantId);
    }

    const sourceItemForAvailability = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      select: {
        productId: true,
      },
    });

    if (!sourceItemForAvailability) {
      throw new NotFoundException('آیتم سبد خرید یافت نشد.');
    }

    const product = await this.getPurchasableProduct(sourceItemForAvailability.productId);

    const now = new Date();

    await this.prisma.$transaction(async (transaction) => {
      const sourceItem = await transaction.cartItem.findFirst({
        where: {
          id: itemId,
          cartId: cart.id,
        },
      });

      if (!sourceItem) {
        throw new NotFoundException('آیتم سبد خرید یافت نشد.');
      }

      this.assertQuantityIsAvailable(sourceItem.quantity, product.maxOrderQuantity);

      if (sourceItem.fitmentKey === nextFitmentKey) {
        await transaction.cart.update({
          where: {
            id: cart.id,
          },
          data: {
            lastActivityAt: now,
          },
        });

        return;
      }

      const targetItem = await transaction.cartItem.findUnique({
        where: {
          cartId_productId_fitmentKey: {
            cartId: cart.id,
            productId: sourceItem.productId,
            fitmentKey: nextFitmentKey,
          },
        },
      });

      if (targetItem) {
        const mergedQuantity = sourceItem.quantity + targetItem.quantity;

        if (mergedQuantity > MAX_CART_ITEM_QUANTITY) {
          throw new BadRequestException(
            `حداکثر تعداد مجاز برای هر آیتم سبد خرید ${MAX_CART_ITEM_QUANTITY} عدد است.`,
          );
        }

        this.assertQuantityIsAvailable(mergedQuantity, product.maxOrderQuantity);

        const sourceSnapshotIsNewer = sourceItem.priceSnapshotAt > targetItem.priceSnapshotAt;

        await transaction.cartItem.update({
          where: {
            id: targetItem.id,
          },
          data: {
            quantity: mergedQuantity,
            ...(sourceSnapshotIsNewer
              ? {
                  unitBasePriceToman: sourceItem.unitBasePriceToman,
                  unitEffectivePriceToman: sourceItem.unitEffectivePriceToman,
                  priceSnapshotAt: sourceItem.priceSnapshotAt,
                }
              : {}),
          },
        });

        await transaction.cartItem.delete({
          where: {
            id: sourceItem.id,
          },
        });
      } else {
        await transaction.cartItem.update({
          where: {
            id: sourceItem.id,
          },
          data: {
            vehicleVariantId: nextVehicleVariantId,
            fitmentKey: nextFitmentKey,
          },
        });
      }

      await transaction.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          lastActivityAt: now,
        },
      });
    });

    return {
      cart: await this.serializeCart(cart.id),
    };
  }

  async removeItem(
    user: AuthenticatedUser | undefined,
    guestToken: string | undefined,
    itemId: string,
  ) {
    const cart = await this.resolveExistingCart(user, guestToken);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      select: {
        id: true,
      },
    });

    if (!item) {
      throw new NotFoundException('آیتم سبد خرید یافت نشد.');
    }

    await this.prisma.cartItem.delete({
      where: {
        id: item.id,
      },
    });

    await this.touchCart(cart.id);

    return {
      cart: await this.serializeCart(cart.id),
    };
  }

  async mergeGuestCart(user: AuthenticatedUser | undefined, guestToken: string | undefined) {
    if (!user) {
      throw new UnauthorizedException('برای ادغام سبد خرید باید وارد حساب کاربری شوید.');
    }

    if (!guestToken?.trim()) {
      throw new BadRequestException('اطلاعات سبد خرید مهمان موجود نیست.');
    }

    const customerCart = await this.getOrCreateCustomerCart(user.id);

    const guestCart = await this.findActiveGuestCart(guestToken);

    if (!guestCart) {
      return {
        cart: await this.serializeCart(customerCart.id),
        merged: false,
      };
    }

    const guestItems = await this.prisma.cartItem.findMany({
      where: {
        cartId: guestCart.id,
      },
    });

    const uniqueProductIds = Array.from(new Set(guestItems.map((item) => item.productId)));

    const products =
      uniqueProductIds.length > 0
        ? await this.prisma.product.findMany({
            where: {
              id: {
                in: uniqueProductIds,
              },
            },
            select: {
              id: true,
              stockStatus: true,
              stockQuantity: true,
            },
          })
        : [];

    const quantityLimitByProductId = new Map<string, number | null>(
      products.map((product) => [
        product.id,
        product.stockStatus === StockStatus.IN_STOCK && product.stockQuantity > 0
          ? Math.min(product.stockQuantity, MAX_CART_ITEM_QUANTITY)
          : null,
      ]),
    );

    const now = new Date();

    await this.prisma.$transaction(async (transaction) => {
      for (const guestItem of guestItems) {
        const customerItem = await transaction.cartItem.findUnique({
          where: {
            cartId_productId_fitmentKey: {
              cartId: customerCart.id,
              productId: guestItem.productId,
              fitmentKey: guestItem.fitmentKey,
            },
          },
        });

        const availableLimit = quantityLimitByProductId.get(guestItem.productId) ?? null;

        if (!customerItem) {
          const quantity =
            availableLimit === null
              ? Math.min(MAX_CART_ITEM_QUANTITY, guestItem.quantity)
              : Math.min(availableLimit, guestItem.quantity);

          await transaction.cartItem.create({
            data: {
              cartId: customerCart.id,
              productId: guestItem.productId,
              vehicleVariantId: guestItem.vehicleVariantId,
              fitmentKey: guestItem.fitmentKey,
              quantity,
              unitBasePriceToman: guestItem.unitBasePriceToman,
              unitEffectivePriceToman: guestItem.unitEffectivePriceToman,
              priceSnapshotAt: guestItem.priceSnapshotAt,
            },
          });

          continue;
        }

        const combinedQuantity = customerItem.quantity + guestItem.quantity;
        const quantity =
          availableLimit === null
            ? Math.min(MAX_CART_ITEM_QUANTITY, combinedQuantity)
            : Math.min(availableLimit, combinedQuantity);

        const sourceSnapshotIsNewer = guestItem.priceSnapshotAt > customerItem.priceSnapshotAt;

        await transaction.cartItem.update({
          where: {
            id: customerItem.id,
          },
          data: {
            quantity,
            ...(sourceSnapshotIsNewer
              ? {
                  unitBasePriceToman: guestItem.unitBasePriceToman,
                  unitEffectivePriceToman: guestItem.unitEffectivePriceToman,
                  priceSnapshotAt: guestItem.priceSnapshotAt,
                }
              : {}),
          },
        });
      }

      await transaction.cartItem.deleteMany({
        where: {
          cartId: guestCart.id,
        },
      });

      await transaction.cart.update({
        where: {
          id: guestCart.id,
        },
        data: {
          status: CartStatus.MERGED,
          mergedAt: now,
          lastActivityAt: now,
        },
      });

      await transaction.cart.update({
        where: {
          id: customerCart.id,
        },
        data: {
          lastActivityAt: now,
        },
      });
    });

    return {
      cart: await this.serializeCart(customerCart.id),
      merged: true,
    };
  }

  private async getPurchasableProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
        name: true,

        status: true,
        isPublished: true,

        stockStatus: true,
        stockQuantity: true,

        priceToman: true,
        salePriceToman: true,
        saleStartsAt: true,
        saleEndsAt: true,
      },
    });

    if (!product) {
      throw new NotFoundException('محصول یافت نشد.');
    }

    if (product.status !== ProductStatus.ACTIVE || !product.isPublished) {
      throw new ConflictException('این محصول در حال حاضر قابل خرید نیست');
    }

    if (product.stockStatus === StockStatus.CHECK_AVAILABILITY) {
      throw new ConflictException('موجودی این محصول نیازمند استعلام است');
    }

    if (product.stockStatus !== StockStatus.IN_STOCK || product.stockQuantity <= 0) {
      throw new ConflictException('این محصول در حال حاضر ناموجود است');
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
      throw new ConflictException('قیمت این محصول در دسترس نیست');
    }

    return {
      productId: product.id,
      productName: product.name,

      stockQuantity: product.stockQuantity,

      maxOrderQuantity: Math.min(product.stockQuantity, MAX_CART_ITEM_QUANTITY),

      unitBasePriceToman,
      unitEffectivePriceToman,
    };
  }

  private assertQuantityIsAvailable(requestedQuantity: number, availableQuantity: number) {
    if (requestedQuantity <= availableQuantity) {
      return;
    }

    throw new ConflictException(`موجودی این محصول فقط ${availableQuantity} عدد است`);
  }

  private async ensureActiveVehicleVariant(vehicleVariantId: string) {
    const vehicleVariant = await this.prisma.vehicleVariant.findFirst({
      where: {
        id: vehicleVariantId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!vehicleVariant) {
      throw new NotFoundException('تیپ خودرو یافت نشد.');
    }
  }

  private async resolveCartForMutation(
    user: AuthenticatedUser | undefined,
    guestToken: string | undefined,
  ): Promise<{
    cart: Awaited<ReturnType<typeof this.getOrCreateCustomerCart>>;
    issuedGuestToken?: string;
  }> {
    if (user) {
      return {
        cart: await this.getOrCreateCustomerCart(user.id),
        issuedGuestToken: undefined,
      };
    }

    const existingGuestCart = await this.findActiveGuestCart(guestToken);

    if (existingGuestCart) {
      return {
        cart: existingGuestCart,
        issuedGuestToken: undefined,
      };
    }

    return this.createGuestCart();
  }

  private async resolveExistingCart(
    user: AuthenticatedUser | undefined,
    guestToken: string | undefined,
  ) {
    if (user) {
      return this.getOrCreateCustomerCart(user.id);
    }

    const guestCart = await this.findActiveGuestCart(guestToken);

    if (!guestCart) {
      throw new NotFoundException('سبد خرید مهمان یافت نشد.');
    }

    return guestCart;
  }

  private async getOrCreateCustomerCart(userId: string) {
    const existingCart = await this.prisma.cart.findFirst({
      where: {
        ownerType: CartOwnerType.CUSTOMER,
        status: CartStatus.ACTIVE,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingCart) {
      return existingCart;
    }

    try {
      return await this.prisma.cart.create({
        data: {
          ownerType: CartOwnerType.CUSTOMER,
          status: CartStatus.ACTIVE,
          userId,

          guestTokenHash: null,
          expiresAt: null,
        },
      });
    } catch (error) {
      const concurrentCart = await this.prisma.cart.findFirst({
        where: {
          ownerType: CartOwnerType.CUSTOMER,
          status: CartStatus.ACTIVE,
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (concurrentCart) {
        return concurrentCart;
      }

      throw error;
    }
  }

  private async createGuestCart() {
    const guestToken = randomBytes(32).toString('base64url');
    const now = new Date();

    const cart = await this.prisma.cart.create({
      data: {
        ownerType: CartOwnerType.GUEST,
        status: CartStatus.ACTIVE,

        userId: null,
        guestTokenHash: this.hashGuestToken(guestToken),
        expiresAt: this.getGuestCartExpiryDate(now),

        lastActivityAt: now,
      },
    });

    return {
      cart,
      issuedGuestToken: guestToken,
    };
  }

  private async findActiveGuestCart(guestToken: string | undefined) {
    const normalizedGuestToken = guestToken?.trim();

    if (!normalizedGuestToken) {
      return null;
    }

    return this.prisma.cart.findFirst({
      where: {
        ownerType: CartOwnerType.GUEST,
        status: CartStatus.ACTIVE,
        guestTokenHash: this.hashGuestToken(normalizedGuestToken),
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async touchCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: {
        id: cartId,
      },
      select: {
        ownerType: true,
      },
    });

    if (!cart) {
      throw new NotFoundException('سبد خرید یافت نشد.');
    }

    const now = new Date();

    await this.prisma.cart.update({
      where: {
        id: cartId,
      },
      data: {
        lastActivityAt: now,
        ...(cart.ownerType === CartOwnerType.GUEST
          ? {
              expiresAt: this.getGuestCartExpiryDate(now),
            }
          : {
              expiresAt: null,
            }),
      },
    });
  }

  private async serializeCart(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: {
        id: cartId,
      },
      select: {
        id: true,
        ownerType: true,
        status: true,
        expiresAt: true,
        lastActivityAt: true,
        createdAt: true,
        updatedAt: true,
        items: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            productId: true,
            vehicleVariantId: true,
            fitmentKey: true,
            quantity: true,
            unitBasePriceToman: true,
            unitEffectivePriceToman: true,
            priceSnapshotAt: true,
            createdAt: true,
            updatedAt: true,
            product: {
              select: {
                id: true,
                sku: true,
                slug: true,
                name: true,
                shortDescription: true,
                status: true,
                isPublished: true,
                stockStatus: true,
                stockQuantity: true,
                priceToman: true,
                salePriceToman: true,
                saleStartsAt: true,
                saleEndsAt: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                images: {
                  orderBy: {
                    sortOrder: 'asc',
                  },
                  take: 1,
                  select: {
                    id: true,
                    url: true,
                    alt: true,
                    sortOrder: true,
                  },
                },
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
                notes: true,
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
      },
    });

    if (!cart) {
      throw new NotFoundException('سبد خرید یافت نشد.');
    }

    const compatibilityPairs = cart.items
      .filter((item) => item.vehicleVariantId !== null)
      .map((item) => ({
        productId: item.productId,
        vehicleVariantId: item.vehicleVariantId as string,
      }));

    const compatibilities =
      compatibilityPairs.length > 0
        ? await this.prisma.productVehicleCompatibility.findMany({
            where: {
              OR: compatibilityPairs,
            },
            select: {
              productId: true,
              vehicleVariantId: true,
              notes: true,
              requiresVerification: true,
            },
          })
        : [];

    const compatibilityMap = new Map(
      compatibilities.map((compatibility) => [
        `${compatibility.productId}:${compatibility.vehicleVariantId}`,
        compatibility,
      ]),
    );

    let totalItemQuantity = 0;
    let purchasableItemQuantity = 0;
    let subtotalToman = 0;

    const items = cart.items.map((item) => {
      const pricing = getComputedProductPricing(item.product);

      const availabilityReasons: CartItemAvailabilityReason[] = [];

      if (item.product.status !== ProductStatus.ACTIVE || !item.product.isPublished) {
        availabilityReasons.push('PRODUCT_INACTIVE');
      }

      const availableQuantity =
        item.product.stockStatus === StockStatus.IN_STOCK
          ? Math.max(0, item.product.stockQuantity)
          : 0;

      const maxOrderQuantity = Math.min(availableQuantity, MAX_CART_ITEM_QUANTITY);
      const hasQuantityConflict = item.quantity > maxOrderQuantity;

      if (item.product.stockStatus === StockStatus.CHECK_AVAILABILITY) {
        availabilityReasons.push('CHECK_AVAILABILITY');
      } else if (item.product.stockStatus !== StockStatus.IN_STOCK || availableQuantity <= 0) {
        availabilityReasons.push('OUT_OF_STOCK');
      } else if (hasQuantityConflict) {
        availabilityReasons.push('INSUFFICIENT_STOCK');
      }

      if (pricing.effectivePriceToman === null || pricing.effectivePriceToman <= 0) {
        availabilityReasons.push('PRICE_UNAVAILABLE');
      }

      const canPurchase = availabilityReasons.length === 0;

      const compatibility = item.vehicleVariantId
        ? (compatibilityMap.get(`${item.productId}:${item.vehicleVariantId}`) ?? null)
        : null;

      const fitmentStatus: CartItemFitmentStatus = !item.vehicleVariantId
        ? 'NOT_SELECTED'
        : !compatibility
          ? 'NOT_CONFIRMED'
          : compatibility.requiresVerification
            ? 'REQUIRES_VERIFICATION'
            : 'CONFIRMED';

      const currentEffectivePriceToman = pricing.effectivePriceToman;

      const lineTotalToman =
        canPurchase && currentEffectivePriceToman !== null
          ? currentEffectivePriceToman * item.quantity
          : null;

      totalItemQuantity += item.quantity;

      if (canPurchase && lineTotalToman !== null) {
        purchasableItemQuantity += item.quantity;
        subtotalToman += lineTotalToman;
      }

      return {
        id: item.id,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,

        product: {
          id: item.product.id,
          sku: item.product.sku,
          slug: item.product.slug,
          name: item.product.name,
          shortDescription: item.product.shortDescription,
          brand: item.product.brand,
          category: item.product.category,
          image: item.product.images[0] ?? null,
        },

        vehicle: item.vehicleVariant
          ? {
              id: item.vehicleVariant.id,
              name: item.vehicleVariant.name,
              slug: item.vehicleVariant.slug,
              engineCode: item.vehicleVariant.engineCode,
              engineName: item.vehicleVariant.engineName,
              yearFrom: item.vehicleVariant.yearFrom,
              yearTo: item.vehicleVariant.yearTo,
              yearCalendar: item.vehicleVariant.yearCalendar,
              notes: item.vehicleVariant.notes,
              model: item.vehicleVariant.model,
            }
          : null,

        fitment: {
          status: fitmentStatus,
          notes: compatibility?.notes ?? null,
          requiresVerification: compatibility?.requiresVerification ?? false,
        },

        availability: {
          canPurchase,
          reasons: availabilityReasons,
          availableQuantity,
          maxOrderQuantity,
          hasQuantityConflict,
        },

        price: {
          snapshotBasePriceToman: item.unitBasePriceToman,
          snapshotEffectivePriceToman: item.unitEffectivePriceToman,
          snapshotAt: item.priceSnapshotAt,

          currentBasePriceToman: item.product.priceToman,
          currentEffectivePriceToman,
          discountAmountToman: pricing.discountAmountToman,
          discountPercent: pricing.discountPercent,
          isSaleActive: pricing.isSaleActive,

          hasPriceChanged: item.unitEffectivePriceToman !== currentEffectivePriceToman,
        },

        lineTotalToman,
      };
    });

    return {
      id: cart.id,
      ownerType: cart.ownerType,
      status: cart.status,
      expiresAt: cart.expiresAt,
      lastActivityAt: cart.lastActivityAt,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,

      items,

      summary: {
        itemCount: totalItemQuantity,
        purchasableItemCount: purchasableItemQuantity,
        subtotalToman,
      },
    };
  }

  private hashGuestToken(guestToken: string) {
    const secret = this.configService.getOrThrow<string>('CART_GUEST_TOKEN_HASH_SECRET');

    return createHmac('sha256', secret).update(guestToken).digest('hex');
  }

  private getGuestCartExpiryDate(now: Date) {
    const ttlDays = this.getPositiveInteger('CART_GUEST_TTL_DAYS', 30);

    return new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);
  }

  private getPositiveInteger(key: string, fallbackValue: number) {
    const rawValue = this.configService.get<string>(key);

    if (!rawValue) {
      return fallbackValue;
    }

    const parsedValue = Number(rawValue);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      throw new Error(`مقدار تنظیمات ${key} باید یک عدد صحیح مثبت باشد.`);
    }

    return parsedValue;
  }
}
