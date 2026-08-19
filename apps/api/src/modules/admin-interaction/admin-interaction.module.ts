import { Module } from '@nestjs/common';
import { AdminInteractionController } from './admin-interaction.controller.js';
import { AdminInteractionService } from './admin-interaction.service.js';

@Module({
  controllers: [AdminInteractionController],
  providers: [AdminInteractionService],
  exports: [AdminInteractionService],
})
export class AdminInteractionModule {}
