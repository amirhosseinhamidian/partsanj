import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditEntityType,
  Prisma,
} from '../../../generated/prisma/client.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AdminBlogCategoryListQueryDto } from './dto/admin-blog-category-list-query.dto.js';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto.js';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto.js';

const blogCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  sortOrder: true,

  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  noIndex: true,

  openGraphTitle: true,
  openGraphDescription: true,
  openGraphImageUrl: true,
  openGraphImageAlt: true,

  createdAt: true,
  updatedAt: true,

  _count: {
    select: {
      posts: true,
    },
  },
} satisfies Prisma.BlogCategorySelect;

type BlogCategoryAuditSnapshot = {
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;

  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

function getAuditSnapshot(category: BlogCategoryAuditSnapshot): BlogCategoryAuditSnapshot {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.isActive,
    sortOrder: category.sortOrder,

    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    canonicalUrl: category.canonicalUrl,
    noIndex: category.noIndex,

    openGraphTitle: category.openGraphTitle,
    openGraphDescription: category.openGraphDescription,
    openGraphImageUrl: category.openGraphImageUrl,
    openGraphImageAlt: category.openGraphImageAlt,
  };
}

function isSameSnapshot(first: BlogCategoryAuditSnapshot, second: BlogCategoryAuditSnapshot) {
  return (
    first.name === second.name &&
    first.slug === second.slug &&
    first.description === second.description &&
    first.isActive === second.isActive &&
    first.sortOrder === second.sortOrder &&
    first.seoTitle === second.seoTitle &&
    first.seoDescription === second.seoDescription &&
    first.canonicalUrl === second.canonicalUrl &&
    first.noIndex === second.noIndex &&
    first.openGraphTitle === second.openGraphTitle &&
    first.openGraphDescription === second.openGraphDescription &&
    first.openGraphImageUrl === second.openGraphImageUrl &&
    first.openGraphImageAlt === second.openGraphImageAlt
  );
}

@Injectable()
export class BlogAdminCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findCategories(query: AdminBlogCategoryListQueryDto) {
    const where: Prisma.BlogCategoryWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
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
          slug: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.blogCategory.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [
          {
            sortOrder: 'asc',
          },
          {
            name: 'asc',
          },
        ],
        select: blogCategorySelect,
      }),

      this.prisma.blogCategory.count({
        where,
      }),
    ]);

    return {
      data: categories,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findCategory(blogCategoryId: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: {
        id: blogCategoryId,
      },
      select: blogCategorySelect,
    });

    if (!category) {
      throw new NotFoundException('دسته‌بندی بلاگ یافت نشد.');
    }

    return {
      data: category,
    };
  }

  async createCategory(actor: AuthenticatedUser, dto: CreateBlogCategoryDto) {
    try {
      const category = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.blogCategory.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            description: dto.description ?? null,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,

            seoTitle: dto.seoTitle ?? null,
            seoDescription: dto.seoDescription ?? null,
            canonicalUrl: dto.canonicalUrl ?? null,
            noIndex: dto.noIndex ?? false,

            openGraphTitle: dto.openGraphTitle ?? null,
            openGraphDescription: dto.openGraphDescription ?? null,
            openGraphImageUrl: dto.openGraphImageUrl ?? null,
            openGraphImageAlt: dto.openGraphImageAlt ?? null,
          },
          select: blogCategorySelect,
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId: actor.id,
          entityId: created.id,
          entityLabel: created.name,
          action: AdminAuditAction.CREATED,
          changes: {
            after: getAuditSnapshot(created),
          },
        });

        return created;
      });

      return {
        data: category,
      };
    } catch (error) {
      this.handleUniqueConstraintError(error);

      throw error;
    }
  }

  async updateCategory(
    actor: AuthenticatedUser,
    blogCategoryId: string,
    dto: UpdateBlogCategoryDto,
  ) {
    try {
      const category = await this.prisma.$transaction(async (transaction) => {
        const current = await transaction.blogCategory.findUnique({
          where: {
            id: blogCategoryId,
          },
          select: blogCategorySelect,
        });

        if (!current) {
          throw new NotFoundException('دسته‌بندی بلاگ یافت نشد.');
        }

        const before = getAuditSnapshot(current);

        const after: BlogCategoryAuditSnapshot = {
          name: dto.name !== undefined ? dto.name : current.name,

          slug: dto.slug !== undefined ? dto.slug : current.slug,

          description: dto.description !== undefined ? dto.description : current.description,

          isActive: dto.isActive !== undefined ? dto.isActive : current.isActive,

          sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : current.sortOrder,

          seoTitle: dto.seoTitle !== undefined ? dto.seoTitle : current.seoTitle,

          seoDescription:
            dto.seoDescription !== undefined ? dto.seoDescription : current.seoDescription,

          canonicalUrl: dto.canonicalUrl !== undefined ? dto.canonicalUrl : current.canonicalUrl,

          noIndex: dto.noIndex !== undefined ? dto.noIndex : current.noIndex,

          openGraphTitle:
            dto.openGraphTitle !== undefined ? dto.openGraphTitle : current.openGraphTitle,

          openGraphDescription:
            dto.openGraphDescription !== undefined
              ? dto.openGraphDescription
              : current.openGraphDescription,

          openGraphImageUrl:
            dto.openGraphImageUrl !== undefined ? dto.openGraphImageUrl : current.openGraphImageUrl,

          openGraphImageAlt:
            dto.openGraphImageAlt !== undefined ? dto.openGraphImageAlt : current.openGraphImageAlt,
        };

        if (isSameSnapshot(before, after)) {
          throw new BadRequestException('تغییری در دسته‌بندی انجام نشده است');
        }

        const updated = await transaction.blogCategory.update({
          where: {
            id: current.id,
          },
          data: after,
          select: blogCategorySelect,
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId: actor.id,
          entityId: updated.id,
          entityLabel: updated.name,
          action: AdminAuditAction.UPDATED,
          changes: {
            before,
            after: getAuditSnapshot(updated),
          },
        });

        return updated;
      });

      return {
        data: category,
      };
    } catch (error) {
      this.handleUniqueConstraintError(error);

      throw error;
    }
  }

  private async writeAdminAuditLog(
    transaction: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      entityId: string;
      entityLabel: string;
      action: AdminAuditAction;
      changes: Prisma.InputJsonObject;
    },
  ) {
    await transaction.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        entityType: AdminAuditEntityType.BLOG_CATEGORY,
        entityId: input.entityId,
        entityLabel: input.entityLabel,
        action: input.action,
        changes: input.changes,
      },
    });
  }

  private handleUniqueConstraintError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('این Slug قبلاً برای یک دسته‌بندی بلاگ ثبت شده است');
    }
  }
}
