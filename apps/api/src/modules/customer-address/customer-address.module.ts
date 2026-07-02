import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CustomerAddressController } from './customer-address.controller.js';
import { CustomerAddressService } from './customer-address.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CustomerAddressController],
  providers: [CustomerAddressService],
  exports: [CustomerAddressService],
})
export class CustomerAddressModule {}
