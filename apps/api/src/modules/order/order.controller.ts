import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto.js';
import { OrderIdParamDto } from './dto/order-id-param.dto.js';
import { OrderService } from './order.service.js';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'orders',
  version: '1',
})
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('from-cart')
  @HttpCode(HttpStatus.CREATED)
  async createFromCart(
    @Body() dto: CreateOrderFromCartDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      data: await this.orderService.createFromCart(user.id, dto),
    };
  }

  @Get(':orderId')
  async findOne(@Param() params: OrderIdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.orderService.findOneForCustomer(user.id, params.orderId),
    };
  }
}
