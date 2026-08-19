/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateBlogCommentDto {
  @ApiProperty({
    maxLength: 3000,
    example: 'ممنون از توضیحات کامل این مقاله.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value), {
    toClassOnly: true,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(3000)
  body!: string;

  @ApiPropertyOptional({
    description: 'When set, the comment is a reply to another approved comment',
  })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
