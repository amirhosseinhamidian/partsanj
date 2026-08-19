import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import {
  ContentReportStatus,
  ContentReportTargetType,
} from '../../../../generated/prisma/client.js';

export class AdminContentReportListQueryDto {
  @ApiPropertyOptional({
    enum: ContentReportStatus,
  })
  @IsOptional()
  @IsEnum(ContentReportStatus)
  status?: ContentReportStatus;

  @ApiPropertyOptional({
    enum: ContentReportTargetType,
  })
  @IsOptional()
  @IsEnum(ContentReportTargetType)
  targetType?: ContentReportTargetType;

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
