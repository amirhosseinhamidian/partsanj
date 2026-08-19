import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

function normalizeNullableText(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  return value;
}

export class UpsertProductReviewDto {
  @ApiProperty({
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: 3000,
    example: 'کیفیت قطعه خوب بود و بدون مشکل نصب شد.',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeNullableText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(3000)
  body?: string | null;
}
