import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogPublicService } from './blog-public.service.js';
import { PublicBlogCategorySlugParamDto } from './dto/public-blog-category-slug-param.dto.js';
import { PublicBlogPostListQueryDto } from './dto/public-blog-post-list-query.dto.js';
import { PublicBlogPostSlugParamDto } from './dto/public-blog-post-slug-param.dto.js';

@Controller({
  path: 'blog',
  version: '1',
})
export class BlogPublicController {
  constructor(private readonly blogPublicService: BlogPublicService) {}

  @Get('categories')
  findCategories() {
    return this.blogPublicService.findCategories();
  }

  @Get('categories/:slug')
  findCategory(@Param() params: PublicBlogCategorySlugParamDto) {
    return this.blogPublicService.findCategory(params);
  }

  @Get('posts')
  findPosts(@Query() query: PublicBlogPostListQueryDto) {
    return this.blogPublicService.findPosts(query);
  }

  @Get('posts/:slug')
  findPost(@Param() params: PublicBlogPostSlugParamDto) {
    return this.blogPublicService.findPost(params);
  }
}
