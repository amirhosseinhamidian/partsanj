import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { AdminUserService } from './admin-user.service.js';
import { AdminUserIdParamDto } from './dto/admin-user-id-param.dto.js';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/users',
  version: '1',
})
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  findUsers(@Query() query: AdminUserListQueryDto) {
    return this.adminUserService.findUsers(query);
  }

  @Get(':userId')
  findUser(@Param() params: AdminUserIdParamDto) {
    return this.adminUserService.findUser(params.userId);
  }

  @Patch(':userId')
  updateUser(
    @CurrentUser() actor: AuthenticatedUser,
    @Param() params: AdminUserIdParamDto,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminUserService.updateUser(actor, params.userId, dto);
  }
}
