import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { CustomerOrderService } from './customer-order.service.js';
import { FindCustomerOrdersQueryDto } from './dto/find-customer-orders.query.dto.js';
import { CustomerOrderIdParamDto } from './dto/order-id-param.dto.js';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'customer/orders',
  version: '1',
})
export class CustomerOrderController {
  constructor(private readonly customerOrderService: CustomerOrderService) {}

  @Get()
  findOrders(@Req() request: AuthenticatedRequest, @Query() query: FindCustomerOrdersQueryDto) {
    return this.customerOrderService.findOrders(request.user.id, query);
  }

  @Get(':orderId')
  findOrderById(@Req() request: AuthenticatedRequest, @Param() params: CustomerOrderIdParamDto) {
    return this.customerOrderService.findOrderById(request.user.id, params.orderId);
  }
}
