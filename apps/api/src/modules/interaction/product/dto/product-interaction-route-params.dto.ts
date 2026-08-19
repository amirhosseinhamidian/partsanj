import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { ProductSlugParamDto } from '../../../catalog/dto/product-slug-param.dto.js';

export class ProductReviewHelpfulParamsDto extends ProductSlugParamDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID('4')
  reviewId!: string;
}

export class ProductQuestionReplyParamsDto extends ProductSlugParamDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID('4')
  questionId!: string;
}
