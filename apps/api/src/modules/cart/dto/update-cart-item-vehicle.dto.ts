import { IsUUID, ValidateIf } from 'class-validator';
export class UpdateCartItemVehicleDto {
  // null یعنی جداکردن خودرو از آیتم
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  vehicleVariantId!: string | null;
}
