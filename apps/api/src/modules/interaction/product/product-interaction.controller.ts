import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { ProductSlugParamDto } from '../../catalog/dto/product-slug-param.dto.js';
import { CreateProductQuestionDto } from './dto/create-product-question.dto.js';
import { CreateProductQuestionReplyDto } from './dto/create-product-question-reply.dto.js';
import { ProductReviewListQueryDto } from './dto/product-review-list-query.dto.js';
import { UpsertProductReviewDto } from './dto/upsert-product-review.dto.js';
import { ProductInteractionService } from './product-interaction.service.js';

@ApiTags('Product Interactions')
@Controller({
  path: 'catalog/products/:slug',
  version: '1',
})
export class ProductInteractionController {
  constructor(private readonly productInteractionService: ProductInteractionService) {}

  @Get('reviews')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get approved reviews and rating summary for a product',
  })
  @ApiOkResponse()
  findReviews(
    @Param() params: ProductSlugParamDto,
    @Query() query: ProductReviewListQueryDto,
    @CurrentUser()
    user: AuthenticatedUser | undefined,
  ) {
    return this.productInteractionService.findReviews(params.slug, query, user);
  }

  @Put('review')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create or update the authenticated user review',
  })
  @ApiOkResponse()
  upsertReview(
    @Param() params: ProductSlugParamDto,
    @Body() dto: UpsertProductReviewDto,
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.productInteractionService.upsertReview(params.slug, dto, user);
  }

  @Post('reviews/:reviewId/helpful')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({
    default: {
      limit: 30,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth('access-token')
  markReviewHelpful(
    @Param() params: ProductSlugParamDto,
    @Param(
      'reviewId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    reviewId: string,
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.productInteractionService.markReviewHelpful(params.slug, reviewId, user.id);
  }

  @Delete('reviews/:reviewId/helpful')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({
    default: {
      limit: 30,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth('access-token')
  removeReviewHelpful(
    @Param() params: ProductSlugParamDto,
    @Param(
      'reviewId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    reviewId: string,
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.productInteractionService.removeReviewHelpful(params.slug, reviewId, user.id);
  }

  @Get('questions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get approved questions and answers for a product',
  })
  @ApiOkResponse()
  findQuestions(
    @Param() params: ProductSlugParamDto,
    @CurrentUser()
    user: AuthenticatedUser | undefined,
  ) {
    return this.productInteractionService.findQuestions(params.slug, user);
  }

  @Post('questions')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth('access-token')
  createQuestion(
    @Param() params: ProductSlugParamDto,
    @Body() dto: CreateProductQuestionDto,
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.productInteractionService.createQuestion(params.slug, dto, user);
  }

  @Post('questions/:questionId/replies')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth('access-token')
  createQuestionReply(
    @Param() params: ProductSlugParamDto,
    @Param(
      'questionId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    questionId: string,
    @Body()
    dto: CreateProductQuestionReplyDto,
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.productInteractionService.createQuestionReply(params.slug, questionId, dto, user);
  }
}
