import { IsUUID } from 'class-validator';

export class BlogCategoryIdParamDto {
  @IsUUID('4')
  blogCategoryId: string;
}
