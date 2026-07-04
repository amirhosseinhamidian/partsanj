import { IsUUID } from 'class-validator';

export class CustomerOrderIdParamDto {
  @IsUUID('4')
  orderId: string;
}
