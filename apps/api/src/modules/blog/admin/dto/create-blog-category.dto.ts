import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  normalizeNullableText,
  normalizeRequiredText,
  normalizeSlug,
  transformBoolean,
} from './blog-category.dto.utils.js';

export class CreateBlogCategoryDto {
  @Transform(({ value }) => normalizeRequiredText(value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد',
  })
  slug: string;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(700)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  canonicalUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  noIndex?: boolean;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(160)
  openGraphTitle?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(500)
  openGraphDescription?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  openGraphImageUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(255)
  openGraphImageAlt?: string | null;
}
