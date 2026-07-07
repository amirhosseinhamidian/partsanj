import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { normalizeOptionalText, normalizeSlugParam } from './public-blog.dto.utils.js';

export class PublicBlogPostListQueryDto {
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalText(value))
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeSlugParam(value))
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug دسته‌بندی باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد',
  })
  categorySlug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  limit = 12;
}
