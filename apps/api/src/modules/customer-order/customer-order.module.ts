import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomerOrderController } from './customer-order.controller.js';
import { CustomerOrderService } from './customer-order.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CustomerOrderController],
  providers: [CustomerOrderService],
})
export class CustomerOrderModule {}
