import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { normalizeSlug, trimText } from './vehicle-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpdateVehicleModelDto {
  @ApiPropertyOptional({
    example: 'پژو 206',
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
    example: 'peugeot-206',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showOnHome?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeSortOrder?: number;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(2048)
  imageUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 255 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(255)
  imageAlt?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 20_000 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(20_000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 120 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 320 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(2048)
  canonicalUrl?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(160)
  openGraphTitle?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 500 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(500)
  openGraphDescription?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(2048)
  openGraphImageUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 255 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(255)
  openGraphImageAlt?: string | null;
}
