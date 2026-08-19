import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum ProductReviewSort {
  NEWEST = 'NEWEST',
  HIGHEST = 'HIGHEST',
  LOWEST = 'LOWEST',
  HELPFUL = 'HELPFUL',
}

export class ProductReviewListQueryDto {
  @ApiPropertyOptional({
    enum: ProductReviewSort,
    default: ProductReviewSort.NEWEST,
  })
  @IsOptional()
  @IsEnum(ProductReviewSort)
  sort?: ProductReviewSort;

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
