import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, ValidateIf } from 'class-validator';
import { UserRole } from '../../../generated/prisma/client.js';

function transformBoolean(value: unknown) {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
}

export class UpdateAdminUserDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}
