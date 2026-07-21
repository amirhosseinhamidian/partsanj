import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { CatalogAdminController } from './catalog-admin.controller.js';
import { CatalogAdminService } from './catalog-admin.service.js';
import { CatalogReferenceCsvImportService } from './import/catalog-reference-csv-import.service.js';
import { CatalogCsvImportController } from './import/catalog-csv-import.controller.js';
import { CatalogCsvImportService } from './import/catalog-csv-import.service.js';
import { VehicleCsvImportController } from './vehicle-import/vehicle-csv-import.controller.js';
import { VehicleCsvImportService } from './vehicle-import/vehicle-csv-import.service.js';

@Module({
  imports: [AuthModule],
  controllers: [
    CatalogAdminController,
    CatalogCsvImportController,
    VehicleCsvImportController,
  ],
  providers: [
    CatalogAdminService,
    CatalogCsvImportService,
    CatalogReferenceCsvImportService,
    VehicleCsvImportService,
  ],
})
export class CatalogAdminModule {}
