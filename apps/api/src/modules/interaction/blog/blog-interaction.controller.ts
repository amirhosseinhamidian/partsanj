import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';

import { PublicBlogPostSlugParamDto } from '../../blog/public/dto/public-blog-post-slug-param.dto.js';

import { BlogInteractionService } from './blog-interaction.service.js';
import { BlogCommentListQueryDto } from './dto/blog-comment-list-query.dto.js';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto.js';

@ApiTags('Blog Interactions')
@Controller({
  path: 'blog/posts/:slug/comments',
  version: '1',
})
export class BlogInteractionController {
  constructor(private readonly blogInteractionService: BlogInteractionService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get approved comments for a published blog post',
  })
  @ApiOkResponse()
  findComments(
    @Param()
    params: PublicBlogPostSlugParamDto,

    @Query()
    query: BlogCommentListQueryDto,

    @CurrentUser()
    user: AuthenticatedUser | undefined,
  ) {
    return this.blogInteractionService.findComments(params.slug, query, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({
    default: {
      limit: 8,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a blog comment or reply',
  })
  createComment(
    @Param()
    params: PublicBlogPostSlugParamDto,

    @Body()
    dto: CreateBlogCommentDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.blogInteractionService.createComment(params.slug, dto, user);
  }
}
