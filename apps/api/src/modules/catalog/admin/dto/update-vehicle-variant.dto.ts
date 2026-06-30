import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { CreateVehicleVariantDto } from './create-vehicle-variant.dto.js';

function toNullableTrimmedText(value: unknown): string | null | unknown {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

function toNullableInteger(value: unknown): number | null | unknown {
  if (value === null || value === '') {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return Number(value);
}

export class UpdateVehicleVariantDto extends PartialType(
  OmitType(CreateVehicleVariantDto, [
    'engineCode',
    'engineName',
    'notes',
    'yearFrom',
    'yearTo',
  ] as const),
) {
  @ApiPropertyOptional({
    nullable: true,
    example: 'TU5',
  })
  @Transform(({ value }) => toNullableTrimmedText(value), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  engineCode?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'TU5JP4',
  })
  @Transform(({ value }) => toNullableTrimmedText(value), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  engineName?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 1380,
  })
  @Transform(({ value }) => toNullableInteger(value), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  yearFrom?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 1391,
  })
  @Transform(({ value }) => toNullableInteger(value), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  yearTo?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'نیازمند تطبیق رنگ بدنه سنسور با قطعه روی خودرو',
  })
  @Transform(({ value }) => toNullableTrimmedText(value), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
