import { IsUUID } from 'class-validator';

export class CustomerVehicleIdParamDto {
  @IsUUID('4')
  customerVehicleId: string;
}
