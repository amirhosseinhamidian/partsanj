import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCustomerAddressDto } from './create-customer-address.dto.js';

export class UpdateCustomerAddressDto extends PartialType(
  OmitType(CreateCustomerAddressDto, ['isDefault'] as const),
) {}
