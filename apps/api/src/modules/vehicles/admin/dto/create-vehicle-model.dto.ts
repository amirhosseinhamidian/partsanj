import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { normalizeSlug, trimText } from './vehicle-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateVehicleModelDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID('4')
  makeId!: string;

  @ApiProperty({
    example: 'پژو 206',
  })
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'peugeot-206',
  })
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(120)
  slug!: string;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive = true;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showOnHome = false;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeSortOrder = 0;

  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(255)
  imageAlt?: string;

  @ApiPropertyOptional({ maxLength: 20_000 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(20_000)
  description?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(120)
  seoTitle?: string;

  @ApiPropertyOptional({ maxLength: 320 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(320)
  seoDescription?: string;

  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(2048)
  canonicalUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  noIndex = false;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(160)
  openGraphTitle?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(500)
  openGraphDescription?: string;

  @ApiPropertyOptional({ maxLength: 2048 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(2048)
  openGraphImageUrl?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @Transform(({ value }) => trimText(value), { toClassOnly: true })
  @IsString()
  @MaxLength(255)
  openGraphImageAlt?: string;
}
