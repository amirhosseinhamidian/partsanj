import { PartialType } from '@nestjs/swagger';
import { CreateVehicleModelDto } from './create-vehicle-model.dto.js';

export class UpdateVehicleModelDto extends PartialType(CreateVehicleModelDto) {}
