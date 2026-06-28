import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { normalizeDigits, normalizeIranianMobile } from '../auth.utils.js';

export class VerifyOtpDto {
  @ApiProperty({
    example: '09121234567',
  })
  @Transform(({ value }) => normalizeIranianMobile(value))
  @IsString()
  @Matches(/^09\d{9}$/, {
    message: 'mobile must be a valid Iranian mobile number',
  })
  mobile!: string;

  @ApiProperty({
    example: '123456',
  })
  @Transform(({ value }) => (typeof value === 'string' ? normalizeDigits(value).trim() : value))
  @IsString()
  @Matches(/^\d{4}$/, {
    message: 'code must contain exactly 4 digits',
  })
  code!: string;
}
