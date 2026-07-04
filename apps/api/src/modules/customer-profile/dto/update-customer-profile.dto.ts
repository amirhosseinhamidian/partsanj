import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

function normalizeName(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().replace(/\s+/g, ' ');
}

export class UpdateCustomerProfileDto {
  @Transform(({ value }) => normalizeName(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @Transform(({ value }) => normalizeName(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;
}
