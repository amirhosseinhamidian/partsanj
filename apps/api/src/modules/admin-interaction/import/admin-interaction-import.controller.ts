import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '../../../generated/prisma/client.js';
import { CurrentUser } from '../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type.js';
import { AdminInteractionImportService } from './admin-interaction-import.service.js';

const CSV_UPLOAD_OPTIONS = {
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
};

const CSV_FILE_BODY = {
  schema: {
    type: 'object',

    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },

    required: ['file'],
  },
};

@ApiTags('Admin Interaction Import')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/interactions/import',
  version: '1',
})
export class AdminInteractionImportController {
  constructor(private readonly importService: AdminInteractionImportService) {}

  @Get('template')
  @ApiOperation({
    summary: 'Download interaction CSV template',
  })
  @ApiOkResponse()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="partsanj-interactions-template.csv"')
  getTemplate() {
    return this.importService.getTemplate();
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', CSV_UPLOAD_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiBody(CSV_FILE_BODY)
  @ApiOperation({
    summary: 'Validate and preview a customer interaction CSV import',
  })
  @ApiOkResponse()
  preview(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.importService.preview(file);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', CSV_UPLOAD_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiBody(CSV_FILE_BODY)
  @ApiOperation({
    summary: 'Import validated customer interactions from CSV',
  })
  @ApiCreatedResponse()
  import(
    @UploadedFile()
    file: Express.Multer.File,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.importService.import(file, user.id);
  }
}
