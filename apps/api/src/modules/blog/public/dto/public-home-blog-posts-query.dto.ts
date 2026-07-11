import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PublicHomeBlogPostsQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return 3;
    }

    return Number(value);
  })
  @IsInt()
  @Min(1)
  @Max(12)
  limit = 3;
}
