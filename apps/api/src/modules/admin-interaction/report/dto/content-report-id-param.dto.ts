import { IsUUID } from 'class-validator';

export class ContentReportIdParamDto {
  @IsUUID('4')
  reportId!: string;
}
