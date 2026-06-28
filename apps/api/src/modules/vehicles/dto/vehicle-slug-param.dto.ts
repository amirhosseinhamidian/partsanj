import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class VehicleSlugParamDto {
  @ApiProperty({
    example: 'iran-khodro',
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;
}
