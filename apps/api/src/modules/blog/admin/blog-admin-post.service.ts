import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditEntityType,
  BlogPostStatus,
  Prisma,
} from '../../../generated/prisma/client.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AdminBlogPostListQueryDto } from './dto/admin-blog-post-list-query.dto.js';
import { CreateBlogPostDto } from './dto/create-blog-post.dto.js';
import { hasMeaningfulBlogEditorContent } from './dto/blog-post.dto.utils.js';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto.js';

const blogPostListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,

  coverImageUrl: true,
  coverImageAlt: true,

  status: true,
  publishedAt: true,

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

  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  },

  authorUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      mobile: true,
    },
  },
} satisfies Prisma.BlogPostSelect;

const blogPostDetailSelect = {
  ...blogPostListSelect,
  content: true,
} satisfies Prisma.BlogPostSelect;

type ResolvedBlogPostValues = {
  categoryId: string;

  title: string;
  slug: string;
  excerpt: string | null;
  content: Prisma.InputJsonValue;

  coverImageUrl: string | null;
  coverImageAlt: string | null;

  status: BlogPostStatus;
  publishedAt: Date | null;

  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;

  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImageUrl: string | null;
  openGraphImageAlt: string | null;
};

type BlogPostAuditSnapshot = Omit<ResolvedBlogPostValues, 'content' | 'publishedAt'> & {
  publishedAt: string | null;
  contentSummary: {
    rootType: string | null;
    nodeCount: number;
    textLength: number;
    hasMeaningfulContent: boolean;
  };
};

function asInputJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getContentSummary(value: unknown) {
  let nodeCount = 0;
  let textLength = 0;

  function visit(node: unknown) {
    if (!isRecord(node)) {
      return;
    }

    nodeCount += 1;

    if (typeof node.text === 'string') {
      textLength += node.text.trim().length;
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(visit);
    }
  }

  visit(value);

  return {
    rootType: isRecord(value) && typeof value.type === 'string' ? value.type : null,
    nodeCount,
    textLength,
    hasMeaningfulContent: hasMeaningfulBlogEditorContent(value),
  };
}

function stableJsonStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(',')}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function getAuditSnapshot(post: ResolvedBlogPostValues): BlogPostAuditSnapshot {
  return {
    categoryId: post.categoryId,

    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,

    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,

    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,

    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    noIndex: post.noIndex,

    openGraphTitle: post.openGraphTitle,
    openGraphDescription: post.openGraphDescription,
    openGraphImageUrl: post.openGraphImageUrl,
    openGraphImageAlt: post.openGraphImageAlt,

    contentSummary: getContentSummary(post.content),
  };
}

function isSameSnapshot(first: BlogPostAuditSnapshot, second: BlogPostAuditSnapshot) {
  return JSON.stringify(first) === JSON.stringify(second);
}

@Injectable()
export class BlogAdminPostService {
  constructor(private readonly prisma: PrismaService) {}

