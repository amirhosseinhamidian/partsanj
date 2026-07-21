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
import { CatalogReferenceCsvImportService } from './catalog-reference-csv-import.service.js';
import { CatalogCsvImportService } from './catalog-csv-import.service.js';
import {
  CatalogReferenceCsvImportMode,
  PreviewCatalogReferenceCsvImportDto,
} from './dto/catalog-reference-csv-import.dto.js';
import {
  PreviewProductCsvImportDto,
  ProductCsvImportMode,
} from './dto/preview-product-csv-import.dto.js';

const MAX_CSV_FILE_BYTES = 2 * 1024 * 1024;

const csvFileInterceptor = () =>
  FileInterceptor('file', {
    limits: {
      files: 1,
      fileSize: MAX_CSV_FILE_BYTES,
    },
  });

const csvUploadSchema = (enumValues: string[], defaultValue: string) => ({
  type: 'object' as const,
  required: ['file'],
  properties: {
    file: {
      type: 'string' as const,
      format: 'binary',
    },
    mode: {
      type: 'string' as const,
      enum: enumValues,
      default: defaultValue,
    },
  },
});

@ApiTags('Admin Catalog Import')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller({
  path: 'admin/catalog/import',
  version: '1',
})
export class CatalogCsvImportController {
  constructor(
    private readonly catalogCsvImportService: CatalogCsvImportService,
    private readonly catalogReferenceCsvImportService: CatalogReferenceCsvImportService,
  ) {}

  @Get('products/template')
  @ApiOperation({
    summary: 'Download the product CSV import template',
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'UTF-8 CSV template with a BOM for Excel compatibility',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="products-import-template.csv"',
  )
  downloadProductTemplate() {
    return new StreamableFile(this.catalogCsvImportService.getProductTemplate());
  }

  @Post('products/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({
    summary: 'Validate and preview a product CSV without writing to the database',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: csvUploadSchema(
      Object.values(ProductCsvImportMode),
      ProductCsvImportMode.CREATE_ONLY,
    ),
  })
  @ApiOkResponse({
    description: 'Parsed rows, validation errors, and missing references',
  })
  @ApiBadRequestResponse({
    description: 'The CSV file, encoding, headers, or rows are invalid',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  previewProducts(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewProductCsvImportDto,
  ) {
    return this.catalogCsvImportService.previewProducts(
      this.requireCsvFile(file),
      dto.mode ?? ProductCsvImportMode.CREATE_ONLY,
    );
  }

  @Post('products/execute')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({
    summary: 'Atomically create or update products from a validated CSV file',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: csvUploadSchema(
      Object.values(ProductCsvImportMode),
      ProductCsvImportMode.CREATE_ONLY,
    ),
  })
  @ApiOkResponse({
    description: 'Products were imported in one database transaction',
  })
  @ApiBadRequestResponse({
    description: 'The CSV contains invalid rows or changed references',
  })
  @ApiConflictResponse({
    description: 'A unique SKU or slug conflict occurred during import',
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  executeProducts(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewProductCsvImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogCsvImportService.executeProducts(
      this.requireCsvFile(file),
      dto.mode ?? ProductCsvImportMode.CREATE_ONLY,
      user.id,
    );
  }

  @Get('brands/template')
  @ApiOperation({
    summary: 'Download the brand CSV import template',
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'UTF-8 brand CSV template with a BOM',
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="brands-import-template.csv"',
  )
  downloadBrandTemplate() {
    return new StreamableFile(
      this.catalogReferenceCsvImportService.getBrandTemplate(),
    );
  }

  @Post('brands/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({
    summary: 'Validate and preview a brand CSV without database writes',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: csvUploadSchema(
      Object.values(CatalogReferenceCsvImportMode),
      CatalogReferenceCsvImportMode.CREATE_ONLY,
    ),
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  previewBrands(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewCatalogReferenceCsvImportDto,
  ) {
    return this.catalogReferenceCsvImportService.previewBrands(
      this.requireCsvFile(file),
      dto.mode ?? CatalogReferenceCsvImportMode.CREATE_ONLY,
    );
  }

  @Post('brands/execute')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({
    summary: 'Atomically create or update brands from CSV',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: csvUploadSchema(
      Object.values(CatalogReferenceCsvImportMode),
      CatalogReferenceCsvImportMode.CREATE_ONLY,
    ),
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  executeBrands(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewCatalogReferenceCsvImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogReferenceCsvImportService.executeBrands(
      this.requireCsvFile(file),
      dto.mode ?? CatalogReferenceCsvImportMode.CREATE_ONLY,
      user.id,
    );
  }

  @Get('categories/template')
  @ApiOperation({
    summary: 'Download the category CSV import template',
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'UTF-8 category CSV template with a BOM',
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="categories-import-template.csv"',
  )
  downloadCategoryTemplate() {
    return new StreamableFile(
      this.catalogReferenceCsvImportService.getCategoryTemplate(),
    );
  }

  @Post('categories/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({
    summary: 'Validate and preview a category CSV without database writes',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: csvUploadSchema(
      Object.values(CatalogReferenceCsvImportMode),
      CatalogReferenceCsvImportMode.CREATE_ONLY,
    ),
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  previewCategories(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewCatalogReferenceCsvImportDto,
  ) {
    return this.catalogReferenceCsvImportService.previewCategories(
      this.requireCsvFile(file),
      dto.mode ?? CatalogReferenceCsvImportMode.CREATE_ONLY,
    );
  }

  @Post('categories/execute')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(csvFileInterceptor())
  @ApiOperation({
    summary: 'Atomically create or update categories from CSV',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: csvUploadSchema(
      Object.values(CatalogReferenceCsvImportMode),
      CatalogReferenceCsvImportMode.CREATE_ONLY,
    ),
  })
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  executeCategories(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: PreviewCatalogReferenceCsvImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.catalogReferenceCsvImportService.executeCategories(
      this.requireCsvFile(file),
      dto.mode ?? CatalogReferenceCsvImportMode.CREATE_ONLY,
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
