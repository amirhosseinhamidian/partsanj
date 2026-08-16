import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FindComplementaryProductsQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 12,
    default: 6,
    example: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit = 6;
}
