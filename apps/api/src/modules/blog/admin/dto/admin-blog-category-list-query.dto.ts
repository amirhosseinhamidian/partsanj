import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { normalizeNullableText, transformBoolean } from './blog-category.dto.utils.js';

export class AdminBlogCategoryListQueryDto {
  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(100)
  q?: string | null;

  @IsOptional()
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
