import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentModerationStatus,
  InteractionAuthorType,
  InteractionSource,
  OrderPaymentStatus,
  OrderStatus,
  Prisma,
  ProductStatus,
} from '../../../generated/prisma/client.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateProductQuestionDto } from './dto/create-product-question.dto.js';
import { CreateProductQuestionReplyDto } from './dto/create-product-question-reply.dto.js';
import {
  ProductReviewListQueryDto,
  ProductReviewSort,
} from './dto/product-review-list-query.dto.js';
import { UpsertProductReviewDto } from './dto/upsert-product-review.dto.js';

const SITE_SETTINGS_ID = 'site';

const APPROVED = ContentModerationStatus.APPROVED;

@Injectable()
export class ProductInteractionService {
  constructor(private readonly prisma: PrismaService) {}

  async findReviews(slug: string, query: ProductReviewListQueryDto, user?: AuthenticatedUser) {
    const product = await this.findPublicProduct(slug);

    const settings = await this.findInteractionSettings();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    if (!settings.productReviewsEnabled) {
      return {
        data: {
          enabled: false,

          officialIdentity: this.buildOfficialIdentity(settings),

          summary: {
            averageRating: 0,
            ratingsCount: 0,

            breakdown: this.emptyRatingBreakdown(),
          },

          reviews: [],

          myReview: null,
        },

        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const where: Prisma.ProductReviewWhereInput = {
      productId: product.id,
      status: APPROVED,
    };

    /*
     * Reviewهای Importشده همچنان در لیست عمومی دیده می‌شوند،
     * اما فقط امتیازهایی که مستقیماً در پارت‌سنج ثبت شده‌اند
     * وارد Average Rating و Structured Data می‌شوند.
     */
    const ratingWhere: Prisma.ProductReviewWhereInput = {
      productId: product.id,
      status: APPROVED,
      source: InteractionSource.SITE,
    };
    const orderBy = this.buildReviewOrderBy(query.sort ?? ProductReviewSort.NEWEST);

    const [reviews, total, ratingsCount, average, groupedRatings, myReview] = await Promise.all([
      this.prisma.productReview.findMany({
        where,

        skip,
        take: limit,

        orderBy,

        select: {
          id: true,

          rating: true,
          body: true,

          authorType: true,
          authorDisplayName: true,

          isVerifiedPurchase: true,

          publishedAt: true,
          createdAt: true,

          _count: {
            select: {
              helpfulVotes: true,
            },
          },

          replies: {
            where: {
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
          },
        },
      }),

      this.prisma.productReview.count({
        where,
      }),

      /*
       * فقط Ratingهای ثبت‌شده در خود سایت
       */
      this.prisma.productReview.count({
        where: ratingWhere,
      }),

      this.prisma.productReview.aggregate({
        where: ratingWhere,

        _avg: {
          rating: true,
        },
      }),

      this.prisma.productReview.groupBy({
        by: ['rating'],

        where: ratingWhere,

        _count: {
          _all: true,
        },
      }),

      user
        ? this.prisma.productReview.findFirst({
            where: {
              productId: product.id,
              authorUserId: user.id,
              authorType: InteractionAuthorType.USER,
              source: InteractionSource.SITE,
            },

            orderBy: {
              updatedAt: 'desc',
            },

            select: {
              id: true,
              rating: true,
              body: true,
              status: true,

              isVerifiedPurchase: true,

              createdAt: true,
              updatedAt: true,
              publishedAt: true,
            },
          })
        : Promise.resolve(null),
    ]);

    const helpfulReviewIds =
      user && reviews.length > 0
        ? await this.prisma.productReviewHelpfulVote.findMany({
            where: {
              userId: user.id,

              reviewId: {
                in: reviews.map((review) => review.id),
              },
            },

            select: {
              reviewId: true,
            },
          })
        : [];

    const helpfulSet = new Set(helpfulReviewIds.map((item) => item.reviewId));

    const breakdown = this.buildRatingBreakdown(groupedRatings, ratingsCount);

    const averageRating = average._avg.rating === null ? 0 : Number(average._avg.rating.toFixed(1));

    return {
      data: {
        enabled: true,

        officialIdentity: this.buildOfficialIdentity(settings),

        summary: {
          averageRating,
          ratingsCount,
          breakdown,
        },

        reviews: reviews.map((review) => ({
          id: review.id,

          rating: review.rating,
          body: review.body,

          author: {
            type: review.authorType,

            displayName: review.authorDisplayName || 'کاربر پارت‌سنج',
          },

          isVerifiedPurchase: review.isVerifiedPurchase,

          helpfulCount: review._count.helpfulVotes,

          isHelpfulByCurrentUser: helpfulSet.has(review.id),

          publishedAt: review.publishedAt ?? review.createdAt,

          replies: review.replies.map((reply) => ({
            id: reply.id,
            parentId: reply.parentId,

            body: reply.body,

            author: {
              type: reply.authorType,

              displayName: reply.authorDisplayName || 'پارت‌سنج',
            },

            publishedAt: reply.publishedAt ?? reply.createdAt,
          })),
        })),

        myReview,
      },

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async upsertReview(slug: string, dto: UpsertProductReviewDto, user: AuthenticatedUser) {
    const product = await this.findPublicProduct(slug);

    const settings = await this.findInteractionSettings();

    if (!settings.productReviewsEnabled) {
      throw new ForbiddenException('ثبت نظر برای این سایت غیرفعال است');
    }

    const displayName = this.buildUserDisplayName(user);

    const verifiedPurchase = await this.hasVerifiedPurchase(product.id, user.id);

    const existing = await this.prisma.productReview.findFirst({
      where: {
        productId: product.id,

        authorUserId: user.id,

        authorType: InteractionAuthorType.USER,

        source: InteractionSource.SITE,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        status: true,
      },
    });

    if (
      existing?.status === ContentModerationStatus.SPAM ||
      existing?.status === ContentModerationStatus.DELETED
    ) {
      throw new ConflictException('این نظر در حال حاضر قابل ویرایش نیست');
    }

    const review = existing
      ? await this.prisma.productReview.update({
          where: {
            id: existing.id,
          },

          data: {
            rating: dto.rating,

            body: dto.body ?? null,

            authorDisplayName: displayName,

            isVerifiedPurchase: verifiedPurchase,

            status: ContentModerationStatus.PENDING,

            moderatedAt: null,
            publishedAt: null,
          },

          select: {
            id: true,
            rating: true,
            body: true,
            status: true,

            isVerifiedPurchase: true,

            createdAt: true,
            updatedAt: true,
          },
        })
      : await this.prisma.productReview.create({
          data: {
            productId: product.id,

            authorUserId: user.id,

            authorType: InteractionAuthorType.USER,

            authorDisplayName: displayName,

            rating: dto.rating,

            body: dto.body ?? null,

            isVerifiedPurchase: verifiedPurchase,

            status: ContentModerationStatus.PENDING,

            source: InteractionSource.SITE,
          },

          select: {
            id: true,
            rating: true,
            body: true,
            status: true,

            isVerifiedPurchase: true,

            createdAt: true,
            updatedAt: true,
          },
        });

    return {
      data: review,

      message: 'امتیاز و نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.',
    };
  }

  async markReviewHelpful(slug: string, reviewId: string, userId: string) {
    const product = await this.findPublicProduct(slug);

    const settings = await this.findInteractionSettings();

    if (!settings.productReviewsEnabled) {
      throw new ForbiddenException('نظرات محصول غیرفعال است');
    }

    const review = await this.prisma.productReview.findFirst({
      where: {
        id: reviewId,
        productId: product.id,
        status: APPROVED,
      },

      select: {
        id: true,
      },
    });

    if (!review) {
      throw new NotFoundException('نظر موردنظر پیدا نشد');
    }

    await this.prisma.productReviewHelpfulVote.upsert({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },

      create: {
        reviewId,
        userId,
      },

      update: {},
    });

    const helpfulCount = await this.prisma.productReviewHelpfulVote.count({
      where: {
        reviewId,
      },
    });

    return {
      data: {
        reviewId,

        isHelpful: true,

        helpfulCount,
      },
    };
  }

  async removeReviewHelpful(slug: string, reviewId: string, userId: string) {
    const product = await this.findPublicProduct(slug);

    const review = await this.prisma.productReview.findFirst({
      where: {
        id: reviewId,
        productId: product.id,
        status: APPROVED,
      },

      select: {
        id: true,
      },
    });

    if (!review) {
      throw new NotFoundException('نظر موردنظر پیدا نشد');
    }

    await this.prisma.productReviewHelpfulVote.deleteMany({
      where: {
        reviewId,
        userId,
      },
    });

    const helpfulCount = await this.prisma.productReviewHelpfulVote.count({
      where: {
        reviewId,
      },
    });

    return {
      data: {
        reviewId,

        isHelpful: false,

        helpfulCount,
      },
    };
  }

  async findQuestions(slug: string, user?: AuthenticatedUser) {
    const product = await this.findPublicProduct(slug);

    const settings = await this.findInteractionSettings();

    if (!settings.productQuestionsEnabled) {
      return {
        data: {
          enabled: false,

          officialIdentity: this.buildOfficialIdentity(settings),

          questionsCount: 0,

          questions: [],
        },
      };
    }

    const questions = await this.prisma.productQuestion.findMany({
      where: {
        productId: product.id,
        status: APPROVED,
      },

      orderBy: [
        {
          isPinned: 'desc',
        },
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],

      select: {
        id: true,
        body: true,

        authorUserId: true,

        authorType: true,
        authorDisplayName: true,

        isPinned: true,

        publishedAt: true,
        createdAt: true,

        replies: {
          where: {
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
        },
      },
    });

    return {
      data: {
        enabled: true,

        officialIdentity: this.buildOfficialIdentity(settings),

        questionsCount: questions.length,

        questions: questions.map((question) => ({
          id: question.id,

          body: question.body,

          author: {
            type: question.authorType,

            displayName: question.authorDisplayName || 'کاربر پارت‌سنج',
          },

          isPinned: question.isPinned,

          canCurrentUserReply: Boolean(user && question.authorUserId === user.id),

          publishedAt: question.publishedAt ?? question.createdAt,

          replies: question.replies.map((reply) => ({
            id: reply.id,
            parentId: reply.parentId,

            body: reply.body,

            author: {
              type: reply.authorType,

              displayName: reply.authorDisplayName || 'پارت‌سنج',
            },

            publishedAt: reply.publishedAt ?? reply.createdAt,
          })),
        })),
      },
    };
  }

  async createQuestion(slug: string, dto: CreateProductQuestionDto, user: AuthenticatedUser) {
    const product = await this.findPublicProduct(slug);

    const settings = await this.findInteractionSettings();

    if (!settings.productQuestionsEnabled) {
      throw new ForbiddenException('پرسش و پاسخ محصول غیرفعال است');
    }

    const question = await this.prisma.productQuestion.create({
      data: {
        productId: product.id,

        authorUserId: user.id,

        authorType: InteractionAuthorType.USER,

        authorDisplayName: this.buildUserDisplayName(user),

        body: dto.body,

        status: ContentModerationStatus.PENDING,

        source: InteractionSource.SITE,
      },

      select: {
        id: true,
        body: true,
        status: true,

        createdAt: true,
      },
    });

    return {
      data: question,

      message: 'سؤال شما ثبت شد و پس از بررسی نمایش داده می‌شود.',
    };
  }

  async createQuestionReply(
    slug: string,
    questionId: string,
    dto: CreateProductQuestionReplyDto,
    user: AuthenticatedUser,
  ) {
    const product = await this.findPublicProduct(slug);

    const settings = await this.findInteractionSettings();

    if (!settings.productQuestionsEnabled) {
      throw new ForbiddenException('پرسش و پاسخ محصول غیرفعال است');
    }

    const question = await this.prisma.productQuestion.findFirst({
      where: {
        id: questionId,

        productId: product.id,

        status: APPROVED,
      },

      select: {
        id: true,

        authorUserId: true,
      },
    });

    if (!question) {
      throw new NotFoundException('پرسش موردنظر پیدا نشد');
    }

    /*
     * در نسخه اول فقط صاحب سؤال
     * می‌تواند ادامه گفتگو بدهد.
     *
     * پاسخ عمومی سایر کاربران را
     * فعلاً باز نمی‌کنیم.
     */
    if (question.authorUserId !== user.id) {
      throw new ForbiddenException('فقط صاحب سؤال می‌تواند این گفتگو را ادامه دهد');
    }

    if (dto.parentId) {
      const parent = await this.prisma.productQuestionReply.findFirst({
        where: {
          id: dto.parentId,

          questionId: question.id,

          status: APPROVED,
        },

        select: {
          id: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('پاسخی که می‌خواهید به آن جواب دهید پیدا نشد');
      }
    }

    const reply = await this.prisma.productQuestionReply.create({
      data: {
        questionId: question.id,

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
      data: reply,

      message: 'پاسخ شما ثبت شد و پس از بررسی نمایش داده می‌شود.',
    };
  }

  private async findPublicProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,

        status: ProductStatus.ACTIVE,

        isPublished: true,

        brand: {
          isActive: true,
        },

        category: {
          isActive: true,
        },
      },

      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
      },
    });

    if (!product) {
      throw new NotFoundException('محصول پیدا نشد');
    }

    return product;
  }

  private async findInteractionSettings() {
    const settings = await this.prisma.siteSetting.findUnique({
      where: {
        id: SITE_SETTINGS_ID,
      },

      select: {
        supportDisplayName: true,
        supportAvatarUrl: true,
        supportBadgeLabel: true,

        productReviewsEnabled: true,
        productQuestionsEnabled: true,
      },
    });

    return {
      supportDisplayName: settings?.supportDisplayName ?? 'پارت‌سنج',

      supportAvatarUrl: settings?.supportAvatarUrl ?? null,

      supportBadgeLabel: settings?.supportBadgeLabel ?? 'پاسخ رسمی پارت‌سنج',

      productReviewsEnabled: settings?.productReviewsEnabled ?? true,

      productQuestionsEnabled: settings?.productQuestionsEnabled ?? true,
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

  private async hasVerifiedPurchase(productId: string, userId: string) {
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        productId,

        order: {
          customerUserId: userId,

          paymentStatus: OrderPaymentStatus.PAID,

          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.PROCESSING,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
            ],
          },
        },
      },

      select: {
        id: true,
      },
    });

    return Boolean(orderItem);
  }

  private buildReviewOrderBy(
    sort: ProductReviewSort,
  ): Prisma.ProductReviewOrderByWithRelationInput[] {
    switch (sort) {
      case ProductReviewSort.HIGHEST:
        return [
          {
            rating: 'desc',
          },
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ];

      case ProductReviewSort.LOWEST:
        return [
          {
            rating: 'asc',
          },
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ];

      case ProductReviewSort.HELPFUL:
        return [
          {
            helpfulVotes: {
              _count: 'desc',
            },
          },
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ];

      case ProductReviewSort.NEWEST:
      default:
        return [
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ];
    }
  }

  private emptyRatingBreakdown() {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,

      count: 0,

      percentage: 0,
    }));
  }

  private buildRatingBreakdown(
    grouped: Array<{
      rating: number;

      _count: {
        _all: number;
      };
    }>,
    total: number,
  ) {
    const counts = new Map(grouped.map((item) => [item.rating, item._count._all]));

    return [5, 4, 3, 2, 1].map((rating) => {
      const count = counts.get(rating) ?? 0;

      return {
        rating,

        count,

        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }
}
