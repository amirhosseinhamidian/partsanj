import { IsUUID } from 'class-validator';

export class CustomerAddressIdParamDto {
  @IsUUID('4')
  addressId!: string;
}
