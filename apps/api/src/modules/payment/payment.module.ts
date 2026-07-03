import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { PaymentProviderRegistry } from './providers/payment-provider.registry.js';
import { ZarinpalPaymentProvider } from './providers/zarinpal-payment.provider.js';
import { PaymentCallbackController } from './payment-callback.controller.js';
import { PaymentCallbackService } from './payment-callback.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PaymentController, PaymentCallbackController],
  providers: [
    PaymentService,
    PaymentCallbackService,
    PaymentProviderRegistry,
    ZarinpalPaymentProvider,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
