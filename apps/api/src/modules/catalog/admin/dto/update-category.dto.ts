import { ApiPropertyOptional } from '@nestjs/swagger';
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

import { normalizeNullableUrl, normalizeSlug, trimText } from './catalog-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'قطعات برقی خودرو',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'electrical-parts',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://cdn.partsanj.ir/categories/car-socket.webp',
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

  @ApiPropertyOptional({
    nullable: true,
    example: 'سوکت برق خودرو',
  })
  @IsOptional()
  @Transform(
    ({ value }) => {
      if (value === null) {
        return null;
      }

      if (typeof value !== 'string') {
        return value;
      }

      const normalizedValue = value.trim();

      return normalizedValue || null;
    },
    {
      toClassOnly: true,
    },
  )
  @IsString()
  @MaxLength(255)
  imageAlt?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this category should be displayed on the storefront home page',
  })
  @IsOptional()
  @IsBoolean()
  showOnHome?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Use null to remove the parent category',
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;

  @ApiPropertyOptional({
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
