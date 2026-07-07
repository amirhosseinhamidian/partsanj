import { Module } from '@nestjs/common';
import { BlogAdminCategoryController } from './blog-admin-category.controller.js';
import { BlogAdminCategoryService } from './blog-admin-category.service.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [BlogAdminCategoryController],
  providers: [BlogAdminCategoryService],
})
export class BlogModule {}
