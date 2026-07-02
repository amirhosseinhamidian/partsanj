import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { CustomerAddressService } from './customer-address.service.js';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto.js';
import { CustomerAddressIdParamDto } from './dto/customer-address-id-param.dto.js';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto.js';

@ApiTags('Customer Addresses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'customer/addresses',
  version: '1',
})
export class CustomerAddressController {
  constructor(private readonly customerAddressService: CustomerAddressService) {}

  @Get()
  async listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: await this.customerAddressService.listAddresses(user.id),
    };
  }

  @Post()
  async createAddress(
    @Body() dto: CreateCustomerAddressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      data: await this.customerAddressService.createAddress(user.id, dto),
    };
  }

  @Post(':addressId/default')
  async setDefaultAddress(
    @Param() params: CustomerAddressIdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      data: await this.customerAddressService.setDefaultAddress(user.id, params.addressId),
    };
  }

  @Patch(':addressId')
  async updateAddress(
    @Param() params: CustomerAddressIdParamDto,
    @Body() dto: UpdateCustomerAddressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return {
      data: await this.customerAddressService.updateAddress(user.id, params.addressId, dto),
    };
  }

  @Delete(':addressId')
  @HttpCode(HttpStatus.OK)
  async archiveAddress(
    @Param() params: CustomerAddressIdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.customerAddressService.archiveAddress(user.id, params.addressId);

    return {
      data: {
        id: params.addressId,
      },
    };
  }
}
