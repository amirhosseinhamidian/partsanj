import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';
import { normalizeSlugParam } from './public-blog.dto.utils.js';

export class PublicBlogCategorySlugParamDto {
  @Transform(({ value }) => normalizeSlugParam(value))
  @IsString()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug دسته‌بندی معتبر نیست',
  })
  slug: string;
}
