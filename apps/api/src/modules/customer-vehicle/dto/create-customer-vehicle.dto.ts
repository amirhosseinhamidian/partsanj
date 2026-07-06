import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

function normalizeLabel(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');

  return normalized || null;
}

export class CreateCustomerVehicleDto {
  @IsUUID('4')
  vehicleVariantId: string;

  @IsOptional()
  @Transform(({ value }) => normalizeLabel(value))
  @IsString()
  @MaxLength(60)
  label?: string | null;
}
