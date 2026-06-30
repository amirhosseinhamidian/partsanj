import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, [
    'priceToman',
    'salePriceToman',
    'saleStartsAt',
    'saleEndsAt',
  ] as const),
) {
  @ApiPropertyOptional({
    nullable: true,
    example: 1500000,
  })
  @Transform(({ value }) => (value === null ? null : Number(value)), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  priceToman?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 1250000,
  })
  @Transform(({ value }) => (value === null ? null : Number(value)), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  salePriceToman?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  saleStartsAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  saleEndsAt?: string | null;
}
