import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProductAuditAction,
  ProductCodeType,
  ProductStatus,
  StockStatus,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { FindAdminProductsQueryDto } from './dto/find-admin-products.query.dto.js';
import { ProductCodeInputDto, ProductImageInputDto } from './dto/product-input.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReplaceProductCompatibilitiesDto } from './dto/replace-product-compatibilities.dto.js';

type ProductCodeRecord = {
  type: ProductCodeType;
  value: string;
};

type ProductImageRecord = {
  url: string;
  alt: string | null;
  sortOrder: number;
};

type ProductMutationRecord = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  specifications: unknown;
  priceToman: number | null;
  stockStatus: StockStatus;
  status: ProductStatus;
  isPublished: boolean;
  isTorobEnabled: boolean;
  brandId: string;
  categoryId: string;
  codes: ProductCodeRecord[];
  images: ProductImageRecord[];
};

type ProductStateCandidate = {
  status: ProductStatus;
  isPublished: boolean;
  isTorobEnabled: boolean;
  priceToman: number | null | undefined;
  stockStatus: StockStatus;
  brandIsActive: boolean;
  categoryIsActive: boolean;
  codes: ProductCodeRecord[];
  images: Array<{
    url: string;
    alt?: string | null;
    sortOrder: number;
  }>;
};

