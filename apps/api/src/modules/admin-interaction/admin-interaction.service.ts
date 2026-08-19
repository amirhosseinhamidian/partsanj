import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminAuditAction,
  AdminAuditEntityType,
  ContentModerationStatus,
  ContentReportStatus,
  InteractionAuthorType,
  InteractionSource,
  Prisma,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminInteractionType } from './admin-interaction-type.enum.js';
import { AdminInteractionListQueryDto } from './dto/admin-interaction-list-query.dto.js';

type AdminInteractionAuthor = {
  id: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
};

type AdminInteractionListItem = {
  type: AdminInteractionType;

  id: string;
  parentId: string | null;
  rootId: string | null;

  body: string | null;
  rating: number | null;

  status: ContentModerationStatus;

  authorType: InteractionAuthorType;
  authorDisplayName: string | null;
  authorUser: AdminInteractionAuthor | null;

  isVerifiedPurchase: boolean;

  source: InteractionSource;
  sourceReference: string | null;

  target: {
    type: 'product' | 'blog-post';
    id: string;
    title: string;
    slug: string;
    sku: string | null;
  };

  createdAt: Date;
  moderatedAt: Date | null;
  publishedAt: Date | null;
};

type InteractionChunk = {
  data: AdminInteractionListItem[];
  total: number;
};

