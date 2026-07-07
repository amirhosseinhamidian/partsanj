import { IsUUID } from 'class-validator';

export class BlogPostIdParamDto {
  @IsUUID('4')
  blogPostId: string;
}
