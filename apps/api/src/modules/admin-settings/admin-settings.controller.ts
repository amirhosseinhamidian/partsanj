import { Body, Controller, Get, HttpCode, HttpStatus, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { AdminSettingsService } from './admin-settings.service.js';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto.js';

@ApiTags('Admin Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/settings',
  version: '1',
})
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get site settings',
  })
  @ApiOkResponse()
  findSettings() {
    return this.adminSettingsService.findSettings();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update site settings',
  })
  @ApiOkResponse()
  updateSettings(@Body() dto: UpdateSiteSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.adminSettingsService.updateSettings(dto, user.id);
  }
}
