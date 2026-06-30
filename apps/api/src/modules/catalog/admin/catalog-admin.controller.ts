import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { CatalogAdminService } from './catalog-admin.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { EntityIdParamDto } from './dto/entity-id-param.dto.js';
import { FindAdminProductsQueryDto } from './dto/find-admin-products.query.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ReplaceProductCompatibilitiesDto } from './dto/replace-product-compatibilities.dto.js';
import {
  FindActiveVehicleModelsQueryDto,
  FindActiveVehicleVariantsQueryDto,
} from './dto/find-active-vehicle-catalog.query.dto.js';
import { CreateVehicleMakeDto } from './dto/create-vehicle-make.dto.js';
import { UpdateVehicleMakeDto } from './dto/update-vehicle-make.dto.js';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto.js';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto.js';
import { CreateVehicleVariantDto } from './dto/create-vehicle-variant.dto.js';
import { UpdateVehicleVariantDto } from './dto/update-vehicle-variant.dto.js';

@ApiTags('Admin Catalog')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/catalog',
  version: '1',
})
export class CatalogAdminController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  @Get('brands')
  @ApiOperation({
    summary: 'List all brands for administrators',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  findBrands() {
    return this.catalogAdminService.findBrands();
  }

  @Get('categories')
  @ApiOperation({
    summary: 'List all categories for administrators',
  })
  @ApiOkResponse()
  findCategories() {
    return this.catalogAdminService.findCategories();
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a category without dependent products or child categories',
  })
  @ApiOkResponse()
  @ApiConflictResponse({
    description: 'Category has products or child categories and cannot be deleted',
  })
  deleteCategory(@Param() params: EntityIdParamDto) {
    return this.catalogAdminService.deleteCategory(params.id);
  }

  @Get('vehicle-makes')
  @ApiOperation({
    summary: 'List active vehicle makes for product compatibility',
  })
  @ApiOkResponse()
  findActiveVehicleMakes() {
    return this.catalogAdminService.findActiveVehicleMakes();
  }

  @Get('vehicle-models')
  @ApiOperation({
    summary: 'List active vehicle models for a make',
  })
  @ApiOkResponse()
  findActiveVehicleModels(@Query() query: FindActiveVehicleModelsQueryDto) {
    return this.catalogAdminService.findActiveVehicleModels(query.makeId);
  }

  @Get('vehicle-variants')
  @ApiOperation({
    summary: 'List active vehicle variants for a model',
  })
  @ApiOkResponse()
  findActiveVehicleVariants(@Query() query: FindActiveVehicleVariantsQueryDto) {
    return this.catalogAdminService.findActiveVehicleVariants(query.modelId);
  }

  @Get('vehicles/makes')
  @ApiOperation({
    summary: 'List all vehicle makes for administration',
  })
  @ApiOkResponse()
  findVehicleMakes() {
    return this.catalogAdminService.findVehicleMakes();
  }

  @Get('vehicles/models')
  @ApiOperation({
    summary: 'List all vehicle models for administration',
  })
  @ApiOkResponse()
  findVehicleModels() {
    return this.catalogAdminService.findVehicleModels();
  }

  @Get('vehicles/variants')
  @ApiOperation({
    summary: 'List all vehicle variants for administration',
  })
  @ApiOkResponse()
  findVehicleVariants() {
    return this.catalogAdminService.findVehicleVariants();
  }

  @Get('products')
  @ApiOperation({
    summary: 'List products for administrators',
  })
  @ApiOkResponse()
  findProducts(@Query() query: FindAdminProductsQueryDto) {
    return this.catalogAdminService.findProducts(query);
  }

  @Get('products/:id/compatibilities')
  @ApiOperation({
    summary: 'Get product vehicle compatibility records',
  })
  @ApiOkResponse()
  findProductCompatibilities(@Param() params: EntityIdParamDto) {
    return this.catalogAdminService.findProductCompatibilities(params.id);
  }

  @Put('products/:id/compatibilities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Replace the complete vehicle compatibility list for a product',
  })
  @ApiOkResponse()
  replaceProductCompatibilities(
    @Param() params: EntityIdParamDto,
    @Body() dto: ReplaceProductCompatibilitiesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.replaceProductCompatibilities(params.id, dto, user.id);
  }

  @Get('products/:id')
  @ApiOperation({
    summary: 'Get a product with audit history',
  })
  @ApiOkResponse()
  findProductById(@Param() params: EntityIdParamDto) {
    return this.catalogAdminService.findProductById(params.id);
  }

  @Post('products')
  @ApiOperation({
    summary: 'Create a product',
  })
  @ApiCreatedResponse()
  @ApiConflictResponse({
    description: 'SKU or slug already exists',
  })
  createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogAdminService.createProduct(dto, user.id);
  }

  @Patch('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a product',
  })
  @ApiOkResponse()
  @ApiConflictResponse({
    description: 'SKU or slug already exists',
  })
  updateProduct(
    @Param() params: EntityIdParamDto,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.updateProduct(params.id, dto, user.id);
  }

  @Post('products/:id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a product and disable public and Torob visibility',
  })
  @ApiOkResponse()
  archiveProduct(@Param() params: EntityIdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogAdminService.archiveProduct(params.id, user.id);
  }

  @Post('brands')
  @ApiOperation({
    summary: 'Create a brand',
  })
  @ApiCreatedResponse()
  @ApiConflictResponse({
    description: 'Brand name or slug already exists',
  })
  createBrand(@Body() dto: CreateBrandDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogAdminService.createBrand(dto, user.id);
  }

  @Patch('brands/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a brand',
  })
  @ApiOkResponse()
  @ApiConflictResponse({
    description: 'Brand name or slug already exists',
  })
  updateBrand(
    @Param() params: EntityIdParamDto,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.updateBrand(params.id, dto, user.id);
  }

  @Post('categories')
  @ApiOperation({
    summary: 'Create a category',
  })
  @ApiCreatedResponse()
  @ApiConflictResponse({
    description: 'Category slug already exists',
  })
  createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogAdminService.createCategory(dto, user.id);
  }

  @Patch('categories/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a category',
  })
  @ApiOkResponse()
  @ApiConflictResponse({
    description: 'Category slug already exists',
  })
  updateCategory(
    @Param() params: EntityIdParamDto,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.updateCategory(params.id, dto, user.id);
  }

  @Post('vehicles/makes')
  createVehicleMake(@Body() dto: CreateVehicleMakeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogAdminService.createVehicleMake(dto, user.id);
  }

  @Patch('vehicles/makes/:id')
  @HttpCode(HttpStatus.OK)
  updateVehicleMake(
    @Param() params: EntityIdParamDto,
    @Body() dto: UpdateVehicleMakeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.updateVehicleMake(params.id, dto, user.id);
  }

  @Post('vehicles/models')
  createVehicleModel(@Body() dto: CreateVehicleModelDto, @CurrentUser() user: AuthenticatedUser) {
    return this.catalogAdminService.createVehicleModel(dto, user.id);
  }

  @Patch('vehicles/models/:id')
  @HttpCode(HttpStatus.OK)
  updateVehicleModel(
    @Param() params: EntityIdParamDto,
    @Body() dto: UpdateVehicleModelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.updateVehicleModel(params.id, dto, user.id);
  }

  @Post('vehicles/variants')
  createVehicleVariant(
    @Body() dto: CreateVehicleVariantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.createVehicleVariant(dto, user.id);
  }

  @Patch('vehicles/variants/:id')
  @HttpCode(HttpStatus.OK)
  updateVehicleVariant(
    @Param() params: EntityIdParamDto,
    @Body() dto: UpdateVehicleVariantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogAdminService.updateVehicleVariant(params.id, dto, user.id);
  }
}
