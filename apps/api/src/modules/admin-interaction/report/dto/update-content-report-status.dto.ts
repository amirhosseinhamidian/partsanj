import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { ContentReportStatus } from '../../../../generated/prisma/client.js';

const FINAL_REPORT_STATUSES = [
  ContentReportStatus.RESOLVED,
  ContentReportStatus.DISMISSED,
] as const;

export class UpdateContentReportStatusDto {
  @ApiProperty({
    enum: FINAL_REPORT_STATUSES,
  })
  @IsIn(FINAL_REPORT_STATUSES)
  status!: ContentReportStatus;
}
