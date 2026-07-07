import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { BlogAdminPostService } from './blog-admin-post.service.js';
import { AdminBlogPostListQueryDto } from './dto/admin-blog-post-list-query.dto.js';
import { BlogPostIdParamDto } from './dto/blog-post-id-param.dto.js';
import { CreateBlogPostDto } from './dto/create-blog-post.dto.js';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/blog/posts',
  version: '1',
})
export class BlogAdminPostController {
  constructor(private readonly blogAdminPostService: BlogAdminPostService) {}

  @Get()
  findPosts(@Query() query: AdminBlogPostListQueryDto) {
    return this.blogAdminPostService.findPosts(query);
  }

  @Get(':blogPostId')
  findPost(@Param() params: BlogPostIdParamDto) {
    return this.blogAdminPostService.findPost(params.blogPostId);
  }

  @Post()
  createPost(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateBlogPostDto) {
    return this.blogAdminPostService.createPost(actor, dto);
  }

  @Patch(':blogPostId')
  updatePost(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: BlogPostIdParamDto,
    @Body() dto: UpdateBlogPostDto,
  ) {
    return this.blogAdminPostService.updatePost(actor, params.blogPostId, dto);
  }
}
