import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveMakes() {
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
      throw new NotFoundException('Vehicle make not found');
    }

    const models = await this.prisma.vehicleModel.findMany({
      where: {
        makeId: make.id,
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
      throw new NotFoundException('Vehicle model not found');
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
}
