import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CreateVehicleMakeDto } from './create-vehicle-make.dto.js';
import { normalizeNullableUrl } from './catalog-admin.dto.utils.js';

export class UpdateVehicleMakeDto extends PartialType(
  OmitType(CreateVehicleMakeDto, ['logoUrl'] as const),
) {
  @ApiPropertyOptional({
    nullable: true,
    example: 'https://cdn.partsanj.ir/vehicles/makes/peugeot-logo.webp',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeNullableUrl(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  logoUrl?: string | null;
}
