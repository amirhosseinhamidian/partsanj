import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ProductBehaviorEventType,
  ProductStatus,
  StockStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { FindProductsQueryDto } from './dto/find-products.query.dto.js';
import { getComputedProductPricing, type ProductPricingFields } from './catalog-pricing.utils.js';
import { FindHomeFeaturedProductsQueryDto } from './dto/find-home-featured-products.query.dto.js';
import { TrackProductViewDto } from './dto/track-product-view.dto.js';

const PRODUCT_VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findBrands() {
    const brands = await this.prisma.brand.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
      },
    });

    return {
      data: brands,
    };
  }

  async findCategories() {
    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        imageAlt: true,
        parentId: true,
        sortOrder: true,
        showOnHome: true,
      },
    });

    return {
      data: categories,
    };
  }

  async findCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        slug,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        slug: true,

        description: true,

        imageUrl: true,
        imageAlt: true,

        parentId: true,
        sortOrder: true,
        showOnHome: true,

        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        noIndex: true,

        openGraphTitle: true,
        openGraphDescription: true,
        openGraphImageUrl: true,
        openGraphImageAlt: true,

        updatedAt: true,

        children: {
          where: {
            isActive: true,
          },

          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],

          select: {
            id: true,
            name: true,
            slug: true,

            imageUrl: true,
            imageAlt: true,

            parentId: true,
            sortOrder: true,
            showOnHome: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('دسته‌بندی یافت نشد.');
    }

    const ancestors = await this.findCategoryAncestors(category.parentId);

    return {
      data: {
        ...category,
        ancestors,
      },
    };
  }

  async trackProductView(slug: string, dto: TrackProductViewDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        ...this.buildPublicProductWhere({}),
        slug,
      },

      select: {
        id: true,
      },
    });

    if (!product) {
      throw new NotFoundException('محصول یافت نشد.');
    }

    let vehicleVariantId: string | null = null;

    if (dto.vehicleVariantId) {
      const vehicleVariant = await this.prisma.vehicleVariant.findFirst({
        where: {
          id: dto.vehicleVariantId,
          isActive: true,

          model: {
            isActive: true,

            make: {
              isActive: true,
            },
          },
        },

        select: {
          id: true,
        },
      });

      vehicleVariantId = vehicleVariant?.id ?? null;
    }

    /*
     * Refresh یا remount نباید View جدید بسازد.
     */
    const duplicateSince = new Date(Date.now() - PRODUCT_VIEW_DEDUPE_WINDOW_MS);

    const existingView = await this.prisma.productBehaviorEvent.findFirst({
      where: {
        type: ProductBehaviorEventType.VIEW,

        sessionId: dto.sessionId,

        productId: product.id,

        createdAt: {
          gte: duplicateSince,
        },
      },

      select: {
        id: true,
      },
    });

    if (existingView) {
      return {
        data: {
          recorded: false,
        },
      };
    }

    await this.prisma.productBehaviorEvent.create({
      data: {
        type: ProductBehaviorEventType.VIEW,

        sessionId: dto.sessionId,

        productId: product.id,

        vehicleVariantId,
      },
    });

    return {
      data: {
        recorded: true,
      },
    };
  }

  async findProducts(query: FindProductsQueryDto) {
    const categoryScopeIds = query.category
      ? await this.resolveCategoryScopeIds(query.category)
      : undefined;

    const baseWhere = this.buildPublicProductWhere(query, categoryScopeIds);

    const pageOffset = (query.page - 1) * query.limit;
    const now = new Date();

    /*
     * ترتیب سراسری موجودی باید قبل از pagination اعمال شود:
     *
     * 1. محصولات قابل خرید: IN_STOCK و stockQuantity > 0
     * 2. محصولات نیازمند استعلام: CHECK_AVAILABILITY
     * 3. محصولات ناموجود یا دارای داده ناسازگار: OUT_OF_STOCK
     *    و همچنین IN_STOCK با stockQuantity <= 0
     *
     * استفاده از AND باعث می‌شود فیلترهای فعلی مانند جستجو، برند،
     * دسته‌بندی، خودرو و stockStatus بدون overwrite شدن حفظ شوند.
     */
    const availableWhere: Prisma.ProductWhereInput = {
      AND: [
        baseWhere,
        {
          stockStatus: StockStatus.IN_STOCK,
          stockQuantity: {
            gt: 0,
          },
        },
      ],
    };

    const checkAvailabilityWhere: Prisma.ProductWhereInput = {
      AND: [
        baseWhere,
        {
          stockStatus: StockStatus.CHECK_AVAILABILITY,
        },
      ],
    };

    const unavailableWhere: Prisma.ProductWhereInput = {
      AND: [
        baseWhere,
        {
          OR: [
            {
              stockStatus: StockStatus.OUT_OF_STOCK,
            },
            {
              stockStatus: StockStatus.IN_STOCK,
              stockQuantity: {
                lte: 0,
              },
            },
          ],
        },
      ],
    };

    const [availableCount, checkAvailabilityCount, unavailableCount] =
      await this.prisma.$transaction([
        this.prisma.product.count({
          where: availableWhere,
        }),
        this.prisma.product.count({
          where: checkAvailabilityWhere,
        }),
        this.prisma.product.count({
          where: unavailableWhere,
        }),
      ]);

    const availableSkip = Math.min(pageOffset, availableCount);
    const availableTake = Math.min(query.limit, Math.max(availableCount - pageOffset, 0));

    const remainingAfterAvailable = query.limit - availableTake;
    const checkAvailabilitySkip = Math.max(pageOffset - availableCount, 0);
    const checkAvailabilityTake = Math.min(
      remainingAfterAvailable,
      Math.max(checkAvailabilityCount - checkAvailabilitySkip, 0),
    );

    const remainingAfterCheckAvailability = remainingAfterAvailable - checkAvailabilityTake;
    const unavailableSkip = Math.max(pageOffset - availableCount - checkAvailabilityCount, 0);
    const unavailableTake = Math.min(
      remainingAfterCheckAvailability,
      Math.max(unavailableCount - unavailableSkip, 0),
    );

    const productOrderBy: Prisma.ProductOrderByWithRelationInput[] = [
      {
        updatedAt: 'desc',
      },
      {
        id: 'desc',
      },
    ];

    const productSelect = {
      id: true,
      sku: true,
      slug: true,
      name: true,
      shortDescription: true,
      priceToman: true,
      salePriceToman: true,
      saleStartsAt: true,
      saleEndsAt: true,
      stockStatus: true,
      stockQuantity: true,
      updatedAt: true,

      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },

      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          imageAlt: true,
        },
      },

      codes: {
        select: {
          type: true,
          value: true,
        },
        orderBy: [
          {
            type: 'asc',
          },
          {
            value: 'asc',
          },
        ],
      },

      images: {
        take: 1,
        orderBy: {
          sortOrder: 'asc',
        },
        select: {
          id: true,
          url: true,
          alt: true,
          sortOrder: true,
        },
      },
    } satisfies Prisma.ProductSelect;

    const [availableProducts, checkAvailabilityProducts, unavailableProducts] = await Promise.all([
      this.prisma.product.findMany({
        where: availableWhere,
        skip: availableSkip,
        take: availableTake,
        orderBy: productOrderBy,
        select: productSelect,
      }),
      this.prisma.product.findMany({
        where: checkAvailabilityWhere,
        skip: checkAvailabilitySkip,
        take: checkAvailabilityTake,
        orderBy: productOrderBy,
        select: productSelect,
      }),
      this.prisma.product.findMany({
        where: unavailableWhere,
        skip: unavailableSkip,
        take: unavailableTake,
        orderBy: productOrderBy,
        select: productSelect,
      }),
    ]);

    const products = [...availableProducts, ...checkAvailabilityProducts, ...unavailableProducts];

    const total = availableCount + checkAvailabilityCount + unavailableCount;

    return {
      data: products.map((product) => this.withComputedPricing(product, now)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        ...this.buildPublicProductWhere({}),
        slug,
      },
      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        shortDescription: true,
        description: true,
        specifications: true,
        priceToman: true,
        salePriceToman: true,
        saleStartsAt: true,
        saleEndsAt: true,
        stockStatus: true,
        stockQuantity: true,
        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        noIndex: true,
        openGraphTitle: true,
        openGraphDescription: true,
        openGraphImageUrl: true,
        openGraphImageAlt: true,
        updatedAt: true,

        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },

        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        codes: {
          select: {
            type: true,
            value: true,
          },
          orderBy: [
            {
              type: 'asc',
            },
            {
              value: 'asc',
            },
          ],
        },

        images: {
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            url: true,
            alt: true,
            sortOrder: true,
          },
        },

        compatibilities: {
          where: {
            vehicleVariant: {
              isActive: true,
              model: {
                isActive: true,
                make: {
                  isActive: true,
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            notes: true,
            requiresVerification: true,

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
                    imageUrl: true,
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

    if (!product) {
      throw new NotFoundException('محصول یافت نشد.');
    }

    return {
      data: this.withComputedPricing(product),
    };
  }

  async findComplementaryProducts(slug: string, limit = 6) {
    const sourceProduct = await this.prisma.product.findFirst({
      where: {
        ...this.buildPublicProductWhere({}),
        slug,
      },

      select: {
        id: true,
        categoryId: true,

        compatibilities: {
          where: {
            vehicleVariant: {
              isActive: true,

              model: {
                isActive: true,

                make: {
                  isActive: true,
                },
              },
            },
          },

          select: {
            vehicleVariant: {
              select: {
                id: true,
                modelId: true,
                engineCode: true,
                engineName: true,
              },
            },
          },
        },
      },
    });

    if (!sourceProduct) {
      throw new NotFoundException('محصول یافت نشد.');
    }

    /*
     * دسته‌های مکمل با همان ترتیبی که
     * ادمین تعریف کرده است.
     */
    const complementRelations = await this.prisma.categoryComplement.findMany({
      where: {
        sourceCategoryId: sourceProduct.categoryId,

        targetCategory: {
          isActive: true,
        },
      },

      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],

      select: {
        targetCategoryId: true,
        sortOrder: true,
      },
    });

    if (complementRelations.length === 0) {
      return {
        data: [],
      };
    }

    const targetCategoryIds = complementRelations.map((relation) => relation.targetCategoryId);

    /*
     * ترتیب دستی Categoryها برای ranking.
     */
    const categoryPriority = new Map<string, number>();

    complementRelations.forEach((relation, index) => {
      categoryPriority.set(relation.targetCategoryId, index);
    });

    const normalizeEngineValue = (value: string | null | undefined) => {
      const normalized = value?.trim().toLocaleLowerCase('en-US');

      return normalized || null;
    };

    const sourceVariantIds = new Set<string>();

    const sourceModelIds = new Set<string>();

    const sourceEngineCodes = new Set<string>();

    const sourceEngineNames = new Set<string>();

    for (const compatibility of sourceProduct.compatibilities) {
      const variant = compatibility.vehicleVariant;

      sourceVariantIds.add(variant.id);

      sourceModelIds.add(variant.modelId);

      const engineCode = normalizeEngineValue(variant.engineCode);

      const engineName = normalizeEngineValue(variant.engineName);

      if (engineCode) {
        sourceEngineCodes.add(engineCode);
      }

      if (engineName) {
        sourceEngineNames.add(engineName);
      }
    }

    const hasSourceCompatibility = sourceProduct.compatibilities.length > 0;

    /*
     * فعلاً pool کوچک و کنترل‌شده.
     * در مقیاس فعلی Partsanj کافی است.
     */
    const candidatePoolSize = Math.min(Math.max(limit * 20, 80), 200);

    const candidates = await this.prisma.product.findMany({
      where: {
        ...this.buildPublicProductWhere({}),

        id: {
          not: sourceProduct.id,
        },

        categoryId: {
          in: targetCategoryIds,
        },
      },

      take: candidatePoolSize,

      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        shortDescription: true,

        priceToman: true,
        salePriceToman: true,
        saleStartsAt: true,
        saleEndsAt: true,

        stockStatus: true,
        stockQuantity: true,

        updatedAt: true,

        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
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
          take: 1,

          orderBy: {
            sortOrder: 'asc',
          },

          select: {
            id: true,
            url: true,
            alt: true,
            sortOrder: true,
          },
        },

        compatibilities: {
          where: {
            vehicleVariant: {
              isActive: true,

              model: {
                isActive: true,

                make: {
                  isActive: true,
                },
              },
            },
          },

          select: {
            vehicleVariant: {
              select: {
                id: true,
                modelId: true,
                engineCode: true,
                engineName: true,
              },
            },
          },
        },
      },
    });

    const scoredCandidates = candidates.flatMap((candidate) => {
      let sharesVariant = false;
      let sharesModel = false;
      let sharesEngine = false;

      for (const compatibility of candidate.compatibilities) {
        const variant = compatibility.vehicleVariant;

        if (sourceVariantIds.has(variant.id)) {
          sharesVariant = true;
        }

        if (sourceModelIds.has(variant.modelId)) {
          sharesModel = true;
        }

        const engineCode = normalizeEngineValue(variant.engineCode);

        const engineName = normalizeEngineValue(variant.engineName);

        if (engineCode && sourceEngineCodes.has(engineCode)) {
          sharesEngine = true;
        }

        if (engineName && sourceEngineNames.has(engineName)) {
          sharesEngine = true;
        }
      }

      /*
       * برای Complementary سخت‌گیرتر از
       * Related هستیم.
       */
      const hasCompatibilityMatch = sharesVariant || sharesModel || sharesEngine;

      if (hasSourceCompatibility && !hasCompatibilityMatch) {
        return [];
      }

      let score = 0;

      /*
       * Fitment اصلی‌ترین سیگنال.
       */
      if (sharesVariant) {
        score += 120;
      } else if (sharesModel) {
        score += 80;
      } else if (sharesEngine) {
        score += 50;
      }

      /*
       * اولویت دستی Complement Category.
       */
      const priority = categoryPriority.get(candidate.category.id) ?? 99;

      score += Math.max(30 - priority * 3, 0);

      /*
       * موجودی tie-breaker است.
       */
      if (candidate.stockStatus === StockStatus.IN_STOCK && candidate.stockQuantity > 0) {
        score += 15;
      } else if (candidate.stockStatus === StockStatus.CHECK_AVAILABILITY) {
        score += 5;
      }

      return [
        {
          candidate,
          score,
        },
      ];
    });

    scoredCandidates.sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return second.candidate.updatedAt.getTime() - first.candidate.updatedAt.getTime();
    });

    const now = new Date();

    const data = scoredCandidates.slice(0, limit).map(({ candidate }) =>
      this.withComputedPricing(
        {
          id: candidate.id,
          sku: candidate.sku,
          slug: candidate.slug,
          name: candidate.name,

          shortDescription: candidate.shortDescription,

          priceToman: candidate.priceToman,

          salePriceToman: candidate.salePriceToman,

          saleStartsAt: candidate.saleStartsAt,

          saleEndsAt: candidate.saleEndsAt,

          stockStatus: candidate.stockStatus,

          stockQuantity: candidate.stockQuantity,

          updatedAt: candidate.updatedAt,

          brand: candidate.brand,

          category: candidate.category,

          images: candidate.images,
        },
        now,
      ),
    );

    return {
      data,
    };
  }

  async findRelatedProducts(slug: string, limit = 8) {
    const sourceProduct = await this.prisma.product.findFirst({
      where: {
        ...this.buildPublicProductWhere({}),
        slug,
      },

      select: {
        id: true,
        categoryId: true,

        compatibilities: {
          where: {
            vehicleVariant: {
              isActive: true,

              model: {
                isActive: true,

                make: {
                  isActive: true,
                },
              },
            },
          },

          select: {
            vehicleVariant: {
              select: {
                id: true,
                modelId: true,

                engineCode: true,
                engineName: true,

                model: {
                  select: {
                    makeId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sourceProduct) {
      throw new NotFoundException('محصول یافت نشد.');
    }

    /*
     * شناسه‌ها و مشخصات سازگاری محصول فعلی.
     */
    const sourceVariantIds = new Set<string>();

    const sourceModelIds = new Set<string>();

    const sourceMakeIds = new Set<string>();

    const sourceEngineKeys = new Set<string>();

    const normalizeEngineValue = (value: string | null | undefined) => {
      const normalized = value?.trim().toLocaleLowerCase('en-US');

      return normalized || null;
    };

    for (const compatibility of sourceProduct.compatibilities) {
      const variant = compatibility.vehicleVariant;

      sourceVariantIds.add(variant.id);

      sourceModelIds.add(variant.modelId);

      sourceMakeIds.add(variant.model.makeId);

      const engineCode = normalizeEngineValue(variant.engineCode);

      const engineName = normalizeEngineValue(variant.engineName);

      if (engineCode) {
        sourceEngineKeys.add(`code:${engineCode}`);
      }

      if (engineName) {
        sourceEngineKeys.add(`name:${engineName}`);
      }
    }

    const hasSourceCompatibility = sourceProduct.compatibilities.length > 0;

    /*
     * فعلاً یک candidate pool کنترل‌شده می‌گیریم.
     *
     * در مقیاس فعلی فروشگاه کاملاً کافی است.
     * اگر بعداً هر دسته صدها/هزاران محصول داشت،
     * این مرحله را به Candidate Generation
     * پیشرفته‌تر منتقل می‌کنیم.
     */
    const candidatePoolSize = Math.min(Math.max(limit * 15, 60), 180);

    const candidates = await this.prisma.product.findMany({
      where: {
        ...this.buildPublicProductWhere({}),

        id: {
          not: sourceProduct.id,
        },

        categoryId: sourceProduct.categoryId,
      },

      take: candidatePoolSize,

      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        shortDescription: true,

        priceToman: true,
        salePriceToman: true,
        saleStartsAt: true,
        saleEndsAt: true,

        stockStatus: true,
        stockQuantity: true,

        updatedAt: true,

        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
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
          take: 1,

          orderBy: {
            sortOrder: 'asc',
          },

          select: {
            id: true,
            url: true,
            alt: true,
            sortOrder: true,
          },
        },

        compatibilities: {
          where: {
            vehicleVariant: {
              isActive: true,

              model: {
                isActive: true,

                make: {
                  isActive: true,
                },
              },
            },
          },

          select: {
            vehicleVariant: {
              select: {
                id: true,
                modelId: true,

                engineCode: true,
                engineName: true,

                model: {
                  select: {
                    makeId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const now = new Date();

    const scoredCandidates = candidates
      .flatMap((candidate) => {
        let sharesVariant = false;
        let sharesModel = false;
        let sharesEngine = false;
        let sharesMake = false;

        for (const compatibility of candidate.compatibilities) {
          const variant = compatibility.vehicleVariant;

          if (sourceVariantIds.has(variant.id)) {
            sharesVariant = true;
          }

          if (sourceModelIds.has(variant.modelId)) {
            sharesModel = true;
          }

          if (sourceMakeIds.has(variant.model.makeId)) {
            sharesMake = true;
          }

          const engineCode = normalizeEngineValue(variant.engineCode);

          const engineName = normalizeEngineValue(variant.engineName);

          if (engineCode && sourceEngineKeys.has(`code:${engineCode}`)) {
            sharesEngine = true;
          }

          if (engineName && sourceEngineKeys.has(`name:${engineName}`)) {
            sharesEngine = true;
          }
        }

        const hasCompatibilityMatch = sharesVariant || sharesModel || sharesEngine || sharesMake;

        /*
         * اگر برای محصول اصلی Fitment داریم،
         * صرفاً same-category بودن کافی نیست.
         *
         * این قسمت جلوی نمایش محصول مربوط به
         * خودروی کاملاً متفاوت را می‌گیرد.
         */
        if (hasSourceCompatibility && !hasCompatibilityMatch) {
          return [];
        }

        /*
         * همه محصولات candidate در یک دسته‌اند.
         */
        let score = 40;

        /*
         * hierarchical scoring:
         *
         * exact variant > model > engine > make
         *
         * عمداً این امتیازها را با هم جمع
         * نمی‌کنیم تا exact match بیش از حد
         * artificial boost نگیرد.
         */
        if (sharesVariant) {
          score += 70;
        } else if (sharesModel) {
          score += 45;
        } else if (sharesEngine) {
          score += 30;
        } else if (sharesMake) {
          score += 15;
        }

        /*
         * موجودی فقط ranking را بهتر می‌کند،
         * نه semantic relevance را.
         */
        if (candidate.stockStatus === StockStatus.IN_STOCK && candidate.stockQuantity > 0) {
          score += 15;
        } else if (candidate.stockStatus === StockStatus.CHECK_AVAILABILITY) {
          score += 5;
        }

        return [
          {
            candidate,
            score,
          },
        ];
      })
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        return second.candidate.updatedAt.getTime() - first.candidate.updatedAt.getTime();
      });

    const data = scoredCandidates.slice(0, limit).map(({ candidate }) =>
      this.withComputedPricing(
        {
          id: candidate.id,
          sku: candidate.sku,
          slug: candidate.slug,
          name: candidate.name,

          shortDescription: candidate.shortDescription,

          priceToman: candidate.priceToman,

          salePriceToman: candidate.salePriceToman,

          saleStartsAt: candidate.saleStartsAt,

          saleEndsAt: candidate.saleEndsAt,

          stockStatus: candidate.stockStatus,

          stockQuantity: candidate.stockQuantity,

          updatedAt: candidate.updatedAt,

          brand: candidate.brand,

          category: candidate.category,

          images: candidate.images,
        },
        now,
      ),
    );

    return {
      data,
    };
  }

  async findHomeFeaturedProducts(query: FindHomeFeaturedProductsQueryDto) {
    const now = new Date();

    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        isPublished: true,
        showOnHome: true,
        brand: {
          isActive: true,
        },
        category: {
          isActive: true,
        },
      },
      take: query.limit,
      orderBy: [
        {
          homeSortOrder: 'asc',
        },
        {
          updatedAt: 'desc',
        },
      ],
      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        shortDescription: true,
        priceToman: true,
        salePriceToman: true,
        saleStartsAt: true,
        saleEndsAt: true,
        stockStatus: true,
        stockQuantity: true,
        updatedAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            imageAlt: true,
          },
        },
        codes: {
          select: {
            type: true,
            value: true,
          },
          orderBy: [
            {
              type: 'asc',
            },
            {
              value: 'asc',
            },
          ],
        },
        images: {
          take: 1,
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            url: true,
            alt: true,
            sortOrder: true,
          },
        },
      },
    });

    return {
      data: products.map((product) => this.withComputedPricing(product, now)),
    };
  }

  private async findCategoryAncestors(parentId: string | null) {
    const ancestors: Array<{
      id: string;
      name: string;
      slug: string;
    }> = [];

    const visitedIds = new Set<string>();

    let currentParentId = parentId;

    while (currentParentId && !visitedIds.has(currentParentId)) {
      visitedIds.add(currentParentId);

      const parent = await this.prisma.category.findFirst({
        where: {
          id: currentParentId,
          isActive: true,
        },

        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
        },
      });

      if (!parent) {
        break;
      }

      ancestors.push({
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
      });

      currentParentId = parent.parentId;
    }

    return ancestors.reverse();
  }

  private withComputedPricing<T extends ProductPricingFields>(product: T, now = new Date()) {
    return getComputedProductPricing(product, now);
  }

  private buildPublicProductWhere(
    query: Pick<
      FindProductsQueryDto,
      'q' | 'brand' | 'category' | 'stockStatus' | 'vehicleVariantId' | 'vehicleModel'
    >,
    categoryScopeIds?: string[],
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      isPublished: true,

      brand: {
        isActive: true,
      },

      category: {
        isActive: true,
      },
    };

    if (query.brand) {
      where.brand = {
        isActive: true,
        slug: query.brand,
      };
    }

    if (query.category) {
      /*
       * اگر slug نامعتبر باشد، categoryScopeIds برابر [] است
       * و Prisma هیچ محصولی برنمی‌گرداند
       */
      where.category = {
        isActive: true,
        id: {
          in: categoryScopeIds ?? [],
        },
      };
    }

    if (query.stockStatus) {
      where.stockStatus = query.stockStatus;
    }

    if (query.vehicleVariantId) {
      /*
       * Exact variant has the highest priority.
       */
      where.compatibilities = {
        some: {
          vehicleVariantId: query.vehicleVariantId,

          vehicleVariant: {
            isActive: true,

            model: {
              isActive: true,

              make: {
                isActive: true,
              },
            },
          },
        },
      };
    } else if (query.vehicleModel) {
      /*
       * Vehicle landing:
       *
       * هر محصولی که حداقل با یکی از
       * Variantهای فعال این Model سازگار باشد.
       */
      where.compatibilities = {
        some: {
          vehicleVariant: {
            isActive: true,

            model: {
              slug: query.vehicleModel,

              isActive: true,

              make: {
                isActive: true,
              },
            },
          },
        },
      };
    }

    if (query.q) {
      where.OR = [
        {
          name: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          codes: {
            some: {
              value: {
                contains: query.q,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    return where;
  }

  private async resolveCategoryScopeIds(categorySlug: string): Promise<string[]> {
    const selectedCategory = await this.prisma.category.findFirst({
      where: {
        slug: categorySlug,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!selectedCategory) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE category_tree AS (
        SELECT "id"
        FROM "Category"
        WHERE "id" = ${selectedCategory.id}

        UNION

        SELECT child."id"
        FROM "Category" AS child
        INNER JOIN category_tree AS parent
          ON child."parentId" = parent."id"
        WHERE child."isActive" = true
      )

      SELECT "id"
      FROM category_tree
    `;

    return rows.map((row) => row.id);
  }
}
