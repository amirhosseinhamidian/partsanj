import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { normalizeOptionalUrl, normalizeSlug, trimText } from './catalog-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCategoryDto {
  @ApiProperty({
    example: 'قطعات برقی خودرو',
  })
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'electrical-parts',
  })
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(120)
  slug!: string;

  @ApiPropertyOptional({
    example: 'https://cdn.partsanj.ir/categories/car-socket.webp',
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

  @ApiPropertyOptional({
    example: 'سوکت برق خودرو',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(255)
  imageAlt?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this category should be displayed on the storefront home page',
  })
  @IsOptional()
  @IsBoolean()
  showOnHome?: boolean;

  @ApiPropertyOptional({
    description: 'Optional parent category UUID',
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;

  @ApiPropertyOptional({
    default: true,
  })
  @IsBoolean()
  isActive = true;
}
