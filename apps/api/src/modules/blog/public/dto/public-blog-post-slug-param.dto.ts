import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';
import { normalizeSlugParam } from './public-blog.dto.utils.js';

export class PublicBlogPostSlugParamDto {
  @Transform(({ value }) => normalizeSlugParam(value))
  @IsString()
  @MaxLength(220)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug مقاله معتبر نیست',
  })
  slug: string;
}
