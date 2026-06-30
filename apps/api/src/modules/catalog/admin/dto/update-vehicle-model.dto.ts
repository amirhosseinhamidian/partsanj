import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CreateVehicleModelDto } from './create-vehicle-model.dto.js';
import { normalizeNullableUrl } from './catalog-admin.dto.utils.js';

export class UpdateVehicleModelDto extends PartialType(
  OmitType(CreateVehicleModelDto, ['imageUrl'] as const),
) {
  @ApiPropertyOptional({
    nullable: true,
    example: 'https://cdn.partsanj.ir/vehicles/models/peugeot-206.webp',
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
  imageUrl?: string | null;
}
