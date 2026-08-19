/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProductQuestionReplyDto {
  @ApiProperty({
    maxLength: 3000,
    example: 'مدل خودرو من ۱۴۰۰ و موتور TU5 است.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value), {
    toClassOnly: true,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(3000)
  body!: string;

  @ApiPropertyOptional({
    description: 'Reply to another reply inside the same question thread',
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
