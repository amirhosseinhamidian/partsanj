import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { UserRole } from '../../../generated/prisma/client.js';

import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';

import { AdminContentReportService } from './admin-content-report.service.js';
import { AdminContentReportListQueryDto } from './dto/admin-content-report-list-query.dto.js';
import { ContentReportIdParamDto } from './dto/content-report-id-param.dto.js';
import { UpdateContentReportStatusDto } from './dto/update-content-report-status.dto.js';

@ApiTags('Admin Content Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/interactions/reports',
  version: '1',
})
export class AdminContentReportController {
  constructor(private readonly service: AdminContentReportService) {}

  @Get()
  @ApiOperation({
    summary: 'List reported user-generated content',
  })
  @ApiOkResponse()
  findMany(
    @Query()
    query: AdminContentReportListQueryDto,
  ) {
    return this.service.findMany(query);
  }

  @Patch(':reportId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve or dismiss a content report',
  })
  @ApiOkResponse()
  updateStatus(
    @Param()
    params: ContentReportIdParamDto,

    @Body()
    dto: UpdateContentReportStatusDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.service.updateStatus(params.reportId, dto.status, user.id);
  }
}
