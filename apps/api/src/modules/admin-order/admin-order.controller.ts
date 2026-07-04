import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { AdminOrderService } from './admin-order.service.js';
import { CancelAdminOrderDto } from './dto/cancel-admin-order.dto.js';
import { FindAdminOrdersQueryDto } from './dto/find-admin-orders.query.dto.js';
import { MarkOrderShippedDto } from './dto/mark-order-shipped.dto.js';
import { OrderIdParamDto } from './dto/order-id-param.dto.js';

@ApiTags('Admin Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/orders',
  version: '1',
})
export class AdminOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  @Get()
  @ApiOperation({
    summary: 'List orders for administrators',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  findOrders(@Query() query: FindAdminOrdersQueryDto) {
    return this.adminOrderService.findOrders(query);
  }

  @Get(':orderId')
  @ApiOperation({
    summary: 'Get order details, payment attempts and audit history',
  })
  @ApiOkResponse()
  findOrderById(@Param() params: OrderIdParamDto) {
    return this.adminOrderService.findOrderById(params.orderId);
  }

  @Post(':orderId/processing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Move a paid order to processing status',
  })
  @ApiOkResponse()
  @ApiConflictResponse()
  markProcessing(@Param() params: OrderIdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.adminOrderService.markProcessing(params.orderId, user.id);
  }

  @Post(':orderId/shipment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register shipment carrier and tracking code',
  })
  @ApiOkResponse()
  @ApiConflictResponse()
  markShipped(
    @Param() params: OrderIdParamDto,
    @Body() dto: MarkOrderShippedDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminOrderService.markShipped(params.orderId, dto, user.id);
  }

  @Post(':orderId/delivered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a shipped order as delivered',
  })
  @ApiOkResponse()
  @ApiConflictResponse()
  markDelivered(@Param() params: OrderIdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.adminOrderService.markDelivered(params.orderId, user.id);
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel an unpaid or failed-payment order',
  })
  @ApiOkResponse()
  @ApiConflictResponse()
  cancelOrder(
    @Param() params: OrderIdParamDto,
    @Body() dto: CancelAdminOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminOrderService.cancelOrder(params.orderId, dto, user.id);
  }
}
