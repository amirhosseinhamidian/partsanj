import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { FindProductsQueryDto } from './dto/find-products.query.dto.js';

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
        parentId: true,
        sortOrder: true,
      },
    });

    return {
      data: categories,
    };
  }

  async findProducts(query: FindProductsQueryDto) {
    const where = this.buildPublicProductWhere(query);
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
      this.prisma.product.count({ where }),
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

  private withComputedPricing<
    T extends {
      priceToman: number | null;
      salePriceToman: number | null;
      saleStartsAt: Date | null;
      saleEndsAt: Date | null;
    },
  >(product: T, now = new Date()) {
    const nowTime = now.getTime();

    const saleHasStarted = !product.saleStartsAt || product.saleStartsAt.getTime() <= nowTime;

    const saleHasNotEnded = !product.saleEndsAt || product.saleEndsAt.getTime() >= nowTime;

    const hasValidSalePrice =
      product.priceToman !== null &&
      product.salePriceToman !== null &&
      product.salePriceToman > 0 &&
      product.salePriceToman < product.priceToman;

    const isSaleActive = hasValidSalePrice && saleHasStarted && saleHasNotEnded;

    const effectivePriceToman = isSaleActive ? product.salePriceToman : product.priceToman;

    const discountAmountToman =
      isSaleActive && product.priceToman !== null && product.salePriceToman !== null
        ? product.priceToman - product.salePriceToman
        : 0;

    const discountPercent =
      isSaleActive && product.priceToman !== null && product.priceToman > 0
        ? Math.round((discountAmountToman / product.priceToman) * 100)
        : 0;

    return {
      ...product,
      effectivePriceToman,
      discountAmountToman,
      discountPercent,
      isSaleActive,
    };
  }

  private buildPublicProductWhere(
    query: Pick<
      FindProductsQueryDto,
      'q' | 'brand' | 'category' | 'stockStatus' | 'vehicleVariantId'
    >,
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
      where.category = {
        isActive: true,
        slug: query.category,
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
}
