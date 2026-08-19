import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';

import { ContentReportService } from './content-report.service.js';
import { CreateContentReportDto } from './dto/create-content-report.dto.js';

@ApiTags('Content Reports')
@Controller({
  path: 'interactions/reports',
  version: '1',
})
export class ContentReportController {
  constructor(private readonly contentReportService: ContentReportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Report inappropriate user-generated content',
  })
  @ApiCreatedResponse()
  create(
    @Body()
    dto: CreateContentReportDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.contentReportService.create(dto, user.id);
  }
}
