import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  IsInt,
  Min,
} from 'class-validator';
import {
  normalizeNullableText,
  normalizeRequiredText,
  normalizeSlug,
  transformBoolean,
} from './blog-category.dto.utils.js';
import { IsBlogEditorDocument } from './blog-post.dto.utils.js';
import { BlogPostStatus } from '../../../../generated/prisma/client.js';

export class UpdateBlogPostDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  categoryId?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => normalizeRequiredText(value))
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @MaxLength(220)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد',
  })
  slug?: string;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(700)
  excerpt?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBlogEditorDocument()
  content?: Record<string, unknown>;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  coverImageUrl?: string | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(255)
  coverImageAlt?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  showOnHome?: boolean;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  homeSortOrder?: number;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  canonicalUrl?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  noIndex?: boolean;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(160)
  openGraphTitle?: string | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(500)
  openGraphDescription?: string | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  openGraphImageUrl?: string | null;

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(255)
  openGraphImageAlt?: string | null;
}
