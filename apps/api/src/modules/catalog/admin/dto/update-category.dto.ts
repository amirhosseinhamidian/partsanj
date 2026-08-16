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
  ValidateIf,
} from 'class-validator';

import {
  normalizeNullableText,
  normalizeNullableUrl,
  normalizeSlug,
  trimText,
} from './catalog-admin.dto.utils.js';

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

  /*
   * Page content
   */
  @ApiPropertyOptional({
    nullable: true,
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
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(255)
  imageAlt?: string | null;

  /*
   * SEO
   */
  @ApiPropertyOptional({
    nullable: true,
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
    nullable: true,
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
    nullable: true,
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
  })
  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  /*
   * Open Graph
   */
  @ApiPropertyOptional({
    nullable: true,
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
    nullable: true,
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
    nullable: true,
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
    nullable: true,
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
