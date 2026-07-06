import { IsUUID } from 'class-validator';

export class AdminUserIdParamDto {
  @IsUUID('4')
  userId: string;
}
