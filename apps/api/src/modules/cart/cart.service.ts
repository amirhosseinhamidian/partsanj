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

type CartItemFitmentStatus =
  | 'NOT_SELECTED'
  | 'CONFIRMED'
  | 'REQUIRES_VERIFICATION'
  | 'NOT_CONFIRMED';

type CartItemAvailabilityReason = 'PRODUCT_INACTIVE' | 'OUT_OF_STOCK' | 'PRICE_UNAVAILABLE';

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

    const productPrice = await this.getPurchasableProduct(dto.productId);

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
      throw new BadRequestException(`Maximum quantity per cart item is ${MAX_CART_ITEM_QUANTITY}`);
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: nextQuantity,
          unitBasePriceToman: productPrice.unitBasePriceToman,
          unitEffectivePriceToman: productPrice.unitEffectivePriceToman,
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
          unitBasePriceToman: productPrice.unitBasePriceToman,
          unitEffectivePriceToman: productPrice.unitEffectivePriceToman,
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
      throw new NotFoundException('Cart item not found');
    }

    const productPrice = await this.getPurchasableProduct(item.productId);

    await this.prisma.cartItem.update({
      where: {
        id: item.id,
      },
      data: {
        quantity: dto.quantity,
        unitBasePriceToman: productPrice.unitBasePriceToman,
        unitEffectivePriceToman: productPrice.unitEffectivePriceToman,
        priceSnapshotAt: new Date(),
      },
    });

    await this.touchCart(cart.id);

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
      throw new NotFoundException('Cart item not found');
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
      throw new UnauthorizedException('Authentication is required to merge a cart');
    }

    if (!guestToken?.trim()) {
      throw new BadRequestException('Guest cart token is required');
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

        if (!customerItem) {
          await transaction.cartItem.create({
            data: {
              cartId: customerCart.id,
              productId: guestItem.productId,
              vehicleVariantId: guestItem.vehicleVariantId,
              fitmentKey: guestItem.fitmentKey,
              quantity: guestItem.quantity,
              unitBasePriceToman: guestItem.unitBasePriceToman,
              unitEffectivePriceToman: guestItem.unitEffectivePriceToman,
              priceSnapshotAt: guestItem.priceSnapshotAt,
            },
          });

          continue;
        }

        const sourceSnapshotIsNewer = guestItem.priceSnapshotAt > customerItem.priceSnapshotAt;

        await transaction.cartItem.update({
          where: {
            id: customerItem.id,
          },
          data: {
            quantity: Math.min(MAX_CART_ITEM_QUANTITY, customerItem.quantity + guestItem.quantity),
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
        status: true,
        isPublished: true,
        stockStatus: true,
        priceToman: true,
        salePriceToman: true,
        saleStartsAt: true,
        saleEndsAt: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.ACTIVE || !product.isPublished) {
      throw new ConflictException('Product is not available for purchase');
    }

    if (product.stockStatus === StockStatus.OUT_OF_STOCK) {
      throw new ConflictException('Product is out of stock');
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
      throw new ConflictException('Product price is unavailable');
    }

    return {
      unitBasePriceToman,
      unitEffectivePriceToman,
    };
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
      throw new NotFoundException('Vehicle variant not found');
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
      throw new NotFoundException('Guest cart not found');
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
          userId,
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
    const now = new Date();

    await this.prisma.cart.update({
      where: {
        id: cartId,
      },
      data: {
        lastActivityAt: now,
        expiresAt: {
          set: this.getGuestCartExpiryDate(now),
        },
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
      throw new NotFoundException('Cart not found');
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

      if (item.product.stockStatus === StockStatus.OUT_OF_STOCK) {
        availabilityReasons.push('OUT_OF_STOCK');
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
      throw new Error(`${key} must be a positive integer`);
    }

    return parsedValue;
  }
}
