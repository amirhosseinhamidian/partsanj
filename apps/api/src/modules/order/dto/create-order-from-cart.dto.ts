import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrderFromCartDto {
  @IsUUID('4')
  shippingAddressId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNote?: string | null;
}
