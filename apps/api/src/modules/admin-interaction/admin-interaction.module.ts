import { Module } from '@nestjs/common';
import { AdminInteractionController } from './admin-interaction.controller.js';
import { AdminInteractionService } from './admin-interaction.service.js';
import { AdminInteractionImportController } from './import/admin-interaction-import.controller.js';
import { AdminInteractionImportService } from './import/admin-interaction-import.service.js';

@Module({
  controllers: [AdminInteractionController, AdminInteractionImportController],

  providers: [AdminInteractionService, AdminInteractionImportService],

  exports: [AdminInteractionService, AdminInteractionImportService],
})
export class AdminInteractionModule {}
