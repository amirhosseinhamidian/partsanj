import { Module } from '@nestjs/common';

import { AdminInteractionController } from './admin-interaction.controller.js';
import { AdminInteractionService } from './admin-interaction.service.js';

import { AdminInteractionImportController } from './import/admin-interaction-import.controller.js';
import { AdminInteractionImportService } from './import/admin-interaction-import.service.js';

import { AdminContentReportController } from './report/admin-content-report.controller.js';
import { AdminContentReportService } from './report/admin-content-report.service.js';

@Module({
  controllers: [
    AdminInteractionController,
    AdminInteractionImportController,
    AdminContentReportController,
  ],

  providers: [AdminInteractionService, AdminInteractionImportService, AdminContentReportService],

  exports: [AdminInteractionService, AdminInteractionImportService, AdminContentReportService],
})
export class AdminInteractionModule {}
