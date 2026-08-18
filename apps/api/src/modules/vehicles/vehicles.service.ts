/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';

const activeVariantWhere = {
  isActive: true,
} satisfies Prisma.VehicleVariantWhereInput;

const activeModelWithVariantWhere = {
  isActive: true,
  variants: {
    some: activeVariantWhere,
  },
} satisfies Prisma.VehicleModelWhereInput;

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveMakes() {
    const makes = await this.prisma.vehicleMake.findMany({
      where: {
        isActive: true,
        models: {
          some: activeModelWithVariantWhere,
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
        logoUrl: true,
        sortOrder: true,
      },
    });

    return {
      data: makes,
    };
  }

  async findActiveModelsByMakeSlug(makeSlug: string) {
    const make = await this.prisma.vehicleMake.findFirst({
      where: {
        slug: makeSlug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
      },
    });

    if (!make) {
      throw new NotFoundException('برند خودرو یافت نشد.');
    }

    const models = await this.prisma.vehicleModel.findMany({
      where: {
        makeId: make.id,
        isActive: true,
        variants: {
          some: activeVariantWhere,
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
        makeId: true,
        name: true,
        slug: true,
        imageUrl: true,
        sortOrder: true,
      },
    });

    return {
      data: {
        make,
        models,
      },
    };
  }

  async findActiveVariantsByModelSlug(modelSlug: string) {
    const model = await this.prisma.vehicleModel.findFirst({
      where: {
        slug: modelSlug,
        isActive: true,
        make: {
          isActive: true,
        },
      },
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
            logoUrl: true,
          },
        },
      },
    });

    if (!model) {
      throw new NotFoundException('مدل خودرو یافت نشد.');
    }

    const variants = await this.prisma.vehicleVariant.findMany({
      where: {
        modelId: model.id,
        isActive: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          yearFrom: 'asc',
        },
        {
          name: 'asc',
        },
      ],
      select: {
        id: true,
        modelId: true,
        name: true,
        slug: true,
        engineCode: true,
        engineName: true,
        yearFrom: true,
        yearTo: true,
        yearCalendar: true,
        notes: true,
        sortOrder: true,
      },
    });

    return {
      data: {
        model,
        variants,
      },
    };
  }

  async findHomeModels() {
    const models = await this.prisma.vehicleModel.findMany({
      where: {
        isActive: true,
        showOnHome: true,
        make: {
          isActive: true,
        },
        variants: {
          some: activeVariantWhere,
        },
      },
      orderBy: [
        {
          homeSortOrder: 'asc',
        },
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
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        imageAlt: true,
        homeSortOrder: true,
        make: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    return {
      data: models,
    };
  }

  async findActiveModels() {
    const models = await this.prisma.vehicleModel.findMany({
      where: {
        isActive: true,

        make: {
          isActive: true,
        },

        variants: {
          some: {
            isActive: true,
          },
        },
      },

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

      select: {
        id: true,
        name: true,
        slug: true,

        imageUrl: true,
        imageAlt: true,

        noIndex: true,

        sortOrder: true,
        updatedAt: true,

        make: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    return {
      data: models,
    };
  }

  async findActiveModelBySlug(modelSlug: string) {
    const model = await this.prisma.vehicleModel.findFirst({
      where: {
        slug: modelSlug,
        isActive: true,

        make: {
          isActive: true,
        },
      },

      select: {
        id: true,
        name: true,
        slug: true,

        imageUrl: true,
        imageAlt: true,

        description: true,

        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        noIndex: true,

        openGraphTitle: true,
        openGraphDescription: true,
        openGraphImageUrl: true,
        openGraphImageAlt: true,

        updatedAt: true,

        make: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },

        variants: {
          where: {
            isActive: true,
          },

          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              yearFrom: 'asc',
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
            sortOrder: true,
          },
        },
      },
    });

    if (!model || model.variants.length === 0) {
      throw new NotFoundException('مدل خودرو یافت نشد.');
    }

    return {
      data: model,
    };
  }
}
