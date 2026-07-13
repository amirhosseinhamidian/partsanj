import { IsEnum, IsOptional } from 'class-validator';

export enum AdminDashboardRange {
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
}

export class GetAdminDashboardQueryDto {
  @IsOptional()
  @IsEnum(AdminDashboardRange)
  range?: AdminDashboardRange;
}
