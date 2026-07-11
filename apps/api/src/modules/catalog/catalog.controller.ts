import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import { FindProductsQueryDto } from './dto/find-products.query.dto.js';
import { ProductSlugParamDto } from './dto/product-slug-param.dto.js';
import { FindHomeFeaturedProductsQueryDto } from './dto/find-home-featured-products.query.dto.js';

@ApiTags('Catalog')
@Controller({
  path: 'catalog',
  version: '1',
})
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('brands')
  @ApiOperation({
    summary: 'List active brands',
  })
  @ApiOkResponse({
    description: 'Active brands returned successfully',
  })
  findBrands() {
    return this.catalogService.findBrands();
  }

  @Get('categories')
  @ApiOperation({
    summary: 'List active categories',
  })
  @ApiOkResponse({
    description: 'Active categories returned successfully',
  })
  findCategories() {
    return this.catalogService.findCategories();
  }

  @Get('products')
  @ApiOperation({
    summary: 'Search and list published products',
  })
  @ApiOkResponse({
    description: 'Published products returned successfully',
  })
  findProducts(@Query() query: FindProductsQueryDto) {
    return this.catalogService.findProducts(query);
  }

  @Get('home/featured-products')
  @ApiOperation({
    summary: 'List featured products for storefront home page',
  })
  @ApiOkResponse({
    description: 'Featured home products returned successfully',
  })
  findHomeFeaturedProducts(@Query() query: FindHomeFeaturedProductsQueryDto) {
    return this.catalogService.findHomeFeaturedProducts(query);
  }

  @Get('products/:slug')
  @ApiOperation({
    summary: 'Get a published product by slug',
  })
  @ApiParam({
    name: 'slug',
    example: 'bosch-oxygen-sensor-0258006028',
  })
  @ApiOkResponse({
    description: 'Product returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product does not exist or is not published',
  })
  findProductBySlug(@Param() params: ProductSlugParamDto) {
    return this.catalogService.findProductBySlug(params.slug);
  }
}
