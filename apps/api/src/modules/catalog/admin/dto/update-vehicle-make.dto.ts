import { PartialType } from '@nestjs/swagger';
import { CreateVehicleMakeDto } from './create-vehicle-make.dto.js';

export class UpdateVehicleMakeDto extends PartialType(CreateVehicleMakeDto) {}
