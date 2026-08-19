import { IsEnum, IsUUID } from 'class-validator';
import { AdminInteractionType } from '../admin-interaction-type.enum.js';

export class AdminInteractionParamDto {
  @IsEnum(AdminInteractionType)
  type!: AdminInteractionType;

  @IsUUID('4')
  id!: string;
}