const authorUserSelect = {
  id: true,
  mobile: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminInteractionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      productReviews,
      productReviewReplies,
      productQuestions,
      productQuestionReplies,
      blogComments,
      openReports,
    ] = await this.prisma.$transaction([
      this.prisma.productReview.count({
        where: {
          status: ContentModerationStatus.PENDING,
        },
      }),

      this.prisma.productReviewReply.count({
        where: {
          status: ContentModerationStatus.PENDING,
        },
      }),

      this.prisma.productQuestion.count({
        where: {
          status: ContentModerationStatus.PENDING,
        },
      }),

      this.prisma.productQuestionReply.count({
        where: {
          status: ContentModerationStatus.PENDING,
        },
      }),

      this.prisma.blogComment.count({
        where: {
          status: ContentModerationStatus.PENDING,
        },
      }),

      this.prisma.userContentReport.count({
        where: {
          status: ContentReportStatus.OPEN,
        },
      }),
    ]);

    const totalPending =
      productReviews +
      productReviewReplies +
      productQuestions +
      productQuestionReplies +
      blogComments;

    return {
      data: {
        totalPending,

        pending: {
          productReviews,
          productReviewReplies,
          productQuestions,
          productQuestionReplies,
          blogComments,
        },

        openReports,
      },
    };
  }

  async findMany(query: AdminInteractionListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;

    /*
     * برای pagination یکپارچه باید حداقل skip + limit رکورد
     * از هر منبع بگیریم و بعد همه را با هم sort کنیم.
     */
    const fetchLimit = skip + limit;

    const types: AdminInteractionType[] = query.type
      ? [query.type]
      : [
          AdminInteractionType.PRODUCT_REVIEW,
          AdminInteractionType.PRODUCT_REVIEW_REPLY,
          AdminInteractionType.PRODUCT_QUESTION,
          AdminInteractionType.PRODUCT_QUESTION_REPLY,
          AdminInteractionType.BLOG_COMMENT,
        ];

    const chunks = await Promise.all(types.map((type) => this.fetchType(type, query, fetchLimit)));

    const total = chunks.reduce((sum, chunk) => sum + chunk.total, 0);

    const all = chunks
      .flatMap((chunk) => chunk.data)
      .sort((a, b) => {
        const dateDiff = b.createdAt.getTime() - a.createdAt.getTime();

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return b.id.localeCompare(a.id);
      });

    return {
      data: all.slice(skip, skip + limit),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async moderate(
    type: AdminInteractionType,
    id: string,
    status: ContentModerationStatus,
    actorUserId: string,
  ) {
    switch (type) {
      case AdminInteractionType.PRODUCT_REVIEW:
        return this.moderateProductReview(id, status, actorUserId);

      case AdminInteractionType.PRODUCT_REVIEW_REPLY:
        return this.moderateProductReviewReply(id, status, actorUserId);

      case AdminInteractionType.PRODUCT_QUESTION:
        return this.moderateProductQuestion(id, status, actorUserId);

      case AdminInteractionType.PRODUCT_QUESTION_REPLY:
        return this.moderateProductQuestionReply(id, status, actorUserId);

      case AdminInteractionType.BLOG_COMMENT:
        return this.moderateBlogComment(id, status, actorUserId);
    }
  }

  async reply(type: AdminInteractionType, id: string, body: string, actorUserId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const settings = await transaction.siteSetting.findUnique({
        where: {
          id: 'site',
        },
        select: {
          supportDisplayName: true,
        },
      });

      const supportDisplayName = settings?.supportDisplayName?.trim() || 'پارت‌سنج';

      const now = new Date();

      if (type === AdminInteractionType.PRODUCT_REVIEW) {
        const target = await transaction.productReview.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            status: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!target) {
          throw new NotFoundException('Product review not found');
        }

        this.ensureReplyable(target.status);

        const reply = await transaction.productReviewReply.create({
          data: {
            reviewId: target.id,

            authorUserId: actorUserId,
            authorType: InteractionAuthorType.STAFF,
            authorDisplayName: supportDisplayName,

            body,

            status: ContentModerationStatus.APPROVED,
            source: InteractionSource.ADMIN,

            moderatedAt: now,
            publishedAt: now,
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            actorUserId,
            entityType: AdminAuditEntityType.PRODUCT_REVIEW_REPLY,
            entityId: reply.id,
            entityLabel: `پاسخ رسمی به نظر ${target.product.name}`,
            action: AdminAuditAction.REPLIED,

            changes: {
              parentType: type,
              parentId: target.id,
            },
          },
        });

        return {
          data: reply,
        };
      }

      if (type === AdminInteractionType.PRODUCT_REVIEW_REPLY) {
        const target = await transaction.productReviewReply.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            reviewId: true,
            status: true,

            review: {
              select: {
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!target) {
          throw new NotFoundException('Product review reply not found');
        }

        this.ensureReplyable(target.status);

        const reply = await transaction.productReviewReply.create({
          data: {
            reviewId: target.reviewId,
            parentId: target.id,

            authorUserId: actorUserId,
            authorType: InteractionAuthorType.STAFF,
            authorDisplayName: supportDisplayName,

            body,

            status: ContentModerationStatus.APPROVED,
            source: InteractionSource.ADMIN,

            moderatedAt: now,
            publishedAt: now,
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            actorUserId,
            entityType: AdminAuditEntityType.PRODUCT_REVIEW_REPLY,
            entityId: reply.id,
            entityLabel: `پاسخ رسمی به نظر ${target.review.product.name}`,
            action: AdminAuditAction.REPLIED,

            changes: {
              parentType: type,
              parentId: target.id,
            },
          },
        });

        return {
          data: reply,
        };
      }

      if (type === AdminInteractionType.PRODUCT_QUESTION) {
        const target = await transaction.productQuestion.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            status: true,

            product: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!target) {
          throw new NotFoundException('Product question not found');
        }

        this.ensureReplyable(target.status);

        const reply = await transaction.productQuestionReply.create({
          data: {
            questionId: target.id,

            authorUserId: actorUserId,
            authorType: InteractionAuthorType.STAFF,
            authorDisplayName: supportDisplayName,

            body,

            status: ContentModerationStatus.APPROVED,
            source: InteractionSource.ADMIN,

            moderatedAt: now,
            publishedAt: now,
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            actorUserId,
            entityType: AdminAuditEntityType.PRODUCT_QUESTION_REPLY,
            entityId: reply.id,
            entityLabel: `پاسخ رسمی به پرسش ${target.product.name}`,
            action: AdminAuditAction.REPLIED,

            changes: {
              parentType: type,
              parentId: target.id,
            },
          },
        });

        return {
          data: reply,
        };
      }

      if (type === AdminInteractionType.PRODUCT_QUESTION_REPLY) {
        const target = await transaction.productQuestionReply.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            questionId: true,
            status: true,

            question: {
              select: {
                product: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!target) {
          throw new NotFoundException('Product question reply not found');
        }

        this.ensureReplyable(target.status);

        const reply = await transaction.productQuestionReply.create({
          data: {
            questionId: target.questionId,
            parentId: target.id,

            authorUserId: actorUserId,
            authorType: InteractionAuthorType.STAFF,
            authorDisplayName: supportDisplayName,

            body,

            status: ContentModerationStatus.APPROVED,
            source: InteractionSource.ADMIN,

            moderatedAt: now,
            publishedAt: now,
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            actorUserId,
            entityType: AdminAuditEntityType.PRODUCT_QUESTION_REPLY,
            entityId: reply.id,
            entityLabel: `پاسخ رسمی به پرسش ${target.question.product.name}`,
            action: AdminAuditAction.REPLIED,

            changes: {
              parentType: type,
              parentId: target.id,
            },
          },
        });

        return {
          data: reply,
        };
      }

      if (type === AdminInteractionType.BLOG_COMMENT) {
        const target = await transaction.blogComment.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            blogPostId: true,
            status: true,

            blogPost: {
              select: {
                title: true,
              },
            },
          },
        });

        if (!target) {
          throw new NotFoundException('Blog comment not found');
        }

        this.ensureReplyable(target.status);

        const reply = await transaction.blogComment.create({
          data: {
            blogPostId: target.blogPostId,
            parentId: target.id,

            authorUserId: actorUserId,
            authorType: InteractionAuthorType.STAFF,
            authorDisplayName: supportDisplayName,

            body,

            status: ContentModerationStatus.APPROVED,
            source: InteractionSource.ADMIN,

            moderatedAt: now,
            publishedAt: now,
          },
        });

        await transaction.adminAuditLog.create({
          data: {
            actorUserId,
            entityType: AdminAuditEntityType.BLOG_COMMENT,
            entityId: reply.id,
            entityLabel: `پاسخ رسمی به دیدگاه ${target.blogPost.title}`,
            action: AdminAuditAction.REPLIED,

            changes: {
              parentType: type,
              parentId: target.id,
            },
          },
        });

        return {
          data: reply,
        };
      }

      throw new NotFoundException('Interaction type not found');
    });
  }

  private async fetchType(
    type: AdminInteractionType,
    query: AdminInteractionListQueryDto,
    take: number,
  ): Promise<InteractionChunk> {
    switch (type) {
      case AdminInteractionType.PRODUCT_REVIEW:
        return this.fetchProductReviews(query, take);

      case AdminInteractionType.PRODUCT_REVIEW_REPLY:
        return this.fetchProductReviewReplies(query, take);

      case AdminInteractionType.PRODUCT_QUESTION:
        return this.fetchProductQuestions(query, take);

      case AdminInteractionType.PRODUCT_QUESTION_REPLY:
        return this.fetchProductQuestionReplies(query, take);

      case AdminInteractionType.BLOG_COMMENT:
        return this.fetchBlogComments(query, take);
    }
  }

  private async fetchProductReviews(
    query: AdminInteractionListQueryDto,
    take: number,
  ): Promise<InteractionChunk> {
    if (query.blogPostId) {
      return {
        data: [],
        total: 0,
      };
    }

    const q = query.q?.trim();

    const where: Prisma.ProductReviewWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.productId && {
        productId: query.productId,
      }),

      ...(q && {
        OR: [
          {
            body: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            authorDisplayName: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            product: {
              is: {
                OR: [
                  {
                    name: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },

                  {
                    sku: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },

                  {
                    slug: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.productReview.findMany({
        where,
        take,

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
          body: true,
          rating: true,

          status: true,

          authorType: true,
          authorDisplayName: true,

          isVerifiedPurchase: true,

          source: true,
          sourceReference: true,

          createdAt: true,
          moderatedAt: true,
          publishedAt: true,

          authorUser: {
            select: authorUserSelect,
          },

          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
        },
      }),

      this.prisma.productReview.count({
        where,
      }),
    ]);

    return {
      total,

      data: rows.map((row) => ({
        type: AdminInteractionType.PRODUCT_REVIEW,

        id: row.id,
        parentId: null,
        rootId: row.id,

        body: row.body,
        rating: row.rating,

        status: row.status,

        authorType: row.authorType,
        authorDisplayName: this.resolveAuthorName(row.authorDisplayName, row.authorUser),
        authorUser: row.authorUser,

        isVerifiedPurchase: row.isVerifiedPurchase,

        source: row.source,
        sourceReference: row.sourceReference,

        target: {
          type: 'product',
          id: row.product.id,
          title: row.product.name,
          slug: row.product.slug,
          sku: row.product.sku,
        },

        createdAt: row.createdAt,
        moderatedAt: row.moderatedAt,
        publishedAt: row.publishedAt,
      })),
    };
  }

  private async fetchProductReviewReplies(
    query: AdminInteractionListQueryDto,
    take: number,
  ): Promise<InteractionChunk> {
    if (query.blogPostId) {
      return {
        data: [],
        total: 0,
      };
    }

    const q = query.q?.trim();

    const and: Prisma.ProductReviewReplyWhereInput[] = [];

    if (query.productId) {
      and.push({
        review: {
          is: {
            productId: query.productId,
          },
        },
      });
    }

    if (q) {
      and.push({
        OR: [
          {
            body: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            authorDisplayName: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            review: {
              is: {
                product: {
                  is: {
                    OR: [
                      {
                        name: {
                          contains: q,
                          mode: 'insensitive',
                        },
                      },

                      {
                        sku: {
                          contains: q,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      });
    }

    const where: Prisma.ProductReviewReplyWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(and.length > 0 && {
        AND: and,
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.productReviewReply.findMany({
        where,
        take,

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
          parentId: true,
          body: true,

          status: true,

          authorType: true,
          authorDisplayName: true,

          source: true,
          sourceReference: true,

          createdAt: true,
          moderatedAt: true,
          publishedAt: true,

          authorUser: {
            select: authorUserSelect,
          },

          review: {
            select: {
              id: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.productReviewReply.count({
        where,
      }),
    ]);

    return {
      total,

      data: rows.map((row) => ({
        type: AdminInteractionType.PRODUCT_REVIEW_REPLY,

        id: row.id,
        parentId: row.parentId ?? row.review.id,
        rootId: row.review.id,

        body: row.body,
        rating: null,

        status: row.status,

        authorType: row.authorType,
        authorDisplayName: this.resolveAuthorName(row.authorDisplayName, row.authorUser),
        authorUser: row.authorUser,

        isVerifiedPurchase: false,

        source: row.source,
        sourceReference: row.sourceReference,

        target: {
          type: 'product',
          id: row.review.product.id,
          title: row.review.product.name,
          slug: row.review.product.slug,
          sku: row.review.product.sku,
        },

        createdAt: row.createdAt,
        moderatedAt: row.moderatedAt,
        publishedAt: row.publishedAt,
      })),
    };
  }

  private async fetchProductQuestions(
    query: AdminInteractionListQueryDto,
    take: number,
  ): Promise<InteractionChunk> {
    if (query.blogPostId) {
      return {
        data: [],
        total: 0,
      };
    }

    const q = query.q?.trim();

    const where: Prisma.ProductQuestionWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.productId && {
        productId: query.productId,
      }),

      ...(q && {
        OR: [
          {
            body: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            authorDisplayName: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            product: {
              is: {
                OR: [
                  {
                    name: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },

                  {
                    sku: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.productQuestion.findMany({
        where,
        take,

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
          body: true,

          status: true,

          authorType: true,
          authorDisplayName: true,

          source: true,
          sourceReference: true,

          createdAt: true,
          moderatedAt: true,
          publishedAt: true,

          authorUser: {
            select: authorUserSelect,
          },

          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              sku: true,
            },
          },
        },
      }),

      this.prisma.productQuestion.count({
        where,
      }),
    ]);

    return {
      total,

      data: rows.map((row) => ({
        type: AdminInteractionType.PRODUCT_QUESTION,

        id: row.id,
        parentId: null,
        rootId: row.id,

        body: row.body,
        rating: null,

        status: row.status,

        authorType: row.authorType,
        authorDisplayName: this.resolveAuthorName(row.authorDisplayName, row.authorUser),
        authorUser: row.authorUser,

        isVerifiedPurchase: false,

        source: row.source,
        sourceReference: row.sourceReference,

        target: {
          type: 'product',
          id: row.product.id,
          title: row.product.name,
          slug: row.product.slug,
          sku: row.product.sku,
        },

        createdAt: row.createdAt,
        moderatedAt: row.moderatedAt,
        publishedAt: row.publishedAt,
      })),
    };
  }

  private async fetchProductQuestionReplies(
    query: AdminInteractionListQueryDto,
    take: number,
  ): Promise<InteractionChunk> {
    if (query.blogPostId) {
      return {
        data: [],
        total: 0,
      };
    }

    const q = query.q?.trim();

    const and: Prisma.ProductQuestionReplyWhereInput[] = [];

    if (query.productId) {
      and.push({
        question: {
          is: {
            productId: query.productId,
          },
        },
      });
    }

    if (q) {
      and.push({
        OR: [
          {
            body: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            authorDisplayName: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            question: {
              is: {
                product: {
                  is: {
                    OR: [
                      {
                        name: {
                          contains: q,
                          mode: 'insensitive',
                        },
                      },

                      {
                        sku: {
                          contains: q,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      });
    }

    const where: Prisma.ProductQuestionReplyWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(and.length > 0 && {
        AND: and,
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.productQuestionReply.findMany({
        where,
        take,

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
          parentId: true,
          body: true,

          status: true,

          authorType: true,
          authorDisplayName: true,

          source: true,
          sourceReference: true,

          createdAt: true,
          moderatedAt: true,
          publishedAt: true,

          authorUser: {
            select: authorUserSelect,
          },

          question: {
            select: {
              id: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.productQuestionReply.count({
        where,
      }),
    ]);

    return {
      total,

      data: rows.map((row) => ({
        type: AdminInteractionType.PRODUCT_QUESTION_REPLY,

        id: row.id,
        parentId: row.parentId ?? row.question.id,
        rootId: row.question.id,

        body: row.body,
        rating: null,

        status: row.status,

        authorType: row.authorType,
        authorDisplayName: this.resolveAuthorName(row.authorDisplayName, row.authorUser),
        authorUser: row.authorUser,

        isVerifiedPurchase: false,

        source: row.source,
        sourceReference: row.sourceReference,

        target: {
          type: 'product',
          id: row.question.product.id,
          title: row.question.product.name,
          slug: row.question.product.slug,
          sku: row.question.product.sku,
        },

        createdAt: row.createdAt,
        moderatedAt: row.moderatedAt,
        publishedAt: row.publishedAt,
      })),
    };
  }

  private async fetchBlogComments(
    query: AdminInteractionListQueryDto,
    take: number,
  ): Promise<InteractionChunk> {
    if (query.productId) {
      return {
        data: [],
        total: 0,
      };
    }

    const q = query.q?.trim();

    const where: Prisma.BlogCommentWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.blogPostId && {
        blogPostId: query.blogPostId,
      }),

      ...(q && {
        OR: [
          {
            body: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            authorDisplayName: {
              contains: q,
              mode: 'insensitive',
            },
          },

          {
            blogPost: {
              is: {
                OR: [
                  {
                    title: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },

                  {
                    slug: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.blogComment.findMany({
        where,
        take,

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
          parentId: true,
          body: true,

          status: true,

          authorType: true,
          authorDisplayName: true,

          source: true,
          sourceReference: true,

          createdAt: true,
          moderatedAt: true,
          publishedAt: true,

          authorUser: {
            select: authorUserSelect,
          },

          blogPost: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),

      this.prisma.blogComment.count({
        where,
      }),
    ]);

    return {
      total,

      data: rows.map((row) => ({
        type: AdminInteractionType.BLOG_COMMENT,

        id: row.id,
        parentId: row.parentId,
        rootId: row.parentId ? null : row.id,

        body: row.body,
        rating: null,

        status: row.status,

        authorType: row.authorType,
        authorDisplayName: this.resolveAuthorName(row.authorDisplayName, row.authorUser),
        authorUser: row.authorUser,

        isVerifiedPurchase: false,

        source: row.source,
        sourceReference: row.sourceReference,

        target: {
          type: 'blog-post',
          id: row.blogPost.id,
          title: row.blogPost.title,
          slug: row.blogPost.slug,
          sku: null,
        },

        createdAt: row.createdAt,
        moderatedAt: row.moderatedAt,
        publishedAt: row.publishedAt,
      })),
    };
  }

  private async moderateProductReview(
    id: string,
    status: ContentModerationStatus,
    actorUserId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.productReview.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          body: true,
          rating: true,
          status: true,
          publishedAt: true,

          product: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundException('Product review not found');
      }

      const now = new Date();

      const updated = await transaction.productReview.update({
        where: {
          id,
        },

        data: {
          status,
          moderatedAt: now,

          publishedAt:
            status === ContentModerationStatus.APPROVED ? (current.publishedAt ?? now) : null,
        },
      });

      await this.createModerationAudit(
        transaction,
        actorUserId,
        AdminAuditEntityType.PRODUCT_REVIEW,
        id,
        `نظر ${current.product.name}`,
        current.status,
        status,
      );

      return {
        data: updated,
      };
    });
  }

  private async moderateProductReviewReply(
    id: string,
    status: ContentModerationStatus,
    actorUserId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.productReviewReply.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
          publishedAt: true,

          review: {
            select: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundException('Product review reply not found');
      }

      const now = new Date();

      const updated = await transaction.productReviewReply.update({
        where: {
          id,
        },

        data: {
          status,
          moderatedAt: now,

          publishedAt:
            status === ContentModerationStatus.APPROVED ? (current.publishedAt ?? now) : null,
        },
      });

      await this.createModerationAudit(
        transaction,
        actorUserId,
        AdminAuditEntityType.PRODUCT_REVIEW_REPLY,
        id,
        `پاسخ نظر ${current.review.product.name}`,
        current.status,
        status,
      );

      return {
        data: updated,
      };
    });
  }

  private async moderateProductQuestion(
    id: string,
    status: ContentModerationStatus,
    actorUserId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.productQuestion.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
          publishedAt: true,

          product: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundException('Product question not found');
      }

      const now = new Date();

      const updated = await transaction.productQuestion.update({
        where: {
          id,
        },

        data: {
          status,
          moderatedAt: now,

          publishedAt:
            status === ContentModerationStatus.APPROVED ? (current.publishedAt ?? now) : null,
        },
      });

      await this.createModerationAudit(
        transaction,
        actorUserId,
        AdminAuditEntityType.PRODUCT_QUESTION,
        id,
        `پرسش ${current.product.name}`,
        current.status,
        status,
      );

      return {
        data: updated,
      };
    });
  }

  private async moderateProductQuestionReply(
    id: string,
    status: ContentModerationStatus,
    actorUserId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.productQuestionReply.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
          publishedAt: true,

          question: {
            select: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundException('Product question reply not found');
      }

      const now = new Date();

      const updated = await transaction.productQuestionReply.update({
        where: {
          id,
        },

        data: {
          status,
          moderatedAt: now,

          publishedAt:
            status === ContentModerationStatus.APPROVED ? (current.publishedAt ?? now) : null,
        },
      });

      await this.createModerationAudit(
        transaction,
        actorUserId,
        AdminAuditEntityType.PRODUCT_QUESTION_REPLY,
        id,
        `پاسخ پرسش ${current.question.product.name}`,
        current.status,
        status,
      );

      return {
        data: updated,
      };
    });
  }

  private async moderateBlogComment(
    id: string,
    status: ContentModerationStatus,
    actorUserId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.blogComment.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          status: true,
          publishedAt: true,

          blogPost: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundException('Blog comment not found');
      }

      const now = new Date();

      const updated = await transaction.blogComment.update({
        where: {
          id,
        },

        data: {
          status,
          moderatedAt: now,

          publishedAt:
            status === ContentModerationStatus.APPROVED ? (current.publishedAt ?? now) : null,
        },
      });

      await this.createModerationAudit(
        transaction,
        actorUserId,
        AdminAuditEntityType.BLOG_COMMENT,
        id,
        `دیدگاه ${current.blogPost.title}`,
        current.status,
        status,
      );

      return {
        data: updated,
      };
    });
  }

  private async createModerationAudit(
    transaction: Prisma.TransactionClient,
    actorUserId: string,
    entityType: AdminAuditEntityType,
    entityId: string,
    entityLabel: string,
    previousStatus: ContentModerationStatus,
    nextStatus: ContentModerationStatus,
  ) {
    await transaction.adminAuditLog.create({
      data: {
        actorUserId,
        entityType,
        entityId,
        entityLabel,
        action: this.auditActionForStatus(nextStatus),

        changes: {
          status: {
            from: previousStatus,
            to: nextStatus,
          },
        },
      },
    });
  }

  private auditActionForStatus(status: ContentModerationStatus): AdminAuditAction {
    switch (status) {
      case ContentModerationStatus.APPROVED:
        return AdminAuditAction.APPROVED;

      case ContentModerationStatus.REJECTED:
        return AdminAuditAction.REJECTED;

      case ContentModerationStatus.SPAM:
        return AdminAuditAction.MARKED_SPAM;

      case ContentModerationStatus.DELETED:
        return AdminAuditAction.DELETED;

      default:
        return AdminAuditAction.UPDATED;
    }
  }

  private resolveAuthorName(authorDisplayName: string | null, user: AdminInteractionAuthor | null) {
    if (authorDisplayName?.trim()) {
      return authorDisplayName.trim();
    }

    if (!user) {
      return null;
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    return `کاربر ${user.mobile.slice(-4)}`;
  }

  private ensureReplyable(status: ContentModerationStatus) {
    if (status === ContentModerationStatus.DELETED || status === ContentModerationStatus.SPAM) {
      throw new ConflictException('Cannot reply to deleted or spam content');
    }
  }
}
