import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { BlogPostStatus } from '../../../../generated/prisma/client.js';
import {
  normalizeNullableText,
  normalizeRequiredText,
  normalizeSlug,
  transformBoolean,
} from './blog-category.dto.utils.js';
import { IsBlogEditorDocument } from './blog-post.dto.utils.js';

export class CreateBlogPostDto {
  @IsUUID('4')
  categoryId: string;

  @Transform(({ value }) => normalizeRequiredText(value))
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @MaxLength(220)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد',
  })
  slug: string;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(700)
  excerpt?: string | null;

  @IsBlogEditorDocument()
  content: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  coverImageUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(255)
  coverImageAlt?: string | null;

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  showOnHome?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsInt()
  @Min(0)
  homeSortOrder?: number;

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
