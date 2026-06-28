import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ProductSlugParamDto {
  @ApiProperty({
    example: 'bosch-oxygen-sensor-0258006028',
  })
  @IsString()
  @Matches(SLUG_PATTERN)
  slug!: string;
}
