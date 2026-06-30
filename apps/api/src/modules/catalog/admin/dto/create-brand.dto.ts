import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { normalizeSlug, trimText } from './catalog-admin.dto.utils.js';

import { normalizeOptionalUrl } from './catalog-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateBrandDto {
  @ApiProperty({
    example: 'Bosch',
  })
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'bosch',
  })
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(120)
  slug!: string;

  @ApiPropertyOptional({
    default: true,
  })
  @IsBoolean()
  isActive = true;

  @ApiPropertyOptional({
    example: 'https://cdn.partsanj.ir/brands/bosch-logo.webp',
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
  logoUrl?: string;
}
