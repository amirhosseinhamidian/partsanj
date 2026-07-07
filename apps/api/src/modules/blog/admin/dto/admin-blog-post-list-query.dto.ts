import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { BlogPostStatus } from '../../../../generated/prisma/client.js';
import { normalizeNullableText } from './blog-category.dto.utils.js';

export class AdminBlogPostListQueryDto {
  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value))
  @IsString()
  @MaxLength(200)
  q?: string | null;

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

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
