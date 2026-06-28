import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCodeType } from '../../../../generated/prisma/client.js';
import { normalizeProductCode, normalizeUrl, trimText } from './catalog-admin.dto.utils.js';

export class ProductCodeInputDto {
  @ApiProperty({
    enum: ProductCodeType,
    example: ProductCodeType.OEM,
  })
  @IsEnum(ProductCodeType)
  type!: ProductCodeType;

  @ApiProperty({
    example: '0258006028',
  })
  @Transform(({ value }) => normalizeProductCode(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(/\S/)
  @MaxLength(120)
  value!: string;
}

export class ProductImageInputDto {
  @ApiProperty({
    example: 'https://cdn.example.com/products/o2-sensor.jpg',
  })
  @Transform(({ value }) => normalizeUrl(value), {
    toClassOnly: true,
  })
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  @MaxLength(2048)
  url!: string;

  @ApiPropertyOptional({
    example: 'سنسور اکسیژن بوش',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(250)
  alt?: string;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;
}
