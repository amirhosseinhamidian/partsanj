import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { UploadPurpose } from '../upload-purpose.enum.js';

export class UploadImageDto {
  @ApiProperty({
    enum: UploadPurpose,
    enumName: 'UploadPurpose',
    example: UploadPurpose.PRODUCT,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value), {
    toClassOnly: true,
  })
  @IsEnum(UploadPurpose)
  purpose!: UploadPurpose;
}
