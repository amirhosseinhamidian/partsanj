import { IsUUID } from 'class-validator';

export class PaymentOrderIdParamDto {
  @IsUUID('4')
  orderId!: string;
}
