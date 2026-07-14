import { Global, Module } from '@nestjs/common';

import { KavenegarTransactionalSmsService } from './kavenegar-transactional-sms.service.js';
import { OrderSmsDispatcherService } from './order-sms-dispatcher.service.js';
import { OrderSmsOutboxService } from './order-sms-outbox.service.js';

@Global()
@Module({
  providers: [
    KavenegarTransactionalSmsService,
    OrderSmsOutboxService,
    OrderSmsDispatcherService,
  ],
  exports: [OrderSmsOutboxService],
})
export class OrderSmsModule {}
