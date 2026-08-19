import { Injectable, NotFoundException } from '@nestjs/common';

import {
  BlogPostStatus,
  ContentModerationStatus,
  ContentReportStatus,
  ContentReportTargetType,
} from '../../../generated/prisma/client.js';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateContentReportDto } from './dto/create-content-report.dto.js';

const APPROVED = ContentModerationStatus.APPROVED;

@Injectable()
export class ContentReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContentReportDto, reporterUserId: string) {
    await this.ensurePublicTargetExists(dto.targetType, dto.targetId);

    const existing = await this.prisma.userContentReport.findUnique({
      where: {
        targetType_targetId_reporterUserId: {
          targetType: dto.targetType,

          targetId: dto.targetId,

          reporterUserId,
        },
      },

      select: {
        id: true,

        status: true,

        createdAt: true,
      },
    });

    if (existing) {
      return {
        data: {
          ...existing,

          alreadyReported: true,
        },

        message: 'این محتوا قبلاً توسط شما گزارش شده است.',
      };
    }

    const report = await this.prisma.userContentReport.create({
      data: {
        reporterUserId,

        targetType: dto.targetType,

        targetId: dto.targetId,

        reason: dto.reason,

        details: dto.details ?? null,

        status: ContentReportStatus.OPEN,
      },

      select: {
        id: true,

        targetType: true,
        targetId: true,

        reason: true,
        details: true,

        status: true,

        createdAt: true,
      },
    });

    return {
      data: {
        ...report,

        alreadyReported: false,
      },

      message: 'گزارش شما ثبت شد. ممنون که به حفظ کیفیت محتوا کمک می‌کنید.',
    };
  }

  private async ensurePublicTargetExists(type: ContentReportTargetType, id: string) {
    switch (type) {
      case ContentReportTargetType.PRODUCT_REVIEW: {
        const target = await this.prisma.productReview.findFirst({
          where: {
            id,
            status: APPROVED,
          },

          select: {
            id: true,
          },
        });

        if (!target) {
          throw new NotFoundException('نظر موردنظر پیدا نشد');
        }

        return;
      }

      case ContentReportTargetType.PRODUCT_REVIEW_REPLY: {
        const target = await this.prisma.productReviewReply.findFirst({
          where: {
            id,
            status: APPROVED,

            review: {
              is: {
                status: APPROVED,
              },
            },
          },

          select: {
            id: true,
          },
        });

        if (!target) {
          throw new NotFoundException('پاسخ موردنظر پیدا نشد');
        }

        return;
      }

      case ContentReportTargetType.PRODUCT_QUESTION: {
        const target = await this.prisma.productQuestion.findFirst({
          where: {
            id,
            status: APPROVED,
          },

          select: {
            id: true,
          },
        });

        if (!target) {
          throw new NotFoundException('پرسش موردنظر پیدا نشد');
        }

        return;
      }

      case ContentReportTargetType.PRODUCT_QUESTION_REPLY: {
        const target = await this.prisma.productQuestionReply.findFirst({
          where: {
            id,
            status: APPROVED,

            question: {
              is: {
                status: APPROVED,
              },
            },
          },

          select: {
            id: true,
          },
        });

        if (!target) {
          throw new NotFoundException('پاسخ موردنظر پیدا نشد');
        }

        return;
      }

      case ContentReportTargetType.BLOG_COMMENT: {
        const target = await this.prisma.blogComment.findFirst({
          where: {
            id,
            status: APPROVED,

            blogPost: {
              is: {
                status: BlogPostStatus.PUBLISHED,

                publishedAt: {
                  lte: new Date(),
                },
              },
            },
          },

          select: {
            id: true,
          },
        });

        if (!target) {
          throw new NotFoundException('دیدگاه موردنظر پیدا نشد');
        }

        return;
      }
    }

    throw new NotFoundException('محتوای موردنظر پیدا نشد');
  }
}
