/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminInteractionReplyDto {
  @ApiProperty({
    example: 'بله، این قطعه برای مدل موردنظر شما مناسب است.',
    maxLength: 3000,
  })
  @Transform(({ value }) => {
    return typeof value === 'string' ? value.trim() : value;
  })
  @IsString()
  @MinLength(2)
  @MaxLength(3000)
  body!: string;
}
