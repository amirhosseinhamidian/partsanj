import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum VehicleCsvImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPSERT = 'UPSERT',
}

export class PreviewVehicleCsvImportDto {
  @ApiPropertyOptional({
    enum: VehicleCsvImportMode,
    default: VehicleCsvImportMode.CREATE_ONLY,
  })
  @IsOptional()
  @IsEnum(VehicleCsvImportMode)
  mode?: VehicleCsvImportMode = VehicleCsvImportMode.CREATE_ONLY;
}
