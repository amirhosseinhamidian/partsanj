import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FindRelatedProductsQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 12,
    default: 8,
    example: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit = 8;
}
