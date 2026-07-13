import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AdminDashboardService } from './admin-dashboard.service.js';
import { GetAdminDashboardQueryDto } from './dto/get-admin-dashboard-query.dto.js';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/dashboard',
  version: '1',
})
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get administrator dashboard overview',
  })
  @ApiOkResponse({
    description: 'Returns sales, orders, products, customers, alerts and recent activities',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  getDashboard(@Query() query: GetAdminDashboardQueryDto) {
    return this.adminDashboardService.getDashboard(query);
  }
}
