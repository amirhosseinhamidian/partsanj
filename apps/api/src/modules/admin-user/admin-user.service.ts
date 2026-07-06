import { PrismaService } from '../database/prisma.service.js';
import { AdminUserIdParamDto } from './dto/admin-user-id-param.dto.js';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto.js';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AdminAuditAction,
  AdminAuditEntityType,
  Prisma,
  UserRole,
} from '../../generated/prisma/client.js';

import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';

const adminUserListSelect = {
  id: true,
  mobile: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  mobileVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      addresses: true,
      customerVehicles: true,
      orders: true,
    },
  },
} satisfies Prisma.UserSelect;

const adminUserDetailSelect = {
  ...adminUserListSelect,

  customerVehicles: {
    orderBy: [
      {
        isDefault: 'desc',
      },
      {
        updatedAt: 'desc',
      },
    ],

    select: {
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
                  logoUrl: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

const adminUserMutationSelect = {
  id: true,
  mobile: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async findUsers(query: AdminUserListQueryDto) {
    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.q) {
      where.OR = [
        {
          mobile: {
            contains: query.normalizedMobileQuery ?? query.q,
          },
        },
        {
          firstName: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            id: 'desc',
          },
        ],
        select: adminUserListSelect,
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      data: users,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: adminUserDetailSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      data: user,
    };
  }

  async updateUser(actor: AuthenticatedUser, userId: string, dto: UpdateAdminUserDto) {
    if (dto.role === undefined && dto.isActive === undefined) {
      throw new BadRequestException('حداقل یکی از اطلاعات کاربر باید تغییر کند');
    }

    const user = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.user.findUnique({
        where: {
          id: userId,
        },
        select: adminUserMutationSelect,
      });

      if (!current) {
        throw new NotFoundException('User not found');
      }

      const nextRole = dto.role ?? current.role;

      const nextIsActive = dto.isActive ?? current.isActive;

      const isRoleChanged = nextRole !== current.role;

      const isStatusChanged = nextIsActive !== current.isActive;

      if (!isRoleChanged && !isStatusChanged) {
        throw new BadRequestException('تغییری در اطلاعات کاربر انجام نشده است');
      }

      this.assertUserMutationAllowed({
        actorUserId: actor.id,
        targetUserId: current.id,
        currentRole: current.role,
        nextRole,
      });

      const changes = {
        ...(isRoleChanged
          ? {
              role: {
                from: current.role,
                to: nextRole,
              },
            }
          : {}),
        ...(isStatusChanged
          ? {
              isActive: {
                from: current.isActive,
                to: nextIsActive,
              },
            }
          : {}),
      } satisfies Prisma.InputJsonObject;

      const updated = await transaction.user.update({
        where: {
          id: current.id,
        },
        data: {
          ...(isRoleChanged
            ? {
                role: nextRole,
              }
            : {}),
          ...(isStatusChanged
            ? {
                isActive: nextIsActive,
              }
            : {}),
        },
        select: adminUserDetailSelect,
      });

      await this.writeAdminAuditLog(transaction, {
        actorUserId: actor.id,
        entityType: AdminAuditEntityType.USER,
        entityId: current.id,
        entityLabel: this.getUserAuditLabel(current),
        action: AdminAuditAction.UPDATED,
        changes,
      });

      return updated;
    });

    return {
      data: user,
    };
  }

  private assertUserMutationAllowed(input: {
    actorUserId: string;
    targetUserId: string;
    currentRole: UserRole;
    nextRole: UserRole;
  }) {
    if (input.actorUserId === input.targetUserId) {
      throw new BadRequestException(
        'امکان تغییر نقش یا وضعیت حساب خودتان از پنل مدیریت وجود ندارد',
      );
    }

    if (input.currentRole === UserRole.ADMIN || input.nextRole === UserRole.ADMIN) {
      throw new ForbiddenException('مدیریت حساب‌های ادمین از پنل فعلی مجاز نیست');
    }
  }

  private getUserAuditLabel(user: {
    mobile: string;
    firstName: string | null;
    lastName: string | null;
  }) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

    return fullName ? `${fullName} (${user.mobile})` : user.mobile;
  }

  private async writeAdminAuditLog(
    transaction: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      entityType: AdminAuditEntityType;
      entityId: string;
      entityLabel?: string | null;
      action: AdminAuditAction;
      changes: Prisma.InputJsonObject;
    },
  ) {
    await transaction.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel ?? null,
        action: input.action,
        changes: input.changes,
      },
    });
  }
}
