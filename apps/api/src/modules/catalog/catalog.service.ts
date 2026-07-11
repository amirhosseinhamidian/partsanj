import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { FindProductsQueryDto } from './dto/find-products.query.dto.js';
import { getComputedProductPricing, type ProductPricingFields } from './catalog-pricing.utils.js';
import { FindHomeFeaturedProductsQueryDto } from './dto/find-home-featured-products.query.dto.js';

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

  async findProducts(query: FindProductsQueryDto) {
    const categoryScopeIds = query.category
      ? await this.resolveCategoryScopeIds(query.category)
      : undefined;

    const where = this.buildPublicProductWhere(query, categoryScopeIds);

    const skip = (query.page - 1) * query.limit;
    const now = new Date();

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          updatedAt: 'desc',
        },
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
      }),

      this.prisma.product.count({
        where,
      }),
    ]);

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
      throw new NotFoundException('Product not found');
    }

    return {
      data: this.withComputedPricing(product),
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

  private withComputedPricing<T extends ProductPricingFields>(product: T, now = new Date()) {
    return getComputedProductPricing(product, now);
  }

  private buildPublicProductWhere(
    query: Pick<
      FindProductsQueryDto,
      'q' | 'brand' | 'category' | 'stockStatus' | 'vehicleVariantId'
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
