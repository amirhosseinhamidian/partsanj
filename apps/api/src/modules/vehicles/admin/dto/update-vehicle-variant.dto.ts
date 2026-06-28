import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { VehicleYearCalendar } from '../../../../generated/prisma/client.js';
import { normalizeEngineCode, normalizeSlug, trimText } from './vehicle-admin.dto.utils.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpdateVehicleVariantDto {
  @ApiPropertyOptional({
    example: 'تیپ 5 موتور TU5',
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({
    example: 'peugeot-206-type-5-tu5',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeSlug(value), {
    toClassOnly: true,
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  @MaxLength(160)
  slug?: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => normalizeEngineCode(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(80)
  engineCode?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(120)
  engineName?: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(3000)
  yearFrom?: number | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1000)
  @Max(3000)
  yearTo?: number | null;

  @ApiPropertyOptional({
    enum: VehicleYearCalendar,
  })
  @IsOptional()
  @IsEnum(VehicleYearCalendar)
  yearCalendar?: VehicleYearCalendar;

  @ApiPropertyOptional({
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }) => trimText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
