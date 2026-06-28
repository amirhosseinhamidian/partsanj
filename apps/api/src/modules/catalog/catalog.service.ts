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
          stockStatus: true,
          updatedAt: true,
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
      data: products,
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
        stockStatus: true,
        updatedAt: true,
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
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      data: product,
    };
  }

  private buildPublicProductWhere(
    query: Pick<FindProductsQueryDto, 'q' | 'brand' | 'category' | 'stockStatus'>,
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
