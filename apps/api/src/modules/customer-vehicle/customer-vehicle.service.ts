import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateCustomerVehicleDto } from './dto/create-customer-vehicle.dto.js';
import { UpdateCustomerVehicleDto } from './dto/update-customer-vehicle.dto.js';

const customerVehicleSelect = {
  id: true,
  label: true,
  isDefault: true,
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
      notes: true,
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
              logoUrl: true,
              isActive: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CustomerVehicleSelect;

@Injectable()
export class CustomerVehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async findVehicles(customerUserId: string) {
    const vehicles = await this.prisma.customerVehicle.findMany({
      where: {
        userId: customerUserId,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
      select: customerVehicleSelect,
    });

    return {
      data: vehicles,
    };
  }

  async createVehicle(customerUserId: string, dto: CreateCustomerVehicleDto) {
    try {
      const vehicle = await this.prisma.$transaction(async (transaction) => {
        await this.assertActiveVehicleVariant(transaction, dto.vehicleVariantId);

        const existing = await transaction.customerVehicle.findUnique({
          where: {
            userId_vehicleVariantId: {
              userId: customerUserId,
              vehicleVariantId: dto.vehicleVariantId,
            },
          },
          select: {
            id: true,
          },
        });

        if (existing) {
          throw new ConflictException('این خودرو قبلاً در فهرست خودروهای شما ثبت شده است');
        }

        const currentDefault = await transaction.customerVehicle.findFirst({
          where: {
            userId: customerUserId,
            isDefault: true,
          },
          select: {
            id: true,
          },
        });

        return transaction.customerVehicle.create({
          data: {
            userId: customerUserId,
            vehicleVariantId: dto.vehicleVariantId,
            label: dto.label ?? null,

            // اولین خودرو به‌صورت خودکار پیش‌فرض می‌شود
            isDefault: !currentDefault,
          },
          select: customerVehicleSelect,
        });
      });

      return {
        data: vehicle,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('این خودرو قبلاً در فهرست خودروهای شما ثبت شده است');
      }

      throw error;
    }
  }

  async updateVehicle(
    customerUserId: string,
    customerVehicleId: string,
    dto: UpdateCustomerVehicleDto,
  ) {
    if (dto.vehicleVariantId === undefined && dto.label === undefined) {
      throw new BadRequestException('حداقل یکی از اطلاعات خودرو باید تغییر کند');
    }

    try {
      const vehicle = await this.prisma.$transaction(async (transaction) => {
        const current = await transaction.customerVehicle.findFirst({
          where: {
            id: customerVehicleId,
            userId: customerUserId,
          },
          select: {
            id: true,
            vehicleVariantId: true,
          },
        });

        if (!current) {
          throw new NotFoundException('خودروی موردنظر یافت نشد.');
        }

        const data: Prisma.CustomerVehicleUpdateInput = {};

        if (dto.label !== undefined) {
          data.label = dto.label;
        }

        if (dto.vehicleVariantId && dto.vehicleVariantId !== current.vehicleVariantId) {
          await this.assertActiveVehicleVariant(transaction, dto.vehicleVariantId);

          const duplicate = await transaction.customerVehicle.findFirst({
            where: {
              userId: customerUserId,
              vehicleVariantId: dto.vehicleVariantId,
              NOT: {
                id: current.id,
              },
            },
            select: {
              id: true,
            },
          });

          if (duplicate) {
            throw new ConflictException('این خودرو قبلاً در فهرست خودروهای شما ثبت شده است');
          }

          data.vehicleVariant = {
            connect: {
              id: dto.vehicleVariantId,
            },
          };
        }

        return transaction.customerVehicle.update({
          where: {
            id: current.id,
          },
          data,
          select: customerVehicleSelect,
        });
      });

      return {
        data: vehicle,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('این خودرو قبلاً در فهرست خودروهای شما ثبت شده است');
      }

      throw error;
    }
  }

  async setDefaultVehicle(customerUserId: string, customerVehicleId: string) {
    const vehicle = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.customerVehicle.findFirst({
        where: {
          id: customerVehicleId,
          userId: customerUserId,
        },
        select: {
          id: true,
          isDefault: true,
        },
      });

      if (!current) {
        throw new NotFoundException('خودروی موردنظر یافت نشد.');
      }

      if (!current.isDefault) {
        await transaction.customerVehicle.updateMany({
          where: {
            userId: customerUserId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });

        await transaction.customerVehicle.update({
          where: {
            id: current.id,
          },
          data: {
            isDefault: true,
          },
        });
      }

      return transaction.customerVehicle.findUniqueOrThrow({
        where: {
          id: current.id,
        },
        select: customerVehicleSelect,
      });
    });

    return {
      data: vehicle,
    };
  }

  async deleteVehicle(customerUserId: string, customerVehicleId: string) {
    const result = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.customerVehicle.findFirst({
        where: {
          id: customerVehicleId,
          userId: customerUserId,
        },
        select: {
          id: true,
          isDefault: true,
        },
      });

      if (!current) {
        throw new NotFoundException('خودروی موردنظر یافت نشد.');
      }

      await transaction.customerVehicle.delete({
        where: {
          id: current.id,
        },
      });

      let promotedDefaultVehicleId: string | null = null;

      if (current.isDefault) {
        const replacement = await transaction.customerVehicle.findFirst({
          where: {
            userId: customerUserId,
          },
          orderBy: [
            {
              updatedAt: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
          select: {
            id: true,
          },
        });

        if (replacement) {
          promotedDefaultVehicleId = replacement.id;

          await transaction.customerVehicle.update({
            where: {
              id: replacement.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }

      return {
        deletedId: current.id,
        promotedDefaultVehicleId,
      };
    });

    return {
      data: result,
    };
  }

  private async assertActiveVehicleVariant(
    transaction: Prisma.TransactionClient,
    vehicleVariantId: string,
  ) {
    const vehicleVariant = await transaction.vehicleVariant.findFirst({
      where: {
        id: vehicleVariantId,
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

    if (!vehicleVariant) {
      throw new NotFoundException('تیپ خودرو یافت نشد.');
    }
  }
}
