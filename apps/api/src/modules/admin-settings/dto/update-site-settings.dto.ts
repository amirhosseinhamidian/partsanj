import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function normalizeText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
}

function normalizeNullableText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  return value;
}

function normalizeNullableNumber(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return Number(value);
}

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ example: 'پارت‌سنج', maxLength: 100 })
  @Transform(({ value }) => normalizeText(value), { toClassOnly: true })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  siteName!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 200 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  siteTagline?: string | null;

  @ApiPropertyOptional({ example: 'https://partsanj.com', maxLength: 2048 })
  @Transform(({ value }) => normalizeText(value), { toClassOnly: true })
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  siteBaseUrl!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  logoLightUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  logoDarkUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  faviconUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 50 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supportPhone?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 50 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  supportMobile?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  whatsappUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  telegramUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  baleUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  instagramUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 120 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  defaultSeoTitle?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 320 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  defaultSeoDescription?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  defaultOgImageUrl?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  noIndexSite!: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  storeEnabled!: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  orderingEnabled!: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  showPrices!: boolean;

  @ApiPropertyOptional({ nullable: true, minimum: 0 })
  @Transform(({ value }) => normalizeNullableNumber(value), { toClassOnly: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultShippingCostToman?: number | null;

  @ApiPropertyOptional({ nullable: true, minimum: 0 })
  @Transform(({ value }) => normalizeNullableNumber(value), { toClassOnly: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  freeShippingThresholdToman?: number | null;

  @ApiPropertyOptional({ minimum: 5, maximum: 1440, default: 30 })
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @IsInt()
  @Min(5)
  @Max(1440)
  orderExpirationMinutes!: number;
}
