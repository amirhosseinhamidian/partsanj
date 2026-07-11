import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
  IsDateString,
  ValidateIf,
  IsUrl,
} from 'class-validator';
import { ProductStatus, StockStatus } from '../../../../generated/prisma/client.js';
import { normalizeProductCode, normalizeSlug, trimText } from './catalog-admin.dto.utils.js';
import { ProductCodeInputDto, ProductImageInputDto } from './product-input.dto.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeNullableText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return trimText(value);
}
export class CreateProductDto {
  @ApiProperty({
    example: 'BOSCH-O2-0258006028',
  })
  @Transform(({ value }) => normalizeProductCode(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(/\S/)
  @MaxLength(120)
  sku!: string;

  @ApiProperty({
    example: 'bosch-oxygen-sensor-0258006028',
  })
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(180)
  slug!: string;

  @ApiProperty({
    example: 'سنسور اکسیژن بوش کد 0258006028',
  })
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  name!: string;

  @ApiPropertyOptional({
    example: 'مناسب خودروهای منتخب با سوکت چهار پین',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiPropertyOptional({
    example: 'توضیحات کامل محصول و مشخصات فنی آن',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional({
    example: {
      connectorPins: 4,
      voltage: '12V',
      countryOfOrigin: 'Germany',
    },
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 1250000,
    description: 'Price in toman',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceToman?: number;

  @ApiPropertyOptional({
    example: 1090000,
    description: 'Optional discounted price in toman',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  salePriceToman?: number;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  saleStartsAt?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    example: '2026-07-10T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  saleEndsAt?: string;

  @ApiPropertyOptional({
    enum: StockStatus,
    default: StockStatus.CHECK_AVAILABILITY,
  })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiPropertyOptional({
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isTorobEnabled?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether this product should be displayed on the storefront home page',
  })
  @IsOptional()
  @IsBoolean()
  showOnHome?: boolean;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
    description: 'Display order for featured products on the storefront home page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeSortOrder?: number;

  @ApiPropertyOptional({
    example: 'خرید سنسور اکسیژن بوش کد 0258006028',
    maxLength: 120,
  })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @ApiPropertyOptional({
    example: 'خرید سنسور اکسیژن بوش اصل با بررسی سازگاری خودرو، قیمت شفاف و ارسال سریع.',
    maxLength: 320,
  })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @ApiPropertyOptional({
    example: 'https://partsanj.com/products/bosch-oxygen-sensor-0258006028',
    maxLength: 2048,
  })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  canonicalUrl?: string | null;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  noIndex?: boolean;

  @ApiPropertyOptional({
    example: 'خرید سنسور اکسیژن بوش اصل',
    maxLength: 160,
  })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(160)
  openGraphTitle?: string | null;

  @ApiPropertyOptional({
    example: 'سنسور اکسیژن بوش مناسب خودروهای منتخب با امکان بررسی سازگاری.',
    maxLength: 500,
  })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(500)
  openGraphDescription?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.partsanj.com/products/bosch-o2.jpg',
    maxLength: 2048,
  })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  openGraphImageUrl?: string | null;

  @ApiPropertyOptional({
    example: 'تصویر سنسور اکسیژن بوش',
    maxLength: 255,
  })
  @Transform(({ value }) => normalizeNullableText(value), { toClassOnly: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(255)
  openGraphImageAlt?: string | null;

  @ApiProperty({
    format: 'uuid',
    description: 'Brand UUID',
  })
  @IsUUID('4')
  brandId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Category UUID',
  })
  @IsUUID('4')
  categoryId!: string;

  @ApiPropertyOptional({
    type: [ProductCodeInputDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ProductCodeInputDto)
  codes?: ProductCodeInputDto[];

  @ApiPropertyOptional({
    type: [ProductImageInputDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images?: ProductImageInputDto[];
}
