import { Module } from '@nestjs/common';
import { BlogAdminCategoryController } from './admin/blog-admin-category.controller.js';
import { BlogAdminCategoryService } from './admin/blog-admin-category.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { BlogAdminPostService } from './admin/blog-admin-post.service.js';
import { BlogAdminPostController } from './admin/blog-admin-post.controller.js';
import { BlogPublicController } from './public/blog-public.controller.js';
import { BlogPublicService } from './public/blog-public.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BlogAdminCategoryController, BlogAdminPostController, BlogPublicController],
  providers: [BlogAdminCategoryService, BlogAdminPostService, BlogPublicService],
})
export class BlogModule {}