@Injectable()
export class CatalogAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findBrands() {
    const brands = await this.prisma.brand.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return {
      data: brands,
    };
  }

  async createBrand(dto: CreateBrandDto) {
    try {
      const brand = await this.prisma.brand.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          isActive: dto.isActive,
        },
      });

      return {
        data: brand,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    this.ensureUpdatePayload(dto);

    const brand = await this.prisma.brand.findUnique({
      where: {
        id,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    try {
      const updatedBrand = await this.prisma.brand.update({
        where: {
          id,
        },
        data: dto,
      });

      return {
        data: updatedBrand,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async findCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    return {
      data: categories,
    };
  }

  async createCategory(dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.ensureCategoryExists(dto.parentId);
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          parentId: dto.parentId ?? null,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      });

      return {
        data: category,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    this.ensureUpdatePayload(dto);

    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasParentIdUpdate = this.hasOwnProperty(dto, 'parentId');

    if (hasParentIdUpdate && dto.parentId) {
      await this.ensureValidCategoryParent(id, dto.parentId);
    }

    const data: Prisma.CategoryUncheckedUpdateInput = {
      ...(dto.name !== undefined && {
        name: dto.name,
      }),
      ...(dto.slug !== undefined && {
        slug: dto.slug,
      }),
      ...(dto.sortOrder !== undefined && {
        sortOrder: dto.sortOrder,
      }),
      ...(dto.isActive !== undefined && {
        isActive: dto.isActive,
      }),
      ...(hasParentIdUpdate && {
        parentId: dto.parentId ?? null,
      }),
    };

    try {
      const updatedCategory = await this.prisma.category.update({
        where: {
          id,
        },
        data,
      });

      return {
        data: updatedCategory,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async findProducts(query: FindAdminProductsQueryDto) {
    const where: Prisma.ProductWhereInput = {};
    const skip = (query.page - 1) * query.limit;

    if (query.status) {
      where.status = query.status;
    }

    if (query.stockStatus) {
      where.stockStatus = query.stockStatus;
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
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
          priceToman: true,
          stockStatus: true,
          status: true,
          isPublished: true,
          isTorobEnabled: true,
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
            orderBy: [
              {
                type: 'asc',
              },
              {
                value: 'asc',
              },
            ],
            select: {
              type: true,
              value: true,
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
        },
      }),
      this.prisma.product.count({
        where,
      }),
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

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        codes: {
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
        },
        auditLogs: {
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
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
        },
        compatibilities: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            notes: true,
            requiresVerification: true,
            createdAt: true,
            updatedAt: true,
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
                isActive: true,
                model: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                    make: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
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
      data: product,
    };
  }

  async createProduct(dto: CreateProductDto, actorUserId: string) {
    this.ensureProductCollections(dto.codes, dto.images);

    const { brand, category } = await this.getBrandAndCategory(dto.brandId, dto.categoryId);

    const candidate: ProductStateCandidate = {
      status: dto.status ?? ProductStatus.DRAFT,
      isPublished: dto.isPublished ?? false,
      isTorobEnabled: dto.isTorobEnabled ?? false,
      priceToman: dto.priceToman,
      stockStatus: dto.stockStatus ?? StockStatus.CHECK_AVAILABILITY,
      brandIsActive: brand.isActive,
      categoryIsActive: category.isActive,
      codes: dto.codes ?? [],
      images: dto.images ?? [],
    };

    this.assertProductState(candidate);

    try {
      const product = await this.prisma.product.create({
        data: {
          sku: dto.sku,
          slug: dto.slug,
          name: dto.name,
          shortDescription: dto.shortDescription,
          description: dto.description,
          ...(dto.specifications !== undefined && {
            specifications: this.toJson(dto.specifications),
          }),
          priceToman: dto.priceToman,
          stockStatus: dto.stockStatus ?? StockStatus.CHECK_AVAILABILITY,
          status: dto.status ?? ProductStatus.DRAFT,
          isPublished: dto.isPublished ?? false,
          isTorobEnabled: dto.isTorobEnabled ?? false,
          brand: {
            connect: {
              id: dto.brandId,
            },
          },
          category: {
            connect: {
              id: dto.categoryId,
            },
          },
          ...(dto.codes?.length && {
            codes: {
              create: dto.codes.map((code) => ({
                type: code.type,
                value: code.value,
              })),
            },
          }),
          ...(dto.images?.length && {
            images: {
              create: dto.images.map((image) => ({
                url: image.url,
                alt: image.alt,
                sortOrder: image.sortOrder,
              })),
            },
          }),
          auditLogs: {
            create: {
              actorUser: {
                connect: {
                  id: actorUserId,
                },
              },
              action: ProductAuditAction.CREATED,
              changes: this.toJson({
                event: 'admin_product_created',
                snapshot: {
                  sku: dto.sku,
                  slug: dto.slug,
                  name: dto.name,
                  brandId: dto.brandId,
                  categoryId: dto.categoryId,
                  priceToman: dto.priceToman ?? null,
                  stockStatus: dto.stockStatus ?? StockStatus.CHECK_AVAILABILITY,
                  status: dto.status ?? ProductStatus.DRAFT,
                  isPublished: dto.isPublished ?? false,
                  isTorobEnabled: dto.isTorobEnabled ?? false,
                  codes: dto.codes ?? [],
                  images: dto.images ?? [],
                },
              }),
            },
          },
        },
        select: {
          id: true,
        },
      });

      return this.findProductById(product.id);
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto, actorUserId: string) {
    this.ensureUpdatePayload(dto);
    this.ensureProductCollections(dto.codes, dto.images);

    const product = await this.findProductForMutation(id);

    const hasCodesUpdate = this.hasOwnProperty(dto, 'codes');
    const hasImagesUpdate = this.hasOwnProperty(dto, 'images');

    const finalBrandId = dto.brandId ?? product.brandId;
    const finalCategoryId = dto.categoryId ?? product.categoryId;

    const { brand, category } = await this.getBrandAndCategory(finalBrandId, finalCategoryId);

    const finalCodes = hasCodesUpdate ? (dto.codes ?? []) : product.codes;

    const finalImages = hasImagesUpdate ? (dto.images ?? []) : product.images;

    const candidate: ProductStateCandidate = {
      status: dto.status ?? product.status,
      isPublished: dto.isPublished ?? product.isPublished,
      isTorobEnabled: dto.isTorobEnabled ?? product.isTorobEnabled,
      priceToman: dto.priceToman ?? product.priceToman,
      stockStatus: dto.stockStatus ?? product.stockStatus,
      brandIsActive: brand.isActive,
      categoryIsActive: category.isActive,
      codes: finalCodes,
      images: finalImages,
    };

    this.assertProductState(candidate);

    const changes = this.buildProductUpdateChanges(product, dto, hasCodesUpdate, hasImagesUpdate);

    if (Object.keys(changes).length === 0) {
      return this.findProductById(id);
    }

    const data: Prisma.ProductUpdateInput = {
      ...(dto.sku !== undefined && {
        sku: dto.sku,
      }),
      ...(dto.slug !== undefined && {
        slug: dto.slug,
      }),
      ...(dto.name !== undefined && {
        name: dto.name,
      }),
      ...(dto.shortDescription !== undefined && {
        shortDescription: dto.shortDescription,
      }),
      ...(dto.description !== undefined && {
        description: dto.description,
      }),
      ...(dto.specifications !== undefined && {
        specifications: this.toJson(dto.specifications),
      }),
      ...(dto.priceToman !== undefined && {
        priceToman: dto.priceToman,
      }),
      ...(dto.stockStatus !== undefined && {
        stockStatus: dto.stockStatus,
      }),
      ...(dto.status !== undefined && {
        status: dto.status,
      }),
      ...(dto.isPublished !== undefined && {
        isPublished: dto.isPublished,
      }),
      ...(dto.isTorobEnabled !== undefined && {
        isTorobEnabled: dto.isTorobEnabled,
      }),
      ...(dto.brandId !== undefined && {
        brand: {
          connect: {
            id: dto.brandId,
          },
        },
      }),
      ...(dto.categoryId !== undefined && {
        category: {
          connect: {
            id: dto.categoryId,
          },
        },
      }),
      ...(hasCodesUpdate && {
        codes: {
          deleteMany: {},
          create: (dto.codes ?? []).map((code) => ({
            type: code.type,
            value: code.value,
          })),
        },
      }),
      ...(hasImagesUpdate && {
        images: {
          deleteMany: {},
          create: (dto.images ?? []).map((image) => ({
            url: image.url,
            alt: image.alt,
            sortOrder: image.sortOrder,
          })),
        },
      }),
      auditLogs: {
        create: {
          actorUser: {
            connect: {
              id: actorUserId,
            },
          },
          action: ProductAuditAction.UPDATED,
          changes: this.toJson({
            event: 'admin_product_updated',
            fields: changes,
          }),
        },
      },
    };

    try {
      await this.prisma.product.update({
        where: {
          id,
        },
        data,
      });

      return this.findProductById(id);
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async archiveProduct(id: string, actorUserId: string) {
    const product = await this.findProductForMutation(id);

    if (product.status === ProductStatus.ARCHIVED) {
      return this.findProductById(id);
    }

    await this.prisma.product.update({
      where: {
        id,
      },
      data: {
        status: ProductStatus.ARCHIVED,
        isPublished: false,
        isTorobEnabled: false,
        auditLogs: {
          create: {
            actorUser: {
              connect: {
                id: actorUserId,
              },
            },
            action: ProductAuditAction.ARCHIVED,
            changes: this.toJson({
              event: 'admin_product_archived',
              fields: {
                status: {
                  before: product.status,
                  after: ProductStatus.ARCHIVED,
                },
                isPublished: {
                  before: product.isPublished,
                  after: false,
                },
                isTorobEnabled: {
                  before: product.isTorobEnabled,
                  after: false,
                },
              },
            }),
          },
        },
      },
    });

    return this.findProductById(id);
  }

  async findProductCompatibilities(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        status: true,
        isPublished: true,
        isTorobEnabled: true,
        compatibilities: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            notes: true,
            requiresVerification: true,
            createdAt: true,
            updatedAt: true,
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
                isActive: true,
                model: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    isActive: true,
                    make: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
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
      data: product,
    };
  }

  async replaceProductCompatibilities(
    productId: string,
    dto: ReplaceProductCompatibilitiesDto,
    actorUserId: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        compatibilities: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            vehicleVariantId: true,
            notes: true,
            requiresVerification: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const vehicleVariantIds = dto.items.map((item) => item.vehicleVariantId);

    await this.ensureVehicleVariantsAreActive(vehicleVariantIds);

    const before = product.compatibilities.map((compatibility) => ({
      vehicleVariantId: compatibility.vehicleVariantId,
      notes: compatibility.notes,
      requiresVerification: compatibility.requiresVerification,
    }));

    const after = dto.items.map((item) => ({
      vehicleVariantId: item.vehicleVariantId,
      notes: item.notes ?? null,
      requiresVerification: item.requiresVerification ?? false,
    }));

    await this.prisma.$transaction(async (transaction) => {
      await transaction.productVehicleCompatibility.deleteMany({
        where: {
          productId,
        },
      });

      if (dto.items.length > 0) {
        await transaction.productVehicleCompatibility.createMany({
          data: dto.items.map((item) => ({
            productId,
            vehicleVariantId: item.vehicleVariantId,
            notes: item.notes ?? null,
            requiresVerification: item.requiresVerification ?? false,
          })),
        });
      }

      await transaction.productAuditLog.create({
        data: {
          productId,
          actorUserId,
          action: ProductAuditAction.COMPATIBILITIES_UPDATED,
          changes: this.toJson({
            event: 'admin_product_compatibilities_replaced',
            before,
            after,
          }),
        },
      });

      await transaction.product.update({
        where: {
          id: productId,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    });

    return this.findProductCompatibilities(productId);
  }

  private async findProductForMutation(id: string): Promise<ProductMutationRecord> {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
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
        status: true,
        isPublished: true,
        isTorobEnabled: true,
        brandId: true,
        categoryId: true,
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
          select: {
            url: true,
            alt: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async getBrandAndCategory(brandId: string, categoryId: string) {
    const [brand, category] = await Promise.all([
      this.prisma.brand.findUnique({
        where: {
          id: brandId,
        },
        select: {
          id: true,
          isActive: true,
        },
      }),
      this.prisma.category.findUnique({
        where: {
          id: categoryId,
        },
        select: {
          id: true,
          isActive: true,
        },
      }),
    ]);

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      brand,
      category,
    };
  }

  private async ensureVehicleVariantsAreActive(vehicleVariantIds: string[]): Promise<void> {
    if (vehicleVariantIds.length === 0) {
      return;
    }

    const variants = await this.prisma.vehicleVariant.findMany({
      where: {
        id: {
          in: vehicleVariantIds,
        },
      },
      select: {
        id: true,
        isActive: true,
        model: {
          select: {
            isActive: true,
            make: {
              select: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    const hasInvalidVariant =
      variants.length !== vehicleVariantIds.length ||
      variants.some(
        (variant) => !variant.isActive || !variant.model.isActive || !variant.model.make.isActive,
      );

    if (hasInvalidVariant) {
      throw new BadRequestException('One or more vehicle variants do not exist or are inactive');
    }
  }

  private assertProductState(candidate: ProductStateCandidate): void {
    if (candidate.isPublished && candidate.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('A published product must have ACTIVE status');
    }

    if (candidate.isPublished && (!candidate.brandIsActive || !candidate.categoryIsActive)) {
      throw new BadRequestException('A published product requires an active brand and category');
    }

    if (!candidate.isTorobEnabled) {
      return;
    }

    if (candidate.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('Torob requires an ACTIVE product');
    }

    if (!candidate.isPublished) {
      throw new BadRequestException('Torob requires a published product');
    }

    if (!candidate.brandIsActive || !candidate.categoryIsActive) {
      throw new BadRequestException('Torob requires an active brand and category');
    }

    if (
      candidate.priceToman === null ||
      candidate.priceToman === undefined ||
      candidate.priceToman <= 0
    ) {
      throw new BadRequestException('Torob requires a valid product price');
    }

    if (candidate.stockStatus !== StockStatus.IN_STOCK) {
      throw new BadRequestException('Torob requires product stock status to be IN_STOCK');
    }

    if (candidate.codes.length === 0) {
      throw new BadRequestException('Torob requires at least one product code');
    }

    if (candidate.images.length === 0) {
      throw new BadRequestException('Torob requires at least one product image');
    }
  }

  private ensureProductCollections(
    codes: ProductCodeInputDto[] | undefined,
    images: ProductImageInputDto[] | undefined,
  ): void {
    if (codes) {
      const keys = new Set<string>();

      for (const code of codes) {
        const key = `${code.type}:${code.value}`;

        if (keys.has(key)) {
          throw new BadRequestException('Duplicate product code type and value are not allowed');
        }

        keys.add(key);
      }
    }

    if (images) {
      const sortOrders = new Set<number>();

      for (const image of images) {
        if (sortOrders.has(image.sortOrder)) {
          throw new BadRequestException('Duplicate product image sort order is not allowed');
        }

        sortOrders.add(image.sortOrder);
      }
    }
  }

  private buildProductUpdateChanges(
    product: ProductMutationRecord,
    dto: UpdateProductDto,
    hasCodesUpdate: boolean,
    hasImagesUpdate: boolean,
  ): Record<string, unknown> {
    const changes: Record<string, unknown> = {};

    this.addChange(changes, 'sku', product.sku, dto.sku);
    this.addChange(changes, 'slug', product.slug, dto.slug);
    this.addChange(changes, 'name', product.name, dto.name);
    this.addChange(changes, 'shortDescription', product.shortDescription, dto.shortDescription);
    this.addChange(changes, 'priceToman', product.priceToman, dto.priceToman);
    this.addChange(changes, 'stockStatus', product.stockStatus, dto.stockStatus);
    this.addChange(changes, 'status', product.status, dto.status);
    this.addChange(changes, 'isPublished', product.isPublished, dto.isPublished);
    this.addChange(changes, 'isTorobEnabled', product.isTorobEnabled, dto.isTorobEnabled);
    this.addChange(changes, 'brandId', product.brandId, dto.brandId);
    this.addChange(changes, 'categoryId', product.categoryId, dto.categoryId);
    this.addChange(changes, 'specifications', product.specifications, dto.specifications);

    if (dto.description !== undefined && dto.description !== product.description) {
      changes.description = {
        beforeLength: product.description?.length ?? 0,
        afterLength: dto.description.length,
      };
    }

    if (hasCodesUpdate) {
      this.addChange(changes, 'codes', product.codes, dto.codes ?? []);
    }

    if (hasImagesUpdate) {
      this.addChange(changes, 'images', product.images, dto.images ?? []);
    }

    return changes;
  }

  private addChange(
    changes: Record<string, unknown>,
    field: string,
    before: unknown,
    after: unknown,
  ): void {
    if (after === undefined || this.valuesEqual(before, after)) {
      return;
    }

    changes[field] = {
      before,
      after,
    };
  }

  private valuesEqual(left: unknown, right: unknown): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new BadRequestException('Value cannot be converted to JSON');
    }

    return JSON.parse(serialized) as Prisma.InputJsonValue;
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Parent category not found');
    }
  }

  private async ensureValidCategoryParent(categoryId: string, parentId: string): Promise<void> {
    if (categoryId === parentId) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const visitedCategoryIds = new Set<string>();
    let currentCategoryId: string | null = parentId;

    while (currentCategoryId) {
      if (currentCategoryId === categoryId) {
        throw new BadRequestException('Category hierarchy cannot contain a cycle');
      }

      if (visitedCategoryIds.has(currentCategoryId)) {
        throw new BadRequestException('Category hierarchy is invalid');
      }

      visitedCategoryIds.add(currentCategoryId);

      const currentCategory: {
        id: string;
        parentId: string | null;
      } | null = await this.prisma.category.findUnique({
        where: {
          id: currentCategoryId,
        },
        select: {
          id: true,
          parentId: true,
        },
      });

      if (!currentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      currentCategoryId = currentCategory.parentId;
    }
  }

  private ensureUpdatePayload(payload: object): void {
    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }
  }

  private hasOwnProperty(object: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A record with the same unique value already exists');
    }

    throw error;
  }
}
