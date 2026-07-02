import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  recipientFirstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  recipientLastName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  recipientMobile!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  province!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  addressLine!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(32)
  postalCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  plaque?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  floor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryNotes?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
