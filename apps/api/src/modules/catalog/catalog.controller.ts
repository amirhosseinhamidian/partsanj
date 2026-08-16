import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
import { CategorySlugParamDto } from './dto/category-slug-param.dto.js';
import { FindRelatedProductsQueryDto } from './dto/find-related-products.query.dto.js';
import { FindComplementaryProductsQueryDto } from './dto/find-complementary-products.query.dto.js';
import { TrackProductViewDto } from './dto/track-product-view.dto.js';

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

  @Get('categories/:slug')
  @ApiOperation({
    summary: 'Get an active category by slug',
  })
  @ApiParam({
    name: 'slug',
    example: 'electrical-parts',
  })
  @ApiOkResponse({
    description: 'Category returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Category does not exist or is inactive',
  })
  findCategoryBySlug(@Param() params: CategorySlugParamDto) {
    return this.catalogService.findCategoryBySlug(params.slug);
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

  @Get('products/:slug/related')
  @ApiOperation({
    summary: 'List related published products',
  })
  @ApiParam({
    name: 'slug',
    example: 'force-crankshaft-sensor-peugeot-405',
  })
  @ApiOkResponse({
    description: 'Related products returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Source product does not exist or is not published',
  })
  findRelatedProducts(
    @Param() params: ProductSlugParamDto,
    @Query() query: FindRelatedProductsQueryDto,
  ) {
    return this.catalogService.findRelatedProducts(params.slug, query.limit);
  }

  @Get('products/:slug/complementary')
  @ApiOperation({
    summary: 'List complementary published products',
  })
  @ApiParam({
    name: 'slug',
    example: 'force-ignition-coil-peugeot-405',
  })
  @ApiOkResponse({
    description: 'Complementary products returned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Source product does not exist or is not published',
  })
  findComplementaryProducts(
    @Param() params: ProductSlugParamDto,
    @Query()
    query: FindComplementaryProductsQueryDto,
  ) {
    return this.catalogService.findComplementaryProducts(params.slug, query.limit);
  }

  @Post('products/:slug/view')
  @ApiOperation({
    summary: 'Track a storefront product view for recommendations',
  })
  @ApiParam({
    name: 'slug',
  })
  @ApiOkResponse({
    description: 'Product view processed successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product does not exist or is not published',
  })
  trackProductView(@Param() params: ProductSlugParamDto, @Body() dto: TrackProductViewDto) {
    return this.catalogService.trackProductView(params.slug, dto);
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
