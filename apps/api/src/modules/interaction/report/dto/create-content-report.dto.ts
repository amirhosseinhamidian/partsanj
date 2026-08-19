/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Transform } from 'class-transformer';

import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { ContentReportTargetType } from '../../../../generated/prisma/client.js';

export const CONTENT_REPORT_REASONS = [
  'SPAM',
  'ABUSE',
  'MISLEADING',
  'PERSONAL_INFO',
  'OTHER',
] as const;

export class CreateContentReportDto {
  @ApiProperty({
    enum: ContentReportTargetType,
  })
  @IsEnum(ContentReportTargetType)
  targetType!: ContentReportTargetType;

  @ApiProperty()
  @IsUUID('4')
  targetId!: string;

  @ApiProperty({
    enum: CONTENT_REPORT_REASONS,
  })
  @IsIn(CONTENT_REPORT_REASONS)
  reason!: string;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: 1000,
  })
  @IsOptional()
  @Transform(
    ({ value }) => {
      if (value === null || value === undefined) {
        return value;
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();

        return trimmed.length ? trimmed : null;
      }

      return value;
    },
    {
      toClassOnly: true,
    },
  )
  @IsString()
  @MaxLength(1000)
  details?: string | null;
}
