import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '../../../../generated/prisma/client.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import { Roles } from '../../../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../../../auth/types/authenticated-user.type.js';
import {
  PreviewVehicleCsvImportDto,
  VehicleCsvImportMode,
} from './dto/vehicle-csv-import.dto.js';
import { VehicleCsvImportService } from './vehicle-csv-import.service.js';

const MAX_CSV_FILE_BYTES = 2 * 1024 * 1024;

const csvFileInterceptor = () =>
  FileInterceptor('file', {
    limits: {
      files: 1,
      fileSize: MAX_CSV_FILE_BYTES,
    },
  });

const csvUploadSchema = {
  type: 'object' as const,
  required: ['file'],
  properties: {
    file: {
      type: 'string' as const,
      format: 'binary',
    },
    mode: {
      type: 'string' as const,
      enum: Object.values(VehicleCsvImportMode),
      default: VehicleCsvImportMode.CREATE_ONLY,
    },
  },
};

@ApiTags('Admin Vehicle Import')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/catalog/vehicles/import',
  version: '1',
})
export class VehicleCsvImportController {
  constructor(
    private readonly vehicleCsvImportService: VehicleCsvImportService,
  ) {}

  @Get('makes/template')
  @ApiOperation({ summary: 'Download vehicle make CSV template' })
  @ApiProduces('text/csv')
  @ApiOkResponse()
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="vehicle-makes-import-template.csv"',
  )
  downloadMakesTemplate() {
    return new StreamableFile(
      this.vehicleCsvImportService.getMakesTemplate(),
    );
  }

  @Post('makes/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({ summary: 'Preview vehicle make CSV import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: csvUploadSchema })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  previewMakes(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewVehicleCsvImportDto,
  ) {
    return this.vehicleCsvImportService.previewMakes(
      this.requireCsvFile(file),
      dto.mode ?? VehicleCsvImportMode.CREATE_ONLY,
    );
  }

  @Post('makes/execute')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({ summary: 'Execute vehicle make CSV import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: csvUploadSchema })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  executeMakes(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewVehicleCsvImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vehicleCsvImportService.executeMakes(
      this.requireCsvFile(file),
      dto.mode ?? VehicleCsvImportMode.CREATE_ONLY,
      user.id,
    );
  }

  @Get('models/template')
  @ApiOperation({ summary: 'Download vehicle model CSV template' })
  @ApiProduces('text/csv')
  @ApiOkResponse()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="vehicle-models-import-template.csv"',
  )
  downloadModelsTemplate() {
    return new StreamableFile(
      this.vehicleCsvImportService.getModelsTemplate(),
    );
  }

  @Post('models/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({ summary: 'Preview vehicle model CSV import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: csvUploadSchema })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  previewModels(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewVehicleCsvImportDto,
  ) {
    return this.vehicleCsvImportService.previewModels(
      this.requireCsvFile(file),
      dto.mode ?? VehicleCsvImportMode.CREATE_ONLY,
    );
  }

  @Post('models/execute')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({ summary: 'Execute vehicle model CSV import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: csvUploadSchema })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  executeModels(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewVehicleCsvImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vehicleCsvImportService.executeModels(
      this.requireCsvFile(file),
      dto.mode ?? VehicleCsvImportMode.CREATE_ONLY,
      user.id,
    );
  }

  @Get('variants/template')
  @ApiOperation({ summary: 'Download vehicle variant CSV template' })
  @ApiProduces('text/csv')
  @ApiOkResponse()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="vehicle-variants-import-template.csv"',
  )
  downloadVariantsTemplate() {
    return new StreamableFile(
      this.vehicleCsvImportService.getVariantsTemplate(),
    );
  }

  @Post('variants/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({ summary: 'Preview vehicle variant CSV import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: csvUploadSchema })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  previewVariants(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewVehicleCsvImportDto,
  ) {
    return this.vehicleCsvImportService.previewVariants(
      this.requireCsvFile(file),
      dto.mode ?? VehicleCsvImportMode.CREATE_ONLY,
    );
  }

  @Post('variants/execute')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({ summary: 'Execute vehicle variant CSV import' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: csvUploadSchema })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  executeVariants(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewVehicleCsvImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vehicleCsvImportService.executeVariants(
      this.requireCsvFile(file),
      dto.mode ?? VehicleCsvImportMode.CREATE_ONLY,
      user.id,
    );
  }

  private requireCsvFile(
    file: Express.Multer.File | undefined,
  ): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('فایل CSV ارسال نشده است.');
    }

    return file;
  }
}
