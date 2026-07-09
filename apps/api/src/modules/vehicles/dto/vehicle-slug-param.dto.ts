import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().toLowerCase();
}

export class VehicleSlugParamDto {
  @ApiProperty({
    example: 'iran-khodro',
  })
  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @MaxLength(180)
  @Matches(SLUG_PATTERN)
  slug!: string;
}