  async findPosts(query: AdminBlogPostListQueryDto) {
    const where: Prisma.BlogPostWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.q) {
      where.OR = [
        {
          title: {
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
          excerpt: {
            contains: query.q,
            mode: 'insensitive',
          },
        },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            updatedAt: 'desc',
          },
        ],
        select: blogPostListSelect,
      }),

      this.prisma.blogPost.count({
        where,
      }),
    ]);

    return {
      data: posts,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findPost(blogPostId: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: {
        id: blogPostId,
      },
      select: blogPostDetailSelect,
    });

    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    return {
      data: post,
    };
  }

  async createPost(actor: AuthenticatedUser, dto: CreateBlogPostDto) {
    try {
      const post = await this.prisma.$transaction(async (transaction) => {
        const status = dto.status ?? BlogPostStatus.DRAFT;

        const next: ResolvedBlogPostValues = {
          categoryId: dto.categoryId,

          title: dto.title,
          slug: dto.slug,
          excerpt: dto.excerpt ?? null,
          content: asInputJsonValue(dto.content),

          coverImageUrl: dto.coverImageUrl ?? null,
          coverImageAlt: dto.coverImageAlt ?? null,

          status,
          publishedAt: status === BlogPostStatus.PUBLISHED ? new Date() : null,

          seoTitle: dto.seoTitle ?? null,
          seoDescription: dto.seoDescription ?? null,
          canonicalUrl: dto.canonicalUrl ?? null,
          noIndex: dto.noIndex ?? false,

          openGraphTitle: dto.openGraphTitle ?? null,
          openGraphDescription: dto.openGraphDescription ?? null,
          openGraphImageUrl: dto.openGraphImageUrl ?? null,
          openGraphImageAlt: dto.openGraphImageAlt ?? null,
        };

        await this.assertCategoryAndPublicationRules(transaction, next);

        const created = await transaction.blogPost.create({
          data: {
            ...next,
            authorUserId: actor.id,
          },
          select: blogPostDetailSelect,
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId: actor.id,
          entityId: created.id,
          entityLabel: created.title,
          action: AdminAuditAction.CREATED,
          changes: {
            after: getAuditSnapshot({
              ...next,
              content: asInputJsonValue(created.content),
            }),
          },
        });

        return created;
      });

      return {
        data: post,
      };
    } catch (error) {
      this.handleUniqueConstraintError(error);

      throw error;
    }
  }

  async updatePost(actor: AuthenticatedUser, blogPostId: string, dto: UpdateBlogPostDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('حداقل یکی از اطلاعات مقاله باید تغییر کند');
    }

    try {
      const post = await this.prisma.$transaction(async (transaction) => {
        const current = await transaction.blogPost.findUnique({
          where: {
            id: blogPostId,
          },
          select: blogPostDetailSelect,
        });

        if (!current) {
          throw new NotFoundException('Blog post not found');
        }

        const next: ResolvedBlogPostValues = {
          categoryId: dto.categoryId ?? current.category.id,

          title: dto.title ?? current.title,
          slug: dto.slug ?? current.slug,
          excerpt: dto.excerpt !== undefined ? dto.excerpt : current.excerpt,
          content:
            dto.content !== undefined
              ? asInputJsonValue(dto.content)
              : asInputJsonValue(current.content),

          coverImageUrl:
            dto.coverImageUrl !== undefined ? dto.coverImageUrl : current.coverImageUrl,
          coverImageAlt:
            dto.coverImageAlt !== undefined ? dto.coverImageAlt : current.coverImageAlt,

          status: dto.status ?? current.status,
          publishedAt: current.publishedAt,

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

        if (next.status === BlogPostStatus.PUBLISHED && !next.publishedAt) {
          next.publishedAt = new Date();
        }

        await this.assertCategoryAndPublicationRules(transaction, next);

        const before = getAuditSnapshot({
          categoryId: current.category.id,

          title: current.title,
          slug: current.slug,
          excerpt: current.excerpt,
          content: asInputJsonValue(current.content),

          coverImageUrl: current.coverImageUrl,
          coverImageAlt: current.coverImageAlt,

          status: current.status,
          publishedAt: current.publishedAt,

          seoTitle: current.seoTitle,
          seoDescription: current.seoDescription,
          canonicalUrl: current.canonicalUrl,
          noIndex: current.noIndex,

          openGraphTitle: current.openGraphTitle,
          openGraphDescription: current.openGraphDescription,
          openGraphImageUrl: current.openGraphImageUrl,
          openGraphImageAlt: current.openGraphImageAlt,
        });

        const after = getAuditSnapshot(next);

        const contentChanged =
          stableJsonStringify(current.content) !== stableJsonStringify(next.content);

        if (isSameSnapshot(before, after) && !contentChanged) {
          throw new BadRequestException('تغییری در مقاله انجام نشده است');
        }

        const updated = await transaction.blogPost.update({
          where: {
            id: current.id,
          },
          data: next,
          select: blogPostDetailSelect,
        });

        await this.writeAdminAuditLog(transaction, {
          actorUserId: actor.id,
          entityId: updated.id,
          entityLabel: updated.title,
          action: AdminAuditAction.UPDATED,
          changes: {
            before,
            after,
            contentChanged,
          },
        });

        return updated;
      });

      return {
        data: post,
      };
    } catch (error) {
      this.handleUniqueConstraintError(error);

      throw error;
    }
  }

  private async assertCategoryAndPublicationRules(
    transaction: Prisma.TransactionClient,
    post: ResolvedBlogPostValues,
  ) {
    const category = await transaction.blogCategory.findUnique({
      where: {
        id: post.categoryId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    if (post.status !== BlogPostStatus.PUBLISHED) {
      return;
    }

    if (!category.isActive) {
      throw new BadRequestException('انتشار مقاله در دسته‌بندی غیرفعال مجاز نیست');
    }

    if (!hasMeaningfulBlogEditorContent(post.content)) {
      throw new BadRequestException('برای انتشار مقاله، محتوای غیرخالی لازم است');
    }

    if (post.coverImageUrl && !post.coverImageAlt) {
      throw new BadRequestException('برای تصویر کاور مقاله، متن جایگزین وارد کنید');
    }

    if (post.openGraphImageUrl && !post.openGraphImageAlt) {
      throw new BadRequestException('برای تصویر Open Graph، متن جایگزین وارد کنید');
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
        entityType: AdminAuditEntityType.BLOG_POST,
        entityId: input.entityId,
        entityLabel: input.entityLabel,
        action: input.action,
        changes: input.changes,
      },
    });
  }

  private handleUniqueConstraintError(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('این Slug قبلاً برای یک مقاله بلاگ ثبت شده است');
    }
  }
}
