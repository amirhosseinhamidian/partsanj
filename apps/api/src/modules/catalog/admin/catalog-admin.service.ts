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
  AdminAuditAction,
  AdminAuditEntityType,
  VehicleYearCalendar,
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
import { CreateVehicleMakeDto } from './dto/create-vehicle-make.dto.js';
import { UpdateVehicleMakeDto } from './dto/update-vehicle-make.dto.js';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto.js';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto.js';
import { CreateVehicleVariantDto } from './dto/create-vehicle-variant.dto.js';
import { UpdateVehicleVariantDto } from './dto/update-vehicle-variant.dto.js';
import { FindAdminAuditLogsQueryDto } from './dto/find-admin-audit-logs.query.dto.js';

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
  salePriceToman: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;

  stockStatus: StockStatus;
  status: ProductStatus;
  isPublished: boolean;
  isTorobEnabled: boolean;

  showOnHome: boolean;
  homeSortOrder: number;

  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;

  brandId: string;
  categoryId: string;

  codes: ProductCodeRecord[];
  images: ProductImageRecord[];
};

type ProductStateCandidate = {
  status: ProductStatus;
  isPublished: boolean;
  isTorobEnabled: boolean;

  priceToman: number | null;
  salePriceToman: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;

  stockStatus: StockStatus;
  brandIsActive: boolean;
  categoryIsActive: boolean;
  showOnHome: boolean;

  codes: ProductCodeRecord[];
  images: Array<{
    url: string;
    alt?: string | null;
    sortOrder: number;
  }>;
};

type WriteAdminAuditLogInput = {
  actorUserId: string;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabel: string;
  action: AdminAuditAction;
  changes: unknown;
};

