import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type.js';
import { AdminInteractionService } from './admin-interaction.service.js';
import { AdminInteractionListQueryDto } from './dto/admin-interaction-list-query.dto.js';
import { AdminInteractionParamDto } from './dto/admin-interaction-param.dto.js';
import { CreateAdminInteractionReplyDto } from './dto/create-admin-interaction-reply.dto.js';
import { ModerateInteractionDto } from './dto/moderate-interaction.dto.js';

@ApiTags('Admin Interactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/interactions',
  version: '1',
})
export class AdminInteractionController {
  constructor(private readonly adminInteractionService: AdminInteractionService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get pending interaction counters',
  })
  @ApiOkResponse()
  summary() {
    return this.adminInteractionService.getSummary();
  }

  @Get()
  @ApiOperation({
    summary: 'List product reviews, questions and blog comments',
  })
  @ApiOkResponse()
  findMany(@Query() query: AdminInteractionListQueryDto) {
    return this.adminInteractionService.findMany(query);
  }

  @Patch(':type/:id/moderation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve, reject, spam or delete an interaction',
  })
  @ApiOkResponse()
  moderate(
    @Param() params: AdminInteractionParamDto,
    @Body() dto: ModerateInteractionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminInteractionService.moderate(params.type, params.id, dto.status, user.id);
  }

  @Post(':type/:id/replies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an official Partsanj reply',
  })
  reply(
    @Param() params: AdminInteractionParamDto,
    @Body() dto: CreateAdminInteractionReplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminInteractionService.reply(params.type, params.id, dto.body, user.id);
  }
}
