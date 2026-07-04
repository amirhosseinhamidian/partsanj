import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminOrderController } from './admin-order.controller.js';
import { AdminOrderService } from './admin-order.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminOrderController],
  providers: [AdminOrderService],
})
export class AdminOrderModule {}
