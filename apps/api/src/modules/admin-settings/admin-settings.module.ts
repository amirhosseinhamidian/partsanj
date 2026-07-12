import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminSettingsController } from './admin-settings.controller.js';
import { AdminSettingsService } from './admin-settings.service.js';
import { PublicSettingsController } from './public-settings.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminSettingsController, PublicSettingsController],
  providers: [AdminSettingsService],
})
export class AdminSettingsModule {}
