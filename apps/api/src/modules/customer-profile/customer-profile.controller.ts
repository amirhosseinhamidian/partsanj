import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto.js';
import { CustomerProfileService } from './customer-profile.service.js';

@UseGuards(JwtAuthGuard)
@Controller({
  path: 'customer/profile',
  version: '1',
})
export class CustomerProfileController {
  constructor(private readonly customerProfileService: CustomerProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.customerProfileService.getProfile(user.id);
  }

  @Patch()
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCustomerProfileDto) {
    return this.customerProfileService.updateProfile(user.id, dto);
  }
}
