import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class TrackProductViewDto {
  @ApiProperty({
    example: 'b18f56f7-f55f-4bd2-8662-3e3ce9dc44ad',
    description: 'Anonymous recommendation session identifier',
  })
  @IsUUID('4')
  sessionId!: string;

  @ApiPropertyOptional({
    description: 'Vehicle variant selected by the visitor when viewing the product',
  })
  @IsOptional()
  @IsUUID('4')
  vehicleVariantId?: string;
}
