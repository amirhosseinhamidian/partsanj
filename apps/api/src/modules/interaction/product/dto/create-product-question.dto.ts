/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProductQuestionDto {
  @ApiProperty({
    maxLength: 2000,
    example: 'آیا این قطعه برای پژو پارس TU5 مدل ۱۴۰۰ مناسب است؟',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value), {
    toClassOnly: true,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  body!: string;
}
