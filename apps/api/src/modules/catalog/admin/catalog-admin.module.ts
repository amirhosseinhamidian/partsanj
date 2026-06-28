import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { CatalogAdminController } from './catalog-admin.controller.js';
import { CatalogAdminService } from './catalog-admin.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CatalogAdminController],
  providers: [CatalogAdminService],
})
export class CatalogAdminModule {}
