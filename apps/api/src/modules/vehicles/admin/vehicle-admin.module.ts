import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { VehicleAdminController } from './vehicle-admin.controller.js';
import { VehicleAdminService } from './vehicle-admin.service.js';

@Module({
  imports: [AuthModule],
  controllers: [VehicleAdminController],
  providers: [VehicleAdminService],
})
export class VehicleAdminModule {}
