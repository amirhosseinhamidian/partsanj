import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/auth',
  version: '1',
})
export class AdminController {
  @Get('check')
  @ApiOperation({
    summary: 'Check whether the authenticated user has admin access',
  })
  @ApiOkResponse({
    description: 'Admin access confirmed',
  })
  @ApiForbiddenResponse({
    description: 'Authenticated user is not an admin',
  })
  check(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: {
        authorized: true,
        user,
      },
    };
  }
}
