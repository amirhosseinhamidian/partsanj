import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomerVehicleController } from './customer-vehicle.controller.js';
import { CustomerVehicleService } from './customer-vehicle.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CustomerVehicleController],
  providers: [CustomerVehicleService],
})
export class CustomerVehicleModule {}
