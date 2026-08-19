import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import {
  BlogPostStatus,
  ContentModerationStatus,
  InteractionAuthorType,
  InteractionSource,
} from '../../../generated/prisma/client.js';

import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { PrismaService } from '../../database/prisma.service.js';
import { BlogCommentListQueryDto } from './dto/blog-comment-list-query.dto.js';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto.js';

const SITE_SETTINGS_ID = 'site';

const APPROVED = ContentModerationStatus.APPROVED;

type PublicCommentRow = {
  id: string;
  parentId: string | null;
  body: string;

  authorType: InteractionAuthorType;
  authorDisplayName: string | null;

  publishedAt: Date | null;
  createdAt: Date;
};

@Injectable()
export class BlogInteractionService {
  constructor(private readonly prisma: PrismaService) {}

  async findComments(slug: string, query: BlogCommentListQueryDto, user?: AuthenticatedUser) {
    const post = await this.findPublicPost(slug);

    const settings = await this.findSettings();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    if (!settings.blogCommentsEnabled) {
      return {
        data: {
          enabled: false,

          officialIdentity: this.buildOfficialIdentity(settings),

          canComment: Boolean(user),

          commentsCount: 0,
          threadsCount: 0,

          comments: [],
        },

        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const [roots, totalThreads, totalComments, replies] = await Promise.all([
      this.prisma.blogComment.findMany({
        where: {
          blogPostId: post.id,
          parentId: null,
          status: APPROVED,
        },

        skip,
        take: limit,

        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],

        select: {
          id: true,
          parentId: true,
          body: true,

          authorType: true,
          authorDisplayName: true,

          publishedAt: true,
          createdAt: true,
        },
      }),

      this.prisma.blogComment.count({
        where: {
          blogPostId: post.id,
          parentId: null,
          status: APPROVED,
        },
      }),

      this.prisma.blogComment.count({
        where: {
          blogPostId: post.id,
          status: APPROVED,
        },
      }),

      this.prisma.blogComment.findMany({
        where: {
          blogPostId: post.id,

          parentId: {
            not: null,
          },

          status: APPROVED,
        },

        orderBy: [
          {
            publishedAt: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],

        select: {
          id: true,
          parentId: true,
          body: true,

          authorType: true,
          authorDisplayName: true,

          publishedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const childrenByParent = new Map<string, PublicCommentRow[]>();

    for (const reply of replies) {
      if (!reply.parentId) {
        continue;
      }

      const current = childrenByParent.get(reply.parentId) ?? [];

      current.push(reply);

      childrenByParent.set(reply.parentId, current);
    }

    const buildChildren = (parentId: string, visited = new Set<string>()): unknown[] => {
      if (visited.has(parentId)) {
        return [];
      }

      const nextVisited = new Set(visited);

      nextVisited.add(parentId);

      const children = childrenByParent.get(parentId) ?? [];

      return children.map((comment) => ({
        ...this.mapComment(comment),

        replies: buildChildren(comment.id, nextVisited),
      }));
    };

    return {
      data: {
        enabled: true,

        officialIdentity: this.buildOfficialIdentity(settings),

        canComment: Boolean(user),

        commentsCount: totalComments,

        threadsCount: totalThreads,

        comments: roots.map((comment) => ({
          ...this.mapComment(comment),

          replies: buildChildren(comment.id),
        })),
      },

      meta: {
        page,
        limit,
        total: totalThreads,

        totalPages: Math.ceil(totalThreads / limit),
      },
    };
  }

  async createComment(slug: string, dto: CreateBlogCommentDto, user: AuthenticatedUser) {
    const post = await this.findPublicPost(slug);

    const settings = await this.findSettings();

    if (!settings.blogCommentsEnabled) {
      throw new ForbiddenException('ثبت دیدگاه برای مقالات غیرفعال است');
    }

    if (dto.parentId) {
      const parent = await this.prisma.blogComment.findFirst({
        where: {
          id: dto.parentId,

          blogPostId: post.id,

          status: APPROVED,
        },

        select: {
          id: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('دیدگاهی که می‌خواهید به آن پاسخ دهید پیدا نشد');
      }
    }

    const comment = await this.prisma.blogComment.create({
      data: {
        blogPostId: post.id,

        parentId: dto.parentId ?? null,

        authorUserId: user.id,

        authorType: InteractionAuthorType.USER,

        authorDisplayName: this.buildUserDisplayName(user),

        body: dto.body,

        status: ContentModerationStatus.PENDING,

        source: InteractionSource.SITE,
      },

      select: {
        id: true,
        parentId: true,

        body: true,

        status: true,

        createdAt: true,
      },
    });

    return {
      data: comment,

      message: dto.parentId
        ? 'پاسخ شما ثبت شد و پس از بررسی نمایش داده می‌شود.'
        : 'دیدگاه شما ثبت شد و پس از بررسی نمایش داده می‌شود.',
    };
  }

  private async findPublicPost(slug: string) {
    const now = new Date();

    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,

        status: BlogPostStatus.PUBLISHED,

        publishedAt: {
          lte: now,
        },

        category: {
          is: {
            isActive: true,
          },
        },
      },

      select: {
        id: true,
        slug: true,
        title: true,
      },
    });

    if (!post) {
      throw new NotFoundException('مقاله پیدا نشد');
    }

    return post;
  }

  private async findSettings() {
    const settings = await this.prisma.siteSetting.findUnique({
      where: {
        id: SITE_SETTINGS_ID,
      },

      select: {
        supportDisplayName: true,
        supportAvatarUrl: true,
        supportBadgeLabel: true,

        blogCommentsEnabled: true,
      },
    });

    return {
      supportDisplayName: settings?.supportDisplayName ?? 'پارت‌سنج',

      supportAvatarUrl: settings?.supportAvatarUrl ?? null,

      supportBadgeLabel: settings?.supportBadgeLabel ?? 'پاسخ رسمی پارت‌سنج',

      blogCommentsEnabled: settings?.blogCommentsEnabled ?? true,
    };
  }

  private buildOfficialIdentity(settings: {
    supportDisplayName: string;
    supportAvatarUrl: string | null;
    supportBadgeLabel: string;
  }) {
    return {
      displayName: settings.supportDisplayName,

      avatarUrl: settings.supportAvatarUrl,

      badgeLabel: settings.supportBadgeLabel,
    };
  }

  private mapComment(comment: PublicCommentRow) {
    return {
      id: comment.id,
      parentId: comment.parentId,

      body: comment.body,

      author: {
        type: comment.authorType,

        displayName:
          comment.authorDisplayName ||
          (comment.authorType === InteractionAuthorType.STAFF ? 'پارت‌سنج' : 'کاربر پارت‌سنج'),

        isOfficial: comment.authorType === InteractionAuthorType.STAFF,
      },

      publishedAt: comment.publishedAt ?? comment.createdAt,
    };
  }

  private buildUserDisplayName(user: AuthenticatedUser) {
    const firstName = user.firstName?.trim() ?? '';

    const lastName = user.lastName?.trim() ?? '';

    if (firstName && lastName) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }

    if (firstName) {
      return firstName;
    }

    if (lastName) {
      return `${lastName.charAt(0)}.`;
    }

    return 'کاربر پارت‌سنج';
  }
}
