import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

function trimText(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class MarkOrderShippedDto {
  @Transform(({ value }) => trimText(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  shippingCarrier!: string;

  @Transform(({ value }) => trimText(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  trackingCode!: string;

  @IsOptional()
  @Transform(({ value }) => trimText(value))
  @IsString()
  @MaxLength(1000)
  shipmentNote?: string;
}
