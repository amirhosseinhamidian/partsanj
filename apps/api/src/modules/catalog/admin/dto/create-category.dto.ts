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
  ValidateIf,
} from 'class-validator';

import {
  normalizeNullableText,
  normalizeOptionalUrl,
  normalizeSlug,
  trimText,
} from './catalog-admin.dto.utils.js';

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

  /*
   * Page content
   */
  @ApiPropertyOptional({
    example: 'انواع قطعات برقی خودرو شامل سنسورها، وایر شمع، رگولاتور دینام و سایر قطعات مرتبط.',
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  /*
   * Category image
   */
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

  /*
   * SEO
   */
  @ApiPropertyOptional({
    example: 'خرید قطعات برقی خودرو | پارت‌سنج',
    maxLength: 120,
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @ApiPropertyOptional({
    example: 'خرید انواع قطعات برقی خودرو با امکان بررسی مشخصات، سازگاری با خودرو و مشاهده قیمت.',
    maxLength: 320,
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @ApiPropertyOptional({
    example: 'https://partsanj.ir/categories/electrical-parts',
    maxLength: 2048,
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  canonicalUrl?: string | null;

  @ApiPropertyOptional({
    default: false,
    description: 'Prevent this category landing page from being indexed by search engines',
  })
  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  /*
   * Open Graph
   */
  @ApiPropertyOptional({
    example: 'خرید قطعات برقی خودرو',
    maxLength: 160,
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(160)
  openGraphTitle?: string | null;

  @ApiPropertyOptional({
    example: 'مشاهده و خرید انواع قطعات برقی خودرو در پارت‌سنج.',
    maxLength: 500,
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(500)
  openGraphDescription?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.partsanj.ir/categories/electrical-parts-og.webp',
    maxLength: 2048,
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  openGraphImageUrl?: string | null;

  @ApiPropertyOptional({
    example: 'انواع قطعات برقی خودرو در پارت‌سنج',
    maxLength: 255,
  })
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(255)
  openGraphImageAlt?: string | null;

  /*
   * Storefront options
   */
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
