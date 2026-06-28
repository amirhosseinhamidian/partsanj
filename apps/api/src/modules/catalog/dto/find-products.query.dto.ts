import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../../../generated/prisma/client.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}

export class FindProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Search by product name, SKU, slug, technical code, or OEM code',
    example: 'سنسور اکسیژن',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeOptionalText(value))
  q?: string;

  @ApiPropertyOptional({
    description: 'Exact brand slug',
    example: 'bosch',
  })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN)
  @Transform(({ value }) => normalizeOptionalText(value))
  brand?: string;

  @ApiPropertyOptional({
    description: 'Exact category slug',
    example: 'oxygen-sensors',
  })
  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN)
  @Transform(({ value }) => normalizeOptionalText(value))
  category?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Only return products compatible with this vehicle variant',
  })
  @IsOptional()
  @IsUUID('4')
  vehicleVariantId?: string;

  @ApiPropertyOptional({
    enum: StockStatus,
    example: StockStatus.IN_STOCK,
  })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 24,
    example: 24,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 24;
}
