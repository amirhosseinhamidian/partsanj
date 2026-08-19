/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ContentModerationStatus } from '../../../generated/prisma/client.js';
import { AdminInteractionType } from '../admin-interaction-type.enum.js';

export class AdminInteractionListQueryDto {
  @ApiPropertyOptional({
    enum: AdminInteractionType,
  })
  @IsOptional()
  @IsEnum(AdminInteractionType)
  type?: AdminInteractionType;

  @ApiPropertyOptional({
    enum: ContentModerationStatus,
  })
  @IsOptional()
  @IsEnum(ContentModerationStatus)
  status?: ContentModerationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  })
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  blogPostId?: string;

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
    maximum: 100,
    default: 25,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
