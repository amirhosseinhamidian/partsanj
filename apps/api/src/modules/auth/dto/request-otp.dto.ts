import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { normalizeIranianMobile } from '../auth.utils.js';

export class RequestOtpDto {
  @ApiProperty({
    example: '09121234567',
  })
  @Transform(({ value }) => normalizeIranianMobile(value))
  @IsString()
  @Matches(/^09\d{9}$/, {
    message: 'mobile must be a valid Iranian mobile number',
  })
  mobile!: string;
}
