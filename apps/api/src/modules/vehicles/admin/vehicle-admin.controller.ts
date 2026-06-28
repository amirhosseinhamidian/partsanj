import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { CreateVehicleMakeDto } from './dto/create-vehicle-make.dto.js';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto.js';
import { CreateVehicleVariantDto } from './dto/create-vehicle-variant.dto.js';
import { UpdateVehicleMakeDto } from './dto/update-vehicle-make.dto.js';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto.js';
import { UpdateVehicleVariantDto } from './dto/update-vehicle-variant.dto.js';
import { VehicleIdParamDto } from './dto/vehicle-id-param.dto.js';
import { VehicleAdminService } from './vehicle-admin.service.js';

@ApiTags('Admin Vehicles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/vehicles',
  version: '1',
})
export class VehicleAdminController {
  constructor(private readonly vehicleAdminService: VehicleAdminService) {}

  @Get('makes')
  @ApiOperation({
    summary: 'List vehicle makes for administrators',
  })
  @ApiOkResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  findMakes() {
    return this.vehicleAdminService.findMakes();
  }

  @Post('makes')
  @ApiOperation({
    summary: 'Create a vehicle make',
  })
  @ApiCreatedResponse()
  @ApiConflictResponse()
  createMake(@Body() dto: CreateVehicleMakeDto) {
    return this.vehicleAdminService.createMake(dto);
  }

  @Patch('makes/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a vehicle make',
  })
  @ApiOkResponse()
  @ApiConflictResponse()
  updateMake(@Param() params: VehicleIdParamDto, @Body() dto: UpdateVehicleMakeDto) {
    return this.vehicleAdminService.updateMake(params.id, dto);
  }

  @Get('models')
  @ApiOperation({
    summary: 'List vehicle models for administrators',
  })
  @ApiOkResponse()
  findModels() {
    return this.vehicleAdminService.findModels();
  }

  @Post('models')
  @ApiOperation({
    summary: 'Create a vehicle model',
  })
  @ApiCreatedResponse()
  @ApiConflictResponse()
  createModel(@Body() dto: CreateVehicleModelDto) {
    return this.vehicleAdminService.createModel(dto);
  }

  @Patch('models/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a vehicle model',
  })
  @ApiOkResponse()
  @ApiConflictResponse()
  updateModel(@Param() params: VehicleIdParamDto, @Body() dto: UpdateVehicleModelDto) {
    return this.vehicleAdminService.updateModel(params.id, dto);
  }

  @Get('variants')
  @ApiOperation({
    summary: 'List vehicle variants for administrators',
  })
  @ApiOkResponse()
  findVariants() {
    return this.vehicleAdminService.findVariants();
  }

  @Post('variants')
  @ApiOperation({
    summary: 'Create a vehicle variant',
  })
  @ApiCreatedResponse()
  @ApiConflictResponse()
  createVariant(@Body() dto: CreateVehicleVariantDto) {
    return this.vehicleAdminService.createVariant(dto);
  }

  @Patch('variants/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a vehicle variant',
  })
  @ApiOkResponse()
  @ApiConflictResponse()
  updateVariant(@Param() params: VehicleIdParamDto, @Body() dto: UpdateVehicleVariantDto) {
    return this.vehicleAdminService.updateVariant(params.id, dto);
  }
}
