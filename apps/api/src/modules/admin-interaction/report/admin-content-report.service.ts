import { Injectable, NotFoundException } from '@nestjs/common';

import {
  AdminAuditAction,
  AdminAuditEntityType,
  ContentReportStatus,
  ContentReportTargetType,
  Prisma,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';

import { AdminContentReportListQueryDto } from './dto/admin-content-report-list-query.dto.js';

@Injectable()
export class AdminContentReportService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: AdminContentReportListQueryDto) {
    const page = query.page ?? 1;

    const limit = query.limit ?? 25;

    const skip = (page - 1) * limit;

    const where: Prisma.UserContentReportWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.targetType && {
        targetType: query.targetType,
      }),
    };

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.userContentReport.findMany({
        where,

        skip,
        take: limit,

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

          targetType: true,
          targetId: true,

          reason: true,
          details: true,

          status: true,

          resolvedAt: true,

          createdAt: true,
          updatedAt: true,

          reporter: {
            select: {
              id: true,
              mobile: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      this.prisma.userContentReport.count({
        where,
      }),
    ]);

    const targets = await this.loadTargetPreviews(
      reports.map((report) => ({
        targetType: report.targetType,

        targetId: report.targetId,
      })),
    );

    return {
      data: reports.map((report) => ({
        ...report,

        target: targets.get(this.targetKey(report.targetType, report.targetId)) ?? null,
      })),

      meta: {
        page,
        limit,
        total,

        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(reportId: string, status: ContentReportStatus, actorUserId: string) {
    const current = await this.prisma.userContentReport.findUnique({
      where: {
        id: reportId,
      },

      select: {
        id: true,

        targetType: true,
        targetId: true,

        status: true,
      },
    });

    if (!current) {
      throw new NotFoundException('گزارش پیدا نشد');
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const report = await transaction.userContentReport.update({
        where: {
          id: reportId,
        },

        data: {
          status,

          resolvedAt: new Date(),
        },
      });

      await transaction.adminAuditLog.create({
        data: {
          actorUserId,

          entityType: AdminAuditEntityType.USER_CONTENT_REPORT,

          entityId: reportId,

          entityLabel: 'گزارش محتوای کاربران',

          action: AdminAuditAction.UPDATED,

          changes: {
            status: {
              from: current.status,

              to: status,
            },

            targetType: current.targetType,

            targetId: current.targetId,
          },
        },
      });

      return report;
    });

    return {
      data: updated,
    };
  }

  private async loadTargetPreviews(
    targets: Array<{
      targetType: ContentReportTargetType;

      targetId: string;
    }>,
  ) {
    const result = new Map<string, unknown>();

    const idsFor = (type: ContentReportTargetType) => [
      ...new Set(targets.filter((item) => item.targetType === type).map((item) => item.targetId)),
    ];

    const reviewIds = idsFor(ContentReportTargetType.PRODUCT_REVIEW);

    const reviewReplyIds = idsFor(ContentReportTargetType.PRODUCT_REVIEW_REPLY);

    const questionIds = idsFor(ContentReportTargetType.PRODUCT_QUESTION);

    const questionReplyIds = idsFor(ContentReportTargetType.PRODUCT_QUESTION_REPLY);

    const blogCommentIds = idsFor(ContentReportTargetType.BLOG_COMMENT);

    const [reviews, reviewReplies, questions, questionReplies, blogComments] = await Promise.all([
      reviewIds.length
        ? this.prisma.productReview.findMany({
            where: {
              id: {
                in: reviewIds,
              },
            },

            select: {
              id: true,
              body: true,
              rating: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                },
              },
            },
          })
        : [],

      reviewReplyIds.length
        ? this.prisma.productReviewReply.findMany({
            where: {
              id: {
                in: reviewReplyIds,
              },
            },

            select: {
              id: true,
              body: true,

              review: {
                select: {
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
          })
        : [],

      questionIds.length
        ? this.prisma.productQuestion.findMany({
            where: {
              id: {
                in: questionIds,
              },
            },

            select: {
              id: true,
              body: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                },
              },
            },
          })
        : [],

      questionReplyIds.length
        ? this.prisma.productQuestionReply.findMany({
            where: {
              id: {
                in: questionReplyIds,
              },
            },

            select: {
              id: true,
              body: true,

              question: {
                select: {
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
          })
        : [],

      blogCommentIds.length
        ? this.prisma.blogComment.findMany({
            where: {
              id: {
                in: blogCommentIds,
              },
            },

            select: {
              id: true,
              body: true,

              blogPost: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
          })
        : [],
    ]);

    for (const row of reviews) {
      result.set(this.targetKey(ContentReportTargetType.PRODUCT_REVIEW, row.id), {
        content: row.body,

        rating: row.rating,

        destination: {
          type: 'product',

          ...row.product,
        },
      });
    }

    for (const row of reviewReplies) {
      result.set(this.targetKey(ContentReportTargetType.PRODUCT_REVIEW_REPLY, row.id), {
        content: row.body,

        destination: {
          type: 'product',

          ...row.review.product,
        },
      });
    }

    for (const row of questions) {
      result.set(this.targetKey(ContentReportTargetType.PRODUCT_QUESTION, row.id), {
        content: row.body,

        destination: {
          type: 'product',

          ...row.product,
        },
      });
    }

    for (const row of questionReplies) {
      result.set(this.targetKey(ContentReportTargetType.PRODUCT_QUESTION_REPLY, row.id), {
        content: row.body,

        destination: {
          type: 'product',

          ...row.question.product,
        },
      });
    }

    for (const row of blogComments) {
      result.set(this.targetKey(ContentReportTargetType.BLOG_COMMENT, row.id), {
        content: row.body,

        destination: {
          type: 'blog-post',

          id: row.blogPost.id,

          name: row.blogPost.title,

          slug: row.blogPost.slug,

          sku: null,
        },
      });
    }

    return result;
  }

  private targetKey(type: ContentReportTargetType, id: string) {
    return `${type}:${id}`;
  }
}
