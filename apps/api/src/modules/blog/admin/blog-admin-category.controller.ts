import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { BlogAdminCategoryService } from './blog-admin-category.service.js';
import { AdminBlogCategoryListQueryDto } from './dto/admin-blog-category-list-query.dto.js';
import { BlogCategoryIdParamDto } from './dto/blog-category-id-param.dto.js';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto.js';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/blog/categories',
  version: '1',
})
export class BlogAdminCategoryController {
  constructor(private readonly blogAdminCategoryService: BlogAdminCategoryService) {}

  @Get()
  findCategories(@Query() query: AdminBlogCategoryListQueryDto) {
    return this.blogAdminCategoryService.findCategories(query);
  }

  @Get(':blogCategoryId')
  findCategory(@Param() params: BlogCategoryIdParamDto) {
    return this.blogAdminCategoryService.findCategory(params.blogCategoryId);
  }

  @Post()
  createCategory(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CreateBlogCategoryDto) {
    return this.blogAdminCategoryService.createCategory(actor, dto);
  }

  @Patch(':blogCategoryId')
  updateCategory(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: BlogCategoryIdParamDto,
    @Body() dto: UpdateBlogCategoryDto,
  ) {
    return this.blogAdminCategoryService.updateCategory(actor, params.blogCategoryId, dto);
  }
}
