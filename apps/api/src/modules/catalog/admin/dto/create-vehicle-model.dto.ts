import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { normalizeOptionalUrl, trimText } from './catalog-admin.dto.utils.js';

export class CreateVehicleModelDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Vehicle make UUID',
  })
  @IsUUID('4')
  makeId!: string;

  @ApiProperty({
    example: '206',
  })
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'peugeot-206',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value), {
    toClassOnly: true,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must contain lowercase English letters, numbers, and hyphens only',
  })
  slug!: string;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.partsanj.ir/vehicles/models/peugeot-206.webp',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalUrl(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  imageUrl?: string;
}
