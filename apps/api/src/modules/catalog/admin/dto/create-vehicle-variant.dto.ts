import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleYearCalendar } from '../../../../generated/prisma/client.js';
import { normalizeSlug, trimText } from './catalog-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateVehicleVariantDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Vehicle model UUID',
  })
  @IsUUID('4')
  modelId!: string;

  @ApiProperty({
    example: 'تیپ 5 TU5',
  })
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(/\S/)
  @MaxLength(160)
  name!: string;

  @ApiProperty({
    example: 'peugeot-206-type-5-tu5',
  })
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'slug must contain lowercase English letters, numbers, and hyphens only',
  })
  @MaxLength(180)
  slug!: string;

  @ApiPropertyOptional({
    example: 'TU5',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(100)
  engineCode?: string;

  @ApiPropertyOptional({
    example: 'TU5JP4',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(160)
  engineName?: string;

  @ApiPropertyOptional({
    example: 1380,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  yearFrom?: number;

  @ApiPropertyOptional({
    example: 1391,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  yearTo?: number;

  @ApiPropertyOptional({
    enum: VehicleYearCalendar,
    default: VehicleYearCalendar.SHAMSI,
  })
  @IsOptional()
  @IsEnum(VehicleYearCalendar)
  yearCalendar?: VehicleYearCalendar;

  @ApiPropertyOptional({
    example: 'برای سنسور دور موتور، رنگ بدنه و نوع سوکت باید قبل از ارسال تطبیق داده شود',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
