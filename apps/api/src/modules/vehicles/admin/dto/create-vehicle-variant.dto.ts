import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { VehicleYearCalendar } from '../../../../generated/prisma/client.js';
import { normalizeEngineCode, normalizeSlug, trimText } from './vehicle-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateVehicleVariantDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID('4')
  modelId!: string;

  @ApiProperty({
    example: 'تیپ 5 موتور TU5',
  })
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({
    example: 'peugeot-206-type-5-tu5',
  })
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(160)
  slug!: string;

  @ApiPropertyOptional({
    example: 'TU5',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeEngineCode(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(80)
  engineCode?: string;

  @ApiPropertyOptional({
    example: 'موتور TU5',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(120)
  engineName?: string;

  @ApiPropertyOptional({
    example: 1384,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(3000)
  yearFrom?: number;

  @ApiPropertyOptional({
    example: 1391,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(3000)
  yearTo?: number;

  @ApiPropertyOptional({
    enum: VehicleYearCalendar,
    default: VehicleYearCalendar.SHAMSI,
  })
  @IsOptional()
  @IsEnum(VehicleYearCalendar)
  yearCalendar = VehicleYearCalendar.SHAMSI;

  @ApiPropertyOptional({
    example: 'بررسی سوکت و کد فنی قبل از ارسال پیشنهاد می‌شود',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder = 0;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive = true;
}
