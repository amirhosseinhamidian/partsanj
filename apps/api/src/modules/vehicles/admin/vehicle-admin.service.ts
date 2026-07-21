import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VehicleYearCalendar } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateVehicleMakeDto } from './dto/create-vehicle-make.dto.js';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto.js';
import { CreateVehicleVariantDto } from './dto/create-vehicle-variant.dto.js';
import { UpdateVehicleMakeDto } from './dto/update-vehicle-make.dto.js';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto.js';
import { UpdateVehicleVariantDto } from './dto/update-vehicle-variant.dto.js';

@Injectable()
export class VehicleAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findMakes() {
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

  async createMake(dto: CreateVehicleMakeDto) {
    try {
      const make = await this.prisma.vehicleMake.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      });

      return {
        data: make,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateMake(id: string, dto: UpdateVehicleMakeDto) {
    this.ensureUpdatePayload(dto);
    await this.ensureMakeExists(id);

    try {
      const make = await this.prisma.vehicleMake.update({
        where: {
          id,
        },
        data: dto,
      });

      return {
        data: make,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async findModels() {
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
            isActive: true,
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

  async createModel(dto: CreateVehicleModelDto) {
    await this.ensureMakeExists(dto.makeId);

    try {
      const model = await this.prisma.vehicleModel.create({
        data: {
          makeId: dto.makeId,
          name: dto.name,
          slug: dto.slug,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      });

      return {
        data: model,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateModel(id: string, dto: UpdateVehicleModelDto) {
    this.ensureUpdatePayload(dto);
    await this.ensureModelExists(id);

    try {
      const model = await this.prisma.vehicleModel.update({
        where: {
          id,
        },
        data: dto,
      });

      return {
        data: model,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async findVariants() {
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

  async createVariant(dto: CreateVehicleVariantDto) {
    await this.ensureModelExists(dto.modelId);
    this.assertYearRange(dto.yearFrom ?? null, dto.yearTo ?? null);

    try {
      const variant = await this.prisma.vehicleVariant.create({
        data: {
          modelId: dto.modelId,
          name: dto.name,
          slug: dto.slug,
          engineCode: dto.engineCode,
          engineName: dto.engineName,
          yearFrom: dto.yearFrom,
          yearTo: dto.yearTo,
          yearCalendar: dto.yearCalendar ?? VehicleYearCalendar.SHAMSI,
          notes: dto.notes,
          sortOrder: dto.sortOrder,
          isActive: dto.isActive,
        },
      });

      return {
        data: variant,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async updateVariant(id: string, dto: UpdateVehicleVariantDto) {
    this.ensureUpdatePayload(dto);

    const variant = await this.prisma.vehicleVariant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        yearFrom: true,
        yearTo: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('تیپ خودرو یافت نشد.');
    }

    const hasYearFromUpdate = this.hasOwnProperty(dto, 'yearFrom');
    const hasYearToUpdate = this.hasOwnProperty(dto, 'yearTo');

    const finalYearFrom = hasYearFromUpdate ? (dto.yearFrom ?? null) : variant.yearFrom;

    const finalYearTo = hasYearToUpdate ? (dto.yearTo ?? null) : variant.yearTo;

    this.assertYearRange(finalYearFrom, finalYearTo);

    const data: Prisma.VehicleVariantUpdateInput = {
      ...(dto.name !== undefined && {
        name: dto.name,
      }),
      ...(dto.slug !== undefined && {
        slug: dto.slug,
      }),
      ...(this.hasOwnProperty(dto, 'engineCode') && {
        engineCode: dto.engineCode ?? null,
      }),
      ...(this.hasOwnProperty(dto, 'engineName') && {
        engineName: dto.engineName ?? null,
      }),
      ...(hasYearFromUpdate && {
        yearFrom: dto.yearFrom ?? null,
      }),
      ...(hasYearToUpdate && {
        yearTo: dto.yearTo ?? null,
      }),
      ...(dto.yearCalendar !== undefined && {
        yearCalendar: dto.yearCalendar,
      }),
      ...(this.hasOwnProperty(dto, 'notes') && {
        notes: dto.notes ?? null,
      }),
      ...(dto.sortOrder !== undefined && {
        sortOrder: dto.sortOrder,
      }),
      ...(dto.isActive !== undefined && {
        isActive: dto.isActive,
      }),
    };

    try {
      const updatedVariant = await this.prisma.vehicleVariant.update({
        where: {
          id,
        },
        data,
      });

      return {
        data: updatedVariant,
      };
    } catch (error) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  private assertYearRange(yearFrom: number | null, yearTo: number | null): void {
    if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
      throw new BadRequestException('سال شروع نمی‌تواند بعد از سال پایان باشد.');
    }
  }

  private async ensureMakeExists(id: string): Promise<void> {
    const make = await this.prisma.vehicleMake.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!make) {
      throw new NotFoundException('برند خودرو یافت نشد.');
    }
  }

  private async ensureModelExists(id: string): Promise<void> {
    const model = await this.prisma.vehicleModel.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!model) {
      throw new NotFoundException('مدل خودرو یافت نشد.');
    }
  }

  private ensureUpdatePayload(payload: object): void {
    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('حداقل یکی از فیلدها باید ارسال شود.');
    }
  }

  private hasOwnProperty(object: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('رکوردی با این اطلاعات قبلاً ثبت شده است.');
    }

    throw error;
  }
}
