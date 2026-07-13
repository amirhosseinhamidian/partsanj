import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { OrderController } from './order.controller.js';
import { OrderExpirationService } from './order-expiration.service.js';
import { OrderService } from './order.service.js';

@Module({
  imports: [AuthModule],
  controllers: [OrderController],
  providers: [OrderService, OrderExpirationService],
  exports: [OrderService],
})
export class OrderModule {}
