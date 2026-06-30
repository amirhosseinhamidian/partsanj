import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindActiveVehicleModelsQueryDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Vehicle make UUID',
  })
  @IsUUID('4')
  makeId!: string;
}

export class FindActiveVehicleVariantsQueryDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Vehicle model UUID',
  })
  @IsUUID('4')
  modelId!: string;
}