type ProductCompatibilityAuditSource = {
  vehicleVariantId: string;
  notes: string | null;
  requiresVerification: boolean;
  vehicleVariant: {
    name: string;
    engineCode: string | null;
    engineName: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    yearCalendar: VehicleYearCalendar;
    model: {
      name: string;
      make: {
        name: string;
      };
    };
  };
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

  async createBrand(dto: CreateBrandDto, actorUserId: string) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const brand = await transaction.brand.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            logoUrl: dto.logoUrl ?? null,
            isActive: dto.isActive ?? true,
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.BRAND,
          entityId: brand.id,
          entityLabel: brand.name,
          action: AdminAuditAction.CREATED,
          changes: {
            event: 'admin_brand_created',
            snapshot: {
              name: brand.name,
              slug: brand.slug,
              logoUrl: brand.logoUrl,
              isActive: brand.isActive,
            },
          },
        });

        return {
          data: brand,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateBrand(id: string, dto: UpdateBrandDto, actorUserId: string) {
    this.ensureUpdatePayload(dto);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const brand = await transaction.brand.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isActive: true,
          },
        });

        if (!brand) {
          throw new NotFoundException('Brand not found');
        }

        const changes: Record<string, unknown> = {};

        this.addChange(changes, 'name', brand.name, dto.name);
        this.addChange(changes, 'slug', brand.slug, dto.slug);
        this.addChange(changes, 'logoUrl', brand.logoUrl, dto.logoUrl);
        this.addChange(changes, 'isActive', brand.isActive, dto.isActive);

        if (Object.keys(changes).length === 0) {
          return {
            data: brand,
          };
        }

        const data: Prisma.BrandUpdateInput = {
          ...(dto.name !== undefined && {
            name: dto.name,
          }),
          ...(dto.slug !== undefined && {
            slug: dto.slug,
          }),
          ...(dto.logoUrl !== undefined && {
            logoUrl: dto.logoUrl,
          }),
          ...(dto.isActive !== undefined && {
            isActive: dto.isActive,
          }),
        };

        const updatedBrand = await transaction.brand.update({
          where: {
            id,
          },
          data,
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.BRAND,
          entityId: updatedBrand.id,
          entityLabel: updatedBrand.name,
          action: AdminAuditAction.UPDATED,
          changes: {
            event: 'admin_brand_updated',
            fields: changes,
          },
        });

        return {
          data: updatedBrand,
        };
      });
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

  async createCategory(dto: CreateCategoryDto, actorUserId: string) {
    if (dto.parentId) {
      await this.ensureCategoryExists(dto.parentId);
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const category = await transaction.category.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            imageUrl: dto.imageUrl ?? null,
            imageAlt: dto.imageAlt ?? null,
            parentId: dto.parentId ?? null,
            sortOrder: dto.sortOrder ?? 0,
            isActive: dto.isActive ?? true,
            showOnHome: dto.showOnHome ?? false,
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.CATEGORY,
          entityId: category.id,
          entityLabel: category.name,
          action: AdminAuditAction.CREATED,
          changes: {
            event: 'admin_category_created',
            snapshot: {
              name: category.name,
              slug: category.slug,
              parentId: category.parentId,
              sortOrder: category.sortOrder,
              isActive: category.isActive,
              imageUrl: category.imageUrl,
              imageAlt: category.imageAlt,
              showOnHome: category.showOnHome,
            },
          },
        });

        return {
          data: category,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, actorUserId: string) {
    this.ensureUpdatePayload(dto);

    const hasParentIdUpdate = this.hasOwnProperty(dto, 'parentId');

    if (hasParentIdUpdate && dto.parentId) {
      await this.ensureValidCategoryParent(id, dto.parentId);
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const category = await transaction.category.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            sortOrder: true,
            isActive: true,
            imageUrl: true,
            imageAlt: true,
            showOnHome: true,
          },
        });

        if (!category) {
          throw new NotFoundException('Category not found');
        }

        const changes: Record<string, unknown> = {};

        this.addChange(changes, 'name', category.name, dto.name);
        this.addChange(changes, 'slug', category.slug, dto.slug);
        this.addChange(changes, 'sortOrder', category.sortOrder, dto.sortOrder);
        this.addChange(changes, 'isActive', category.isActive, dto.isActive);
        this.addChange(changes, 'imageUrl', category.imageUrl, dto.imageUrl);
        this.addChange(changes, 'imageAlt', category.imageAlt, dto.imageAlt);
        this.addChange(changes, 'showOnHome', category.showOnHome, dto.showOnHome);

        if (hasParentIdUpdate) {
          this.addChange(changes, 'parentId', category.parentId, dto.parentId ?? null);
        }

        if (Object.keys(changes).length === 0) {
          return {
            data: category,
          };
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
          ...(dto.imageUrl !== undefined && {
            imageUrl: dto.imageUrl,
          }),
          ...(dto.imageAlt !== undefined && {
            imageAlt: dto.imageAlt,
          }),
          ...(dto.showOnHome !== undefined && {
            showOnHome: dto.showOnHome,
          }),
        };

        const updatedCategory = await transaction.category.update({
          where: {
            id,
          },
          data,
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.CATEGORY,
          entityId: updatedCategory.id,
          entityLabel: updatedCategory.name,
          action: AdminAuditAction.UPDATED,
          changes: {
            event: 'admin_category_updated',
            fields: changes,
          },
        });

        return {
          data: updatedCategory,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasChildren = category._count.children > 0;
    const hasProducts = category._count.products > 0;

    if (hasChildren || hasProducts) {
      throw new ConflictException({
        message: 'Category cannot be deleted because it has dependent records',
        code: 'CATEGORY_HAS_DEPENDENCIES',
        childrenCount: category._count.children,
        productsCount: category._count.products,
      });
    }

    try {
      const deletedCategory = await this.prisma.category.delete({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      return {
        data: deletedCategory,
      };
    } catch (error) {
      /*
        اگر بین بررسی وابستگی‌ها و حذف، یک Product یا Child جدید ثبت شود،
        Prisma با P2003 حذف را مسدود می‌کند
      */
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException({
          message: 'Category cannot be deleted because it has dependent records',
          code: 'CATEGORY_HAS_DEPENDENCIES',
        });
      }

      this.rethrowKnownDatabaseError(error);
    }
  }

  async findActiveVehicleMakes() {
    const makes = await this.prisma.vehicleMake.findMany({
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
      },
    });

    return {
      data: makes,
    };
  }

  async findActiveVehicleModels(makeId: string) {
    const models = await this.prisma.vehicleModel.findMany({
      where: {
        makeId,
        isActive: true,
        make: {
          is: {
            isActive: true,
          },
        },
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
        makeId: true,
      },
    });

    return {
      data: models,
    };
  }

  async findActiveVehicleVariants(modelId: string) {
    const variants = await this.prisma.vehicleVariant.findMany({
      where: {
        modelId,
        isActive: true,
        model: {
          is: {
            isActive: true,
            make: {
              is: {
                isActive: true,
              },
            },
          },
        },
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
    });

    return {
      data: variants,
    };
  }

  async findVehicleMakes() {
    const makes = await this.prisma.vehicleMake.findMany({
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      include: {
        _count: {
          select: {
            models: true,
          },
        },
      },
    });

    return {
      data: makes,
    };
  }

  async createVehicleMake(dto: CreateVehicleMakeDto, actorUserId: string) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const make = await transaction.vehicleMake.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            logoUrl: dto.logoUrl ?? null,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
          },
          include: {
            _count: {
              select: {
                models: true,
              },
            },
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.VEHICLE_MAKE,
          entityId: make.id,
          entityLabel: make.name,
          action: AdminAuditAction.CREATED,
          changes: {
            event: 'admin_vehicle_make_created',
            snapshot: {
              name: make.name,
              slug: make.slug,
              logoUrl: make.logoUrl,
              isActive: make.isActive,
              sortOrder: make.sortOrder,
            },
          },
        });

        return {
          data: make,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateVehicleMake(id: string, dto: UpdateVehicleMakeDto, actorUserId: string) {
    this.ensureUpdatePayload(dto);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const make = await transaction.vehicleMake.findUnique({
          where: {
            id,
          },
          include: {
            _count: {
              select: {
                models: true,
              },
            },
          },
        });

        if (!make) {
          throw new NotFoundException('Vehicle make not found');
        }

        const changes: Record<string, unknown> = {};

        this.addChange(changes, 'name', make.name, dto.name);
        this.addChange(changes, 'slug', make.slug, dto.slug);
        this.addChange(changes, 'logoUrl', make.logoUrl, dto.logoUrl);
        this.addChange(changes, 'isActive', make.isActive, dto.isActive);
        this.addChange(changes, 'sortOrder', make.sortOrder, dto.sortOrder);

        if (Object.keys(changes).length === 0) {
          return {
            data: make,
          };
        }

        const updatedMake = await transaction.vehicleMake.update({
          where: {
            id,
          },
          data: {
            ...(dto.name !== undefined && {
              name: dto.name,
            }),
            ...(dto.slug !== undefined && {
              slug: dto.slug,
            }),
            ...(dto.logoUrl !== undefined && {
              logoUrl: dto.logoUrl,
            }),
            ...(dto.isActive !== undefined && {
              isActive: dto.isActive,
            }),
            ...(dto.sortOrder !== undefined && {
              sortOrder: dto.sortOrder,
            }),
          },
          include: {
            _count: {
              select: {
                models: true,
              },
            },
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.VEHICLE_MAKE,
          entityId: updatedMake.id,
          entityLabel: updatedMake.name,
          action: AdminAuditAction.UPDATED,
          changes: {
            event: 'admin_vehicle_make_updated',
            fields: changes,
          },
        });

        return {
          data: updatedMake,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async findVehicleModels() {
    const models = await this.prisma.vehicleModel.findMany({
      orderBy: [
        {
          make: {
            sortOrder: 'asc',
          },
        },
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      include: {
        make: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isActive: true,
            sortOrder: true,
          },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    return {
      data: models,
    };
  }

  async createVehicleModel(dto: CreateVehicleModelDto, actorUserId: string) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const make = await transaction.vehicleMake.findUnique({
          where: {
            id: dto.makeId,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        });

        if (!make) {
          throw new NotFoundException('Vehicle make not found');
        }

        const model = await transaction.vehicleModel.create({
          data: {
            makeId: dto.makeId,
            name: dto.name,
            slug: dto.slug,
            imageUrl: dto.imageUrl ?? null,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
          },
          include: {
            make: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isActive: true,
                sortOrder: true,
              },
            },
            _count: {
              select: {
                variants: true,
              },
            },
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.VEHICLE_MODEL,
          entityId: model.id,
          entityLabel: `${model.make.name} · ${model.name}`,
          action: AdminAuditAction.CREATED,
          changes: {
            event: 'admin_vehicle_model_created',
            snapshot: {
              make: {
                id: model.make.id,
                name: model.make.name,
                slug: model.make.slug,
              },
              name: model.name,
              slug: model.slug,
              imageUrl: model.imageUrl,
              isActive: model.isActive,
              sortOrder: model.sortOrder,
            },
          },
        });

        return {
          data: model,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateVehicleModel(id: string, dto: UpdateVehicleModelDto, actorUserId: string) {
    this.ensureUpdatePayload(dto);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const model = await transaction.vehicleModel.findUnique({
          where: {
            id,
          },
          include: {
            make: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
            _count: {
              select: {
                variants: true,
              },
            },
          },
        });

        if (!model) {
          throw new NotFoundException('Vehicle model not found');
        }

        const requestedMakeId = dto.makeId;

        const isMovingToAnotherMake =
          requestedMakeId !== undefined && requestedMakeId !== model.makeId;

        let targetMake = model.make;

        if (isMovingToAnotherMake) {
          if (model._count.variants > 0) {
            throw new BadRequestException(
              'A vehicle model with variants cannot be moved to another make',
            );
          }

          const requestedMake = await transaction.vehicleMake.findUnique({
            where: {
              id: requestedMakeId,
            },
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
            },
          });

          if (!requestedMake) {
            throw new NotFoundException('Vehicle make not found');
          }

          targetMake = requestedMake;
        }

        const changes: Record<string, unknown> = {};

        this.addChange(changes, 'name', model.name, dto.name);
        this.addChange(changes, 'slug', model.slug, dto.slug);
        this.addChange(changes, 'imageUrl', model.imageUrl, dto.imageUrl);
        this.addChange(changes, 'isActive', model.isActive, dto.isActive);
        this.addChange(changes, 'sortOrder', model.sortOrder, dto.sortOrder);

        if (isMovingToAnotherMake) {
          changes.make = {
            from: {
              id: model.make.id,
              name: model.make.name,
              slug: model.make.slug,
            },
            to: {
              id: targetMake.id,
              name: targetMake.name,
              slug: targetMake.slug,
            },
          };
        }

        if (Object.keys(changes).length === 0) {
          return {
            data: model,
          };
        }

        const updatedModel = await transaction.vehicleModel.update({
          where: {
            id,
          },
          data: {
            ...(dto.name !== undefined && {
              name: dto.name,
            }),
            ...(dto.slug !== undefined && {
              slug: dto.slug,
            }),
            ...(dto.imageUrl !== undefined && {
              imageUrl: dto.imageUrl,
            }),
            ...(dto.isActive !== undefined && {
              isActive: dto.isActive,
            }),
            ...(dto.sortOrder !== undefined && {
              sortOrder: dto.sortOrder,
            }),
            ...(requestedMakeId !== undefined && {
              makeId: requestedMakeId,
            }),
          },
          include: {
            make: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isActive: true,
                sortOrder: true,
              },
            },
            _count: {
              select: {
                variants: true,
              },
            },
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.VEHICLE_MODEL,
          entityId: updatedModel.id,
          entityLabel: `${updatedModel.make.name} · ${updatedModel.name}`,
          action: AdminAuditAction.UPDATED,
          changes: {
            event: 'admin_vehicle_model_updated',
            fields: changes,
          },
        });

        return {
          data: updatedModel,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async findVehicleVariants() {
    const variants = await this.prisma.vehicleVariant.findMany({
      orderBy: [
        {
          model: {
            make: {
              sortOrder: 'asc',
            },
          },
        },
        {
          model: {
            sortOrder: 'asc',
          },
        },
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      include: {
        model: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            imageUrl: true,
            sortOrder: true,
            make: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isActive: true,
                sortOrder: true,
              },
            },
          },
        },
        _count: {
          select: {
            compatibilities: true,
          },
        },
      },
    });

    return {
      data: variants,
    };
  }

  async createVehicleVariant(dto: CreateVehicleVariantDto, actorUserId: string) {
    this.assertVehicleVariantYears(dto.yearFrom ?? null, dto.yearTo ?? null);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const model = await transaction.vehicleModel.findUnique({
          where: {
            id: dto.modelId,
          },
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
        });

        if (!model) {
          throw new NotFoundException('Vehicle model not found');
        }

        const variant = await transaction.vehicleVariant.create({
          data: {
            modelId: dto.modelId,
            name: dto.name,
            slug: dto.slug,
            engineCode: dto.engineCode ?? null,
            engineName: dto.engineName ?? null,
            yearFrom: dto.yearFrom ?? null,
            yearTo: dto.yearTo ?? null,
            yearCalendar: dto.yearCalendar ?? VehicleYearCalendar.SHAMSI,
            notes: dto.notes ?? null,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
          },
          include: {
            model: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                isActive: true,
                sortOrder: true,
                make: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                    isActive: true,
                    sortOrder: true,
                  },
                },
              },
            },
            _count: {
              select: {
                compatibilities: true,
              },
            },
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.VEHICLE_VARIANT,
          entityId: variant.id,
          entityLabel: `${variant.model.make.name} · ${variant.model.name} · ${variant.name}`,
          action: AdminAuditAction.CREATED,
          changes: {
            event: 'admin_vehicle_variant_created',
            snapshot: {
              model: {
                id: variant.model.id,
                name: variant.model.name,
                slug: variant.model.slug,
                make: {
                  id: variant.model.make.id,
                  name: variant.model.make.name,
                  slug: variant.model.make.slug,
                },
              },
              name: variant.name,
              slug: variant.slug,
              engineCode: variant.engineCode,
              engineName: variant.engineName,
              yearFrom: variant.yearFrom,
              yearTo: variant.yearTo,
              yearCalendar: variant.yearCalendar,
              notes: variant.notes,
              isActive: variant.isActive,
              sortOrder: variant.sortOrder,
            },
          },
        });

        return {
          data: variant,
        };
      });
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateVehicleVariant(id: string, dto: UpdateVehicleVariantDto, actorUserId: string) {
    this.ensureUpdatePayload(dto);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const variant = await transaction.vehicleVariant.findUnique({
          where: {
            id,
          },
          include: {
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
            _count: {
              select: {
                compatibilities: true,
              },
            },
          },
        });

        if (!variant) {
          throw new NotFoundException('Vehicle variant not found');
        }

        const requestedModelId = dto.modelId;

        const isMovingToAnotherModel =
          requestedModelId !== undefined && requestedModelId !== variant.modelId;

        let targetModel = variant.model;

        if (isMovingToAnotherModel) {
          if (variant._count.compatibilities > 0) {
            throw new BadRequestException(
              'A vehicle variant used by product compatibilities cannot be moved to another model',
            );
          }

          const requestedModel = await transaction.vehicleModel.findUnique({
            where: {
              id: requestedModelId,
            },
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
          });

          if (!requestedModel) {
            throw new NotFoundException('Vehicle model not found');
          }

          targetModel = requestedModel;
        }

        const hasYearFromUpdate = this.hasOwnProperty(dto, 'yearFrom');

        const hasYearToUpdate = this.hasOwnProperty(dto, 'yearTo');

        const finalYearFrom = hasYearFromUpdate ? (dto.yearFrom ?? null) : variant.yearFrom;

        const finalYearTo = hasYearToUpdate ? (dto.yearTo ?? null) : variant.yearTo;

        this.assertVehicleVariantYears(finalYearFrom, finalYearTo);

        const changes: Record<string, unknown> = {};

        this.addChange(changes, 'name', variant.name, dto.name);
        this.addChange(changes, 'slug', variant.slug, dto.slug);
        this.addChange(changes, 'engineCode', variant.engineCode, dto.engineCode);
        this.addChange(changes, 'engineName', variant.engineName, dto.engineName);

        if (hasYearFromUpdate) {
          this.addChange(changes, 'yearFrom', variant.yearFrom, finalYearFrom);
        }

        if (hasYearToUpdate) {
          this.addChange(changes, 'yearTo', variant.yearTo, finalYearTo);
        }

        this.addChange(changes, 'yearCalendar', variant.yearCalendar, dto.yearCalendar);
        this.addChange(changes, 'notes', variant.notes, dto.notes);
        this.addChange(changes, 'isActive', variant.isActive, dto.isActive);
        this.addChange(changes, 'sortOrder', variant.sortOrder, dto.sortOrder);

        if (isMovingToAnotherModel) {
          changes.model = {
            from: {
              id: variant.model.id,
              name: variant.model.name,
              slug: variant.model.slug,
              make: {
                id: variant.model.make.id,
                name: variant.model.make.name,
                slug: variant.model.make.slug,
              },
            },
            to: {
              id: targetModel.id,
              name: targetModel.name,
              slug: targetModel.slug,
              make: {
                id: targetModel.make.id,
                name: targetModel.make.name,
                slug: targetModel.make.slug,
              },
            },
          };
        }

        if (Object.keys(changes).length === 0) {
          return {
            data: variant,
          };
        }

        const updatedVariant = await transaction.vehicleVariant.update({
          where: {
            id,
          },
          data: {
            ...(dto.name !== undefined && {
              name: dto.name,
            }),
            ...(dto.slug !== undefined && {
              slug: dto.slug,
            }),
            ...(dto.engineCode !== undefined && {
              engineCode: dto.engineCode,
            }),
            ...(dto.engineName !== undefined && {
              engineName: dto.engineName,
            }),
            ...(hasYearFromUpdate && {
              yearFrom: finalYearFrom,
            }),
            ...(hasYearToUpdate && {
              yearTo: finalYearTo,
            }),
            ...(dto.yearCalendar !== undefined && {
              yearCalendar: dto.yearCalendar,
            }),
            ...(dto.notes !== undefined && {
              notes: dto.notes,
            }),
            ...(dto.isActive !== undefined && {
              isActive: dto.isActive,
            }),
            ...(dto.sortOrder !== undefined && {
              sortOrder: dto.sortOrder,
            }),
            ...(requestedModelId !== undefined && {
              modelId: requestedModelId,
            }),
          },
          include: {
            model: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                isActive: true,
                sortOrder: true,
                make: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                    isActive: true,
                    sortOrder: true,
                  },
                },
              },
            },
            _count: {
              select: {
                compatibilities: true,
              },
            },
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.VEHICLE_VARIANT,
          entityId: updatedVariant.id,
          entityLabel: `${updatedVariant.model.make.name} · ${updatedVariant.model.name} · ${updatedVariant.name}`,
          action: AdminAuditAction.UPDATED,
          changes: {
            event: 'admin_vehicle_variant_updated',
            fields: changes,
          },
        });

        return {
          data: updatedVariant,
        };
      });
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
          salePriceToman: true,
          saleStartsAt: true,
          saleEndsAt: true,
          stockStatus: true,
          status: true,
          isPublished: true,
          isTorobEnabled: true,
          showOnHome: true,
          homeSortOrder: true,
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
      data: products.map((product) => this.withComputedPricing(product)),
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
                    imageUrl: true,
                    isActive: true,
                    make: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
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

    const auditLogs = await this.prisma.adminAuditLog.findMany({
      where: {
        entityType: AdminAuditEntityType.PRODUCT,
        entityId: id,
      },
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
    });

    return {
      data: {
        ...this.withComputedPricing(product),
        auditLogs,
      },
    };
  }

  async createProduct(dto: CreateProductDto, actorUserId: string) {
    this.ensureProductCollections(dto.codes, dto.images);

    const { brand, category } = await this.getBrandAndCategory(dto.brandId, dto.categoryId);
    const saleStartsAt = this.toNullableDate(dto.saleStartsAt);
    const saleEndsAt = this.toNullableDate(dto.saleEndsAt);

    const candidate: ProductStateCandidate = {
      status: dto.status ?? ProductStatus.DRAFT,
      isPublished: dto.isPublished ?? false,
      isTorobEnabled: dto.isTorobEnabled ?? false,

      priceToman: dto.priceToman ?? null,
      salePriceToman: dto.salePriceToman ?? null,
      saleStartsAt,
      saleEndsAt,
      showOnHome: dto.showOnHome ?? false,

      stockStatus: dto.stockStatus ?? StockStatus.CHECK_AVAILABILITY,
      brandIsActive: brand.isActive,
      categoryIsActive: category.isActive,
      codes: dto.codes ?? [],
      images: dto.images ?? [],
    };

    this.assertProductState(candidate);

    const auditChanges = {
      event: 'admin_product_created',
      snapshot: {
        sku: dto.sku,
        slug: dto.slug,
        name: dto.name,
        brandId: dto.brandId,
        categoryId: dto.categoryId,

        shortDescription: dto.shortDescription ?? null,
        description: dto.description ?? null,
        specifications: dto.specifications ?? null,

        priceToman: dto.priceToman ?? null,
        salePriceToman: dto.salePriceToman ?? null,
        saleStartsAt: dto.saleStartsAt ?? null,
        saleEndsAt: dto.saleEndsAt ?? null,

        stockStatus: dto.stockStatus ?? StockStatus.CHECK_AVAILABILITY,
        status: dto.status ?? ProductStatus.DRAFT,
        isPublished: dto.isPublished ?? false,
        isTorobEnabled: dto.isTorobEnabled ?? false,

        showOnHome: dto.showOnHome ?? false,
        homeSortOrder: dto.homeSortOrder ?? 0,

        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
        canonicalUrl: dto.canonicalUrl ?? null,
        noIndex: dto.noIndex ?? false,
        openGraphTitle: dto.openGraphTitle ?? null,
        openGraphDescription: dto.openGraphDescription ?? null,
        openGraphImageUrl: dto.openGraphImageUrl ?? null,
        openGraphImageAlt: dto.openGraphImageAlt ?? null,

        codes: dto.codes ?? [],
        images: dto.images ?? [],
      },
    };

    try {
      const product = await this.prisma.$transaction(async (transaction) => {
        const createdProduct = await transaction.product.create({
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
            salePriceToman: dto.salePriceToman ?? null,
            saleStartsAt,
            saleEndsAt,
            stockStatus: dto.stockStatus ?? StockStatus.CHECK_AVAILABILITY,
            status: dto.status ?? ProductStatus.DRAFT,
            isPublished: dto.isPublished ?? false,
            isTorobEnabled: dto.isTorobEnabled ?? false,

            showOnHome: dto.showOnHome ?? false,
            homeSortOrder: dto.homeSortOrder ?? 0,

            seoTitle: dto.seoTitle ?? null,
            seoDescription: dto.seoDescription ?? null,
            canonicalUrl: dto.canonicalUrl ?? null,
            noIndex: dto.noIndex ?? false,
            openGraphTitle: dto.openGraphTitle ?? null,
            openGraphDescription: dto.openGraphDescription ?? null,
            openGraphImageUrl: dto.openGraphImageUrl ?? null,
            openGraphImageAlt: dto.openGraphImageAlt ?? null,

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
                changes: this.toJson(auditChanges),
              },
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.PRODUCT,
          entityId: createdProduct.id,
          entityLabel: createdProduct.name,
          action: AdminAuditAction.CREATED,
          changes: auditChanges,
        });

        return createdProduct;
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

    const hasSalePriceTomanUpdate = this.hasOwnProperty(dto, 'salePriceToman');
    const hasSaleStartsAtUpdate = this.hasOwnProperty(dto, 'saleStartsAt');
    const hasSaleEndsAtUpdate = this.hasOwnProperty(dto, 'saleEndsAt');
    const hasPriceTomanUpdate = this.hasOwnProperty(dto, 'priceToman');

    const finalBrandId = dto.brandId ?? product.brandId;
    const finalCategoryId = dto.categoryId ?? product.categoryId;

    const { brand, category } = await this.getBrandAndCategory(finalBrandId, finalCategoryId);

    const finalCodes = hasCodesUpdate ? (dto.codes ?? []) : product.codes;
    const finalImages = hasImagesUpdate ? (dto.images ?? []) : product.images;

    const finalSalePriceToman = hasSalePriceTomanUpdate
      ? (dto.salePriceToman ?? null)
      : product.salePriceToman;

    const finalSaleStartsAt = hasSaleStartsAtUpdate
      ? this.toNullableDate(dto.saleStartsAt)
      : product.saleStartsAt;

    const finalSaleEndsAt = hasSaleEndsAtUpdate
      ? this.toNullableDate(dto.saleEndsAt)
      : product.saleEndsAt;

    const finalPriceToman = hasPriceTomanUpdate ? (dto.priceToman ?? null) : product.priceToman;
    const finalShowOnHome = dto.showOnHome ?? product.showOnHome;

    const candidate: ProductStateCandidate = {
      status: dto.status ?? product.status,
      isPublished: dto.isPublished ?? product.isPublished,
      isTorobEnabled: dto.isTorobEnabled ?? product.isTorobEnabled,
      priceToman: finalPriceToman,
      salePriceToman: finalSalePriceToman,
      saleStartsAt: finalSaleStartsAt,
      saleEndsAt: finalSaleEndsAt,
      stockStatus: dto.stockStatus ?? product.stockStatus,
      brandIsActive: brand.isActive,
      categoryIsActive: category.isActive,
      codes: finalCodes,
      images: finalImages,
      showOnHome: finalShowOnHome,
    };

    this.assertProductState(candidate);

    const changes = this.buildProductUpdateChanges(product, dto, hasCodesUpdate, hasImagesUpdate);

    type SeoOpenGraphProductField =
      | 'seoTitle'
      | 'seoDescription'
      | 'canonicalUrl'
      | 'noIndex'
      | 'openGraphTitle'
      | 'openGraphDescription'
      | 'openGraphImageUrl'
      | 'openGraphImageAlt';

    const addSeoOpenGraphChange = (field: SeoOpenGraphProductField) => {
      if (!this.hasOwnProperty(dto, field)) {
        return;
      }

      const before = product[field];
      const after = dto[field];

      if (before === after) {
        return;
      }

      const mutableChanges = changes as Record<
        string,
        {
          before: unknown;
          after: unknown;
        }
      >;

      mutableChanges[field] = {
        before,
        after,
      };
    };

    addSeoOpenGraphChange('seoTitle');
    addSeoOpenGraphChange('seoDescription');
    addSeoOpenGraphChange('canonicalUrl');
    addSeoOpenGraphChange('noIndex');
    addSeoOpenGraphChange('openGraphTitle');
    addSeoOpenGraphChange('openGraphDescription');
    addSeoOpenGraphChange('openGraphImageUrl');
    addSeoOpenGraphChange('openGraphImageAlt');

    const auditChanges = {
      event: 'admin_product_updated',
      fields: changes,
    };

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

      ...(hasPriceTomanUpdate && {
        priceToman: finalPriceToman,
      }),

      ...(hasSalePriceTomanUpdate && {
        salePriceToman: finalSalePriceToman,
      }),

      ...(hasSaleStartsAtUpdate && {
        saleStartsAt: finalSaleStartsAt,
      }),

      ...(hasSaleEndsAtUpdate && {
        saleEndsAt: finalSaleEndsAt,
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

      ...(dto.showOnHome !== undefined && {
        showOnHome: dto.showOnHome,
      }),

      ...(dto.homeSortOrder !== undefined && {
        homeSortOrder: dto.homeSortOrder,
      }),

      ...(dto.seoTitle !== undefined && {
        seoTitle: dto.seoTitle,
      }),

      ...(dto.seoDescription !== undefined && {
        seoDescription: dto.seoDescription,
      }),

      ...(dto.canonicalUrl !== undefined && {
        canonicalUrl: dto.canonicalUrl,
      }),

      ...(dto.noIndex !== undefined && {
        noIndex: dto.noIndex,
      }),

      ...(dto.openGraphTitle !== undefined && {
        openGraphTitle: dto.openGraphTitle,
      }),

      ...(dto.openGraphDescription !== undefined && {
        openGraphDescription: dto.openGraphDescription,
      }),

      ...(dto.openGraphImageUrl !== undefined && {
        openGraphImageUrl: dto.openGraphImageUrl,
      }),

      ...(dto.openGraphImageAlt !== undefined && {
        openGraphImageAlt: dto.openGraphImageAlt,
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
          changes: this.toJson(auditChanges),
        },
      },
    };

    try {
      await this.prisma.$transaction(async (transaction) => {
        const updatedProduct = await transaction.product.update({
          where: {
            id,
          },
          data,
          select: {
            id: true,
            name: true,
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.PRODUCT,
          entityId: updatedProduct.id,
          entityLabel: updatedProduct.name,
          action: AdminAuditAction.UPDATED,
          changes: auditChanges,
        });
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

    const auditChanges = {
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
        showOnHome: {
          before: product.showOnHome,
          after: false,
        },
      },
    };

    try {
      await this.prisma.$transaction(async (transaction) => {
        const archivedProduct = await transaction.product.update({
          where: {
            id,
          },
          data: {
            status: ProductStatus.ARCHIVED,
            isPublished: false,
            isTorobEnabled: false,
            showOnHome: false,

            auditLogs: {
              create: {
                actorUser: {
                  connect: {
                    id: actorUserId,
                  },
                },
                action: ProductAuditAction.ARCHIVED,
                changes: this.toJson(auditChanges),
              },
            },
          },
          select: {
            id: true,
            name: true,
          },
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId,
          entityType: AdminAuditEntityType.PRODUCT,
          entityId: archivedProduct.id,
          entityLabel: archivedProduct.name,
          action: AdminAuditAction.ARCHIVED,
          changes: auditChanges,
        });
      });

      return this.findProductById(id);
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
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
        name: true,
        compatibilities: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            vehicleVariantId: true,
            notes: true,
            requiresVerification: true,
            vehicleVariant: {
              select: {
                name: true,
                engineCode: true,
                engineName: true,
                yearFrom: true,
                yearTo: true,
                yearCalendar: true,
                model: {
                  select: {
                    name: true,
                    make: {
                      select: {
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

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const vehicleVariantIds = dto.items.map((item) => item.vehicleVariantId);

    await this.ensureVehicleVariantsAreActive(vehicleVariantIds);

    const before = product.compatibilities.map((compatibility) =>
      this.toProductCompatibilityAuditItem(compatibility),
    );

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

      const updatedCompatibilities = await transaction.productVehicleCompatibility.findMany({
        where: {
          productId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          vehicleVariantId: true,
          notes: true,
          requiresVerification: true,
          vehicleVariant: {
            select: {
              name: true,
              engineCode: true,
              engineName: true,
              yearFrom: true,
              yearTo: true,
              yearCalendar: true,
              model: {
                select: {
                  name: true,
                  make: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const after = updatedCompatibilities.map((compatibility) =>
        this.toProductCompatibilityAuditItem(compatibility),
      );

      const auditChanges = {
        event: 'admin_product_compatibilities_replaced',
        before,
        after,
      };

      await transaction.productAuditLog.create({
        data: {
          productId,
          actorUserId,
          action: ProductAuditAction.COMPATIBILITIES_UPDATED,
          changes: this.toJson(auditChanges),
        },
      });

      await this.writeAdminAuditLog(transaction, {
        actorUserId,
        entityType: AdminAuditEntityType.PRODUCT,
        entityId: product.id,
        entityLabel: product.name,
        action: AdminAuditAction.COMPATIBILITIES_UPDATED,
        changes: auditChanges,
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
        salePriceToman: true,
        saleStartsAt: true,
        saleEndsAt: true,

        stockStatus: true,
        status: true,
        isPublished: true,
        isTorobEnabled: true,

        showOnHome: true,
        homeSortOrder: true,

        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        noIndex: true,
        openGraphTitle: true,
        openGraphDescription: true,
        openGraphImageUrl: true,
        openGraphImageAlt: true,

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
    this.assertProductPricing(candidate);

    const effectivePriceToman = this.getEffectivePriceToman(candidate);
    if (candidate.isPublished && candidate.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('A published product must have ACTIVE status');
    }

    if (candidate.isPublished && (!candidate.brandIsActive || !candidate.categoryIsActive)) {
      throw new BadRequestException('A published product requires an active brand and category');
    }

    if (!candidate.isTorobEnabled) {
      return;
    }

    if (candidate.showOnHome) {
      if (candidate.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException('Home featured product requires ACTIVE status');
      }

      if (!candidate.isPublished) {
        throw new BadRequestException('Home featured product must be published');
      }

      if (!candidate.brandIsActive || !candidate.categoryIsActive) {
        throw new BadRequestException(
          'Home featured product requires an active brand and category',
        );
      }

      if (effectivePriceToman === null || effectivePriceToman <= 0) {
        throw new BadRequestException('Home featured product requires a valid effective price');
      }

      if (candidate.images.length === 0) {
        throw new BadRequestException('Home featured product requires at least one image');
      }
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

    if (effectivePriceToman === null || effectivePriceToman <= 0) {
      throw new BadRequestException('Torob requires a valid effective product price');
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

  private assertProductPricing(candidate: ProductStateCandidate): void {
    const salePriceToman = candidate.salePriceToman;
    const priceToman = candidate.priceToman;
    const saleStartsAt = candidate.saleStartsAt;
    const saleEndsAt = candidate.saleEndsAt;

    const hasSaleDate = saleStartsAt !== null || saleEndsAt !== null;

    if (salePriceToman === null) {
      if (hasSaleDate) {
        throw new BadRequestException('Sale dates require a sale price');
      }

      return;
    }

    if (priceToman === null || priceToman <= 0) {
      throw new BadRequestException('A sale price requires a valid base price');
    }

    if (salePriceToman <= 0 || salePriceToman >= priceToman) {
      throw new BadRequestException('Sale price must be lower than the base price');
    }

    if (saleStartsAt && saleEndsAt && saleStartsAt >= saleEndsAt) {
      throw new BadRequestException('Sale end date must be after sale start date');
    }
  }

  private isSaleActive(
    pricing: Pick<ProductStateCandidate, 'salePriceToman' | 'saleStartsAt' | 'saleEndsAt'>,
    now = new Date(),
  ): boolean {
    if (pricing.salePriceToman === null) {
      return false;
    }

    if (pricing.saleStartsAt && pricing.saleStartsAt > now) {
      return false;
    }

    if (pricing.saleEndsAt && pricing.saleEndsAt < now) {
      return false;
    }

    return true;
  }

  private getEffectivePriceToman(
    pricing: Pick<
      ProductStateCandidate,
      'priceToman' | 'salePriceToman' | 'saleStartsAt' | 'saleEndsAt'
    >,
  ): number | null {
    if (this.isSaleActive(pricing)) {
      return pricing.salePriceToman;
    }

    return pricing.priceToman;
  }

  private withComputedPricing<
    T extends {
      priceToman: number | null;
      salePriceToman: number | null;
      saleStartsAt: Date | null;
      saleEndsAt: Date | null;
    },
  >(product: T) {
    const isSaleActive = this.isSaleActive(product);

    const effectivePriceToman = this.getEffectivePriceToman(product);

    const discountAmountToman =
      isSaleActive && product.priceToman !== null && product.salePriceToman !== null
        ? product.priceToman - product.salePriceToman
        : 0;

    const discountPercent =
      product.priceToman && discountAmountToman > 0
        ? Math.round((discountAmountToman / product.priceToman) * 100)
        : 0;

    return {
      ...product,
      isSaleActive,
      effectivePriceToman,
      discountAmountToman,
      discountPercent,
    };
  }

  private toNullableDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid sale date');
    }

    return date;
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
    this.addChange(changes, 'salePriceToman', product.salePriceToman, dto.salePriceToman);
    this.addChange(changes, 'saleStartsAt', product.saleStartsAt, dto.saleStartsAt);
    this.addChange(changes, 'saleEndsAt', product.saleEndsAt, dto.saleEndsAt);
    this.addChange(changes, 'stockStatus', product.stockStatus, dto.stockStatus);
    this.addChange(changes, 'status', product.status, dto.status);
    this.addChange(changes, 'isPublished', product.isPublished, dto.isPublished);
    this.addChange(changes, 'isTorobEnabled', product.isTorobEnabled, dto.isTorobEnabled);
    this.addChange(changes, 'showOnHome', product.showOnHome, dto.showOnHome);
    this.addChange(changes, 'homeSortOrder', product.homeSortOrder, dto.homeSortOrder);
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

  private async writeAdminAuditLog(
    transaction: Prisma.TransactionClient,
    input: WriteAdminAuditLogInput,
  ): Promise<void> {
    await transaction.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel,
        action: input.action,
        changes: this.toJson(input.changes),
      },
    });
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new BadRequestException('Value cannot be converted to JSON');
    }

    return JSON.parse(serialized) as Prisma.InputJsonValue;
  }

  private async ensureVehicleMakeExists(id: string): Promise<void> {
    const make = await this.prisma.vehicleMake.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!make) {
      throw new NotFoundException('Vehicle make not found');
    }
  }

  private async ensureVehicleModelExists(id: string): Promise<void> {
    const model = await this.prisma.vehicleModel.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!model) {
      throw new NotFoundException('Vehicle model not found');
    }
  }

  private assertVehicleVariantYears(yearFrom: number | null, yearTo: number | null): void {
    if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
      throw new BadRequestException('Vehicle variant yearFrom cannot be greater than yearTo');
    }
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

  async findAdminAuditLogs(query: FindAdminAuditLogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const createdFrom = query.createdFrom ? new Date(query.createdFrom) : undefined;

    const createdTo = query.createdTo ? new Date(query.createdTo) : undefined;

    if (createdFrom && createdTo && createdFrom.getTime() > createdTo.getTime()) {
      throw new BadRequestException('createdFrom cannot be greater than createdTo');
    }

    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.entityType !== undefined && {
        entityType: query.entityType,
      }),
      ...(query.action !== undefined && {
        action: query.action,
      }),
      ...(query.actorUserId !== undefined && {
        actorUserId: query.actorUserId,
      }),
      ...(query.search && {
        entityLabel: {
          contains: query.search,
          mode: 'insensitive',
        },
      }),
      ...((createdFrom || createdTo) && {
        createdAt: {
          ...(createdFrom !== undefined && {
            gte: createdFrom,
          }),
          ...(createdTo !== undefined && {
            lte: createdTo,
          }),
        },
      }),
    };

    const [auditLogs, totalItems] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        skip,
        take: pageSize,
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
          entityType: true,
          entityId: true,
          entityLabel: true,
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
      this.prisma.adminAuditLog.count({
        where,
      }),
    ]);

    return {
      data: auditLogs,
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  private toProductCompatibilityAuditItem(compatibility: ProductCompatibilityAuditSource) {
    return {
      vehicleVariantId: compatibility.vehicleVariantId,
      vehicle: {
        makeName: compatibility.vehicleVariant.model.make.name,
        modelName: compatibility.vehicleVariant.model.name,
        variantName: compatibility.vehicleVariant.name,
        engineCode: compatibility.vehicleVariant.engineCode,
        engineName: compatibility.vehicleVariant.engineName,
        yearFrom: compatibility.vehicleVariant.yearFrom,
        yearTo: compatibility.vehicleVariant.yearTo,
        yearCalendar: compatibility.vehicleVariant.yearCalendar,
      },
      notes: compatibility.notes,
      requiresVerification: compatibility.requiresVerification,
    };
  }
}
