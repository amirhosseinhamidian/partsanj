import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { CustomerVehicleService } from './customer-vehicle.service.js';
import { CreateCustomerVehicleDto } from './dto/create-customer-vehicle.dto.js';
import { CustomerVehicleIdParamDto } from './dto/customer-vehicle-id-param.dto.js';
import { UpdateCustomerVehicleDto } from './dto/update-customer-vehicle.dto.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'customer/vehicles',
  version: '1',
})
export class CustomerVehicleController {
  constructor(private readonly customerVehicleService: CustomerVehicleService) {}

  @Get()
  findVehicles(@CurrentUser() user: AuthenticatedUser) {
    return this.customerVehicleService.findVehicles(user.id);
  }

  @Post()
  createVehicle(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerVehicleDto) {
    return this.customerVehicleService.createVehicle(user.id, dto);
  }

  @Patch(':customerVehicleId')
  updateVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: CustomerVehicleIdParamDto,
    @Body() dto: UpdateCustomerVehicleDto,
  ) {
    return this.customerVehicleService.updateVehicle(user.id, params.customerVehicleId, dto);
  }

  @Post(':customerVehicleId/default')
  setDefaultVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: CustomerVehicleIdParamDto,
  ) {
    return this.customerVehicleService.setDefaultVehicle(user.id, params.customerVehicleId);
  }

  @Delete(':customerVehicleId')
  deleteVehicle(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: CustomerVehicleIdParamDto,
  ) {
    return this.customerVehicleService.deleteVehicle(user.id, params.customerVehicleId);
  }
}
