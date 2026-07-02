import { IsUUID } from 'class-validator';

export class CartItemIdParamDto {
  @IsUUID()
  itemId!: string;
}
