import { Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { PaymentOrderIdParamDto } from './dto/payment-order-id-param.dto.js';
import { PaymentService } from './payment.service.js';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'payments',
  version: '1',
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders/:orderId/start')
  @HttpCode(HttpStatus.OK)
  async startPayment(
    @Param() params: PaymentOrderIdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      data: await this.paymentService.startPayment(user.id, params.orderId),
    };
  }
}
