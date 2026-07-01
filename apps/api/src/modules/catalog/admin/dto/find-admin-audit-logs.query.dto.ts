import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AdminAuditAction, AdminAuditEntityType } from '../../../../generated/prisma/client.js';

function normalizeOptionalText(value: unknown): string | undefined | unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}

export class FindAdminAuditLogsQueryDto {
  @ApiPropertyOptional({
    enum: AdminAuditEntityType,
  })
  @IsOptional()
  @IsEnum(AdminAuditEntityType)
  entityType?: AdminAuditEntityType;

  @ApiPropertyOptional({
    enum: AdminAuditAction,
  })
  @IsOptional()
  @IsEnum(AdminAuditAction)
  action?: AdminAuditAction;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'شناسه کاربر انجام‌دهنده عملیات',
  })
  @IsOptional()
  @IsUUID('4')
  actorUserId?: string;

  @ApiPropertyOptional({
    description: 'جستجو در نام یا Label موجودیت',
    example: 'پژو 206',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeOptionalText(value), {
    toClassOnly: true,
  })
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'شروع بازه زمانی به صورت ISO DateTime',
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'پایان بازه زمانی به صورت ISO DateTime',
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    default: 25,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
