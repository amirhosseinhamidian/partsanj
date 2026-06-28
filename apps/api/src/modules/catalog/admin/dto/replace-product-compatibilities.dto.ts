import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { trimText } from './catalog-admin.dto.utils.js';

export class ProductVehicleCompatibilityInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'VehicleVariant UUID',
  })
  @IsUUID('4')
  vehicleVariantId!: string;

  @ApiPropertyOptional({
    example: 'قبل از ارسال، کد فنی و سوکت بررسی شود',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether this vehicle compatibility needs manual verification before shipping',
  })
  @IsOptional()
  @IsBoolean()
  requiresVerification = false;
}

export class ReplaceProductCompatibilitiesDto {
  @ApiProperty({
    type: [ProductVehicleCompatibilityInputDto],
    description:
      'Complete compatibility list. Send an empty array to remove all compatibility records.',
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique((item: ProductVehicleCompatibilityInputDto) => item.vehicleVariantId, {
    message: 'Duplicate vehicleVariantId values are not allowed',
  })
  @ValidateNested({
    each: true,
  })
  @Type(() => ProductVehicleCompatibilityInputDto)
  items!: ProductVehicleCompatibilityInputDto[];
}
