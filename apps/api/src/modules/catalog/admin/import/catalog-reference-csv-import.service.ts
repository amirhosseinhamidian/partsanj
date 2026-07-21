import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { randomUUID } from 'node:crypto';
import { TextDecoder } from 'node:util';
import {
  AdminAuditAction,
  AdminAuditEntityType,
  Prisma,
} from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../database/prisma.service.js';
import { CatalogReferenceCsvImportMode } from './dto/catalog-reference-csv-import.dto.js';

const MAX_REFERENCE_CSV_ROWS = 500;
const MAX_NAME_LENGTH = 255;
const MAX_SLUG_LENGTH = 255;
const MAX_URL_LENGTH = 2_048;
const MAX_IMAGE_ALT_LENGTH = 255;
const NULL_SENTINEL = '__NULL__';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const BRAND_CSV_COLUMNS = [
  'name',
  'slug',
  'is_active',
  'logo_url',
] as const;

const REQUIRED_BRAND_CSV_COLUMNS = ['name', 'slug'] as const;

const CATEGORY_CSV_COLUMNS = [
  'name',
  'slug',
  'parent_slug',
  'is_active',
  'sort_order',
  'show_on_home',
  'image_url',
  'image_alt',
] as const;

const REQUIRED_CATEGORY_CSV_COLUMNS = ['name', 'slug'] as const;

type CsvRowAction = 'CREATE' | 'UPDATE';
type BrandCsvColumn = (typeof BRAND_CSV_COLUMNS)[number];
type CategoryCsvColumn = (typeof CATEGORY_CSV_COLUMNS)[number];
type ReferenceCsvColumn = BrandCsvColumn | CategoryCsvColumn;

type ReferenceCsvErrorCode =
  | 'REQUIRED_FIELD'
  | 'FIELD_TOO_LONG'
  | 'INVALID_SLUG'
  | 'INVALID_BOOLEAN'
  | 'INVALID_INTEGER'
  | 'INVALID_URL'
  | 'DUPLICATE_NAME_IN_FILE'
  | 'DUPLICATE_SLUG_IN_FILE'
  | 'NAME_ALREADY_EXISTS'
  | 'SLUG_ALREADY_EXISTS'
  | 'PARENT_NOT_FOUND'
  | 'SELF_PARENT'
  | 'CATEGORY_HIERARCHY_CYCLE';

type ReferenceCsvRowError = {
  code: ReferenceCsvErrorCode;
  field: ReferenceCsvColumn;
  value: string | null;
  message: string;
};

type RawBrandCsvRow = Partial<Record<BrandCsvColumn, string>>;
type RawCategoryCsvRow = Partial<Record<CategoryCsvColumn, string>>;

type ParsedBrandCsvRow = {
  rowNumber: number;
  raw: RawBrandCsvRow;
  name: string;
  slug: string;
  isActive: boolean | null;
  logoUrl: string | null;
  hasLogoUrlValue: boolean;
  errors: ReferenceCsvRowError[];
};

type ParsedCategoryCsvRow = {
  rowNumber: number;
  raw: RawCategoryCsvRow;
  name: string;
  slug: string;
  parentSlug: string | null;
  hasParentSlugValue: boolean;
  isActive: boolean | null;
  sortOrder: number | null;
  showOnHome: boolean | null;
  imageUrl: string | null;
  hasImageUrlValue: boolean;
  imageAlt: string | null;
  hasImageAltValue: boolean;
  errors: ReferenceCsvRowError[];
};

type ExistingBrand = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl: string | null;
};

type ExistingCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  showOnHome: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

type BrandAnalysis = {
  mode: CatalogReferenceCsvImportMode;
  parsedRows: ParsedBrandCsvRow[];
  existingBySlug: Map<string, ExistingBrand>;
  preview: {
    data: {
      entity: 'BRAND';
      mode: CatalogReferenceCsvImportMode;
      summary: {
        totalRows: number;
        validRows: number;
        invalidRows: number;
        createCount: number;
        updateCount: number;
      };
      rows: Array<{
        rowNumber: number;
        name: string;
        slug: string;
        isActive: boolean | null;
        logoUrl: string | null;
        action: CsvRowAction | null;
        valid: boolean;
        errors: ReferenceCsvRowError[];
      }>;
    };
  };
};

type CategoryAnalysis = {
  mode: CatalogReferenceCsvImportMode;
  parsedRows: ParsedCategoryCsvRow[];
  existingBySlug: Map<string, ExistingCategory>;
  existingById: Map<string, ExistingCategory>;
  preview: {
    data: {
      entity: 'CATEGORY';
      mode: CatalogReferenceCsvImportMode;
      summary: {
        totalRows: number;
        validRows: number;
        invalidRows: number;
        createCount: number;
        updateCount: number;
      };
      rows: Array<{
        rowNumber: number;
        name: string;
        slug: string;
        parentSlug: string | null;
        isActive: boolean | null;
        sortOrder: number | null;
        showOnHome: boolean | null;
        imageUrl: string | null;
        imageAlt: string | null;
        action: CsvRowAction | null;
        valid: boolean;
        errors: ReferenceCsvRowError[];
      }>;
    };
  };
};

@Injectable()
export class CatalogReferenceCsvImportService {
  constructor(private readonly prisma: PrismaService) {}

  getBrandTemplate(): Buffer {
    return this.buildCsvTemplate([
      BRAND_CSV_COLUMNS,
      ['فورس', 'force', 'true', ''],
      ['والئو', 'valeo', 'true', ''],
    ]);
  }

  getCategoryTemplate(): Buffer {
    return this.buildCsvTemplate([
      CATEGORY_CSV_COLUMNS,
      [
        'قطعات برق خودرو',
        'auto-electrical-parts',
        '',
        'true',
        '10',
        'true',
        '',
        '',
      ],
      [
        'قطعات دینام',
        'alternator-parts',
        'auto-electrical-parts',
        'true',
        '20',
        'false',
        '',
        '',
      ],
      [
        'آفتامات دینام',
        'alternator-regulators',
        'alternator-parts',
        'true',
        '30',
        'false',
        '',
        '',
      ],
    ]);
  }

  async previewBrands(
    file: Express.Multer.File,
    mode: CatalogReferenceCsvImportMode,
  ) {
    return (await this.analyzeBrands(file, mode)).preview;
  }

  async executeBrands(
    file: Express.Multer.File,
    mode: CatalogReferenceCsvImportMode,
    actorUserId: string,
  ) {
    const analysis = await this.analyzeBrands(file, mode);

    if (analysis.preview.data.summary.invalidRows > 0) {
      throw new BadRequestException({
        message: 'فایل برندها دارای ردیف نامعتبر است.',
        code: 'BRAND_CSV_IMPORT_INVALID_ROWS',
        preview: analysis.preview.data,
      });
    }

    const batchId = randomUUID();

    try {
      const importedBrands = await this.prisma.$transaction(
        async (transaction) => {
          const results: Array<{
            id: string;
            name: string;
            slug: string;
            action: CsvRowAction;
            rowNumber: number;
          }> = [];

          for (const row of analysis.parsedRows) {
            const existingBrand = analysis.existingBySlug.get(row.slug);
            const action: CsvRowAction = existingBrand ? 'UPDATE' : 'CREATE';

            if (action === 'CREATE') {
              const brand = await transaction.brand.create({
                data: {
                  name: row.name,
                  slug: row.slug,
                  isActive: row.isActive ?? true,
                  logoUrl: row.logoUrl,
                },
              });

              await transaction.adminAuditLog.create({
                data: {
                  actorUserId,
                  entityType: AdminAuditEntityType.BRAND,
                  entityId: brand.id,
                  entityLabel: brand.name,
                  action: AdminAuditAction.CREATED,
                  changes: this.toJson({
                    event: 'admin_brand_csv_import_created',
                    source: 'CSV_IMPORT',
                    batchId,
                    rowNumber: row.rowNumber,
                    snapshot: {
                      name: brand.name,
                      slug: brand.slug,
                      isActive: brand.isActive,
                      logoUrl: brand.logoUrl,
                    },
                  }),
                },
              });

              results.push({
                id: brand.id,
                name: brand.name,
                slug: brand.slug,
                action,
                rowNumber: row.rowNumber,
              });

              continue;
            }

            if (
              mode !== CatalogReferenceCsvImportMode.UPSERT ||
              !existingBrand
            ) {
              throw new BadRequestException({
                message: 'برند موجود فقط در حالت UPSERT قابل به‌روزرسانی است.',
                code: 'BRAND_CSV_IMPORT_MODE_MISMATCH',
                rowNumber: row.rowNumber,
                slug: row.slug,
              });
            }

            const brand = await transaction.brand.update({
              where: {
                id: existingBrand.id,
              },
              data: {
                name: row.name,
                ...(row.isActive !== null && {
                  isActive: row.isActive,
                }),
                ...(row.hasLogoUrlValue && {
                  logoUrl: row.logoUrl,
                }),
              },
            });

            await transaction.adminAuditLog.create({
              data: {
                actorUserId,
                entityType: AdminAuditEntityType.BRAND,
                entityId: brand.id,
                entityLabel: brand.name,
                action: AdminAuditAction.UPDATED,
                changes: this.toJson({
                  event: 'admin_brand_csv_import_updated',
                  source: 'CSV_IMPORT',
                  batchId,
                  rowNumber: row.rowNumber,
                  before: existingBrand,
                  after: {
                    name: brand.name,
                    slug: brand.slug,
                    isActive: brand.isActive,
                    logoUrl: brand.logoUrl,
                  },
                }),
              },
            });

            results.push({
              id: brand.id,
              name: brand.name,
              slug: brand.slug,
              action,
              rowNumber: row.rowNumber,
            });
          }

          return results;
        },
        {
          maxWait: 10_000,
          timeout: 60_000,
        },
      );

      return {
        data: {
          batchId,
          entity: 'BRAND' as const,
          mode,
          summary: {
            totalRows: importedBrands.length,
            createdCount: importedBrands.filter(
              (item) => item.action === 'CREATE',
            ).length,
            updatedCount: importedBrands.filter(
              (item) => item.action === 'UPDATE',
            ).length,
          },
          brands: importedBrands,
        },
      };
    } catch (error) {
      this.rethrowUniqueConflict(error, 'برند');
    }
  }

  async previewCategories(
    file: Express.Multer.File,
    mode: CatalogReferenceCsvImportMode,
  ) {
    return (await this.analyzeCategories(file, mode)).preview;
  }

  async executeCategories(
    file: Express.Multer.File,
    mode: CatalogReferenceCsvImportMode,
    actorUserId: string,
  ) {
    const analysis = await this.analyzeCategories(file, mode);

    if (analysis.preview.data.summary.invalidRows > 0) {
      throw new BadRequestException({
        message: 'فایل دسته‌بندی‌ها دارای ردیف نامعتبر است.',
        code: 'CATEGORY_CSV_IMPORT_INVALID_ROWS',
        preview: analysis.preview.data,
      });
    }

    const batchId = randomUUID();

    try {
      const importedCategories = await this.prisma.$transaction(
        async (transaction) => {
          const results: Array<{
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
            action: CsvRowAction;
            rowNumber: number;
          }> = [];

          const resolvedIds = new Map(
            Array.from(analysis.existingBySlug.entries()).map(
              ([slug, category]) => [slug, category.id],
            ),
          );

          const pendingRows = [...analysis.parsedRows];

          while (pendingRows.length > 0) {
            let progress = false;

            for (let index = pendingRows.length - 1; index >= 0; index -= 1) {
              const row = pendingRows[index];
              const existingCategory = analysis.existingBySlug.get(row.slug);
              const effectiveParentSlug = this.resolveEffectiveParentSlug(
                row,
                existingCategory,
                analysis.existingById,
                mode,
              );

              if (
                effectiveParentSlug !== null &&
                !resolvedIds.has(effectiveParentSlug)
              ) {
                continue;
              }

              const parentId = effectiveParentSlug
                ? (resolvedIds.get(effectiveParentSlug) ?? null)
                : null;
              const action: CsvRowAction = existingCategory
                ? 'UPDATE'
                : 'CREATE';

              if (action === 'CREATE') {
                const category = await transaction.category.create({
                  data: {
                    name: row.name,
                    slug: row.slug,
                    parentId,
                    isActive: row.isActive ?? true,
                    sortOrder: row.sortOrder ?? 0,
                    showOnHome: row.showOnHome ?? false,
                    imageUrl: row.imageUrl,
                    imageAlt: row.imageAlt,
                  },
                });

                await transaction.adminAuditLog.create({
                  data: {
                    actorUserId,
                    entityType: AdminAuditEntityType.CATEGORY,
                    entityId: category.id,
                    entityLabel: category.name,
                    action: AdminAuditAction.CREATED,
                    changes: this.toJson({
                      event: 'admin_category_csv_import_created',
                      source: 'CSV_IMPORT',
                      batchId,
                      rowNumber: row.rowNumber,
                      snapshot: {
                        name: category.name,
                        slug: category.slug,
                        parentId: category.parentId,
                        isActive: category.isActive,
                        sortOrder: category.sortOrder,
                        showOnHome: category.showOnHome,
                        imageUrl: category.imageUrl,
                        imageAlt: category.imageAlt,
                      },
                    }),
                  },
                });

                resolvedIds.set(category.slug, category.id);
                results.push({
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  parentId: category.parentId,
                  action,
                  rowNumber: row.rowNumber,
                });
              } else {
                if (
                  mode !== CatalogReferenceCsvImportMode.UPSERT ||
                  !existingCategory
                ) {
                  throw new BadRequestException({
                    message:
                      'دسته‌بندی موجود فقط در حالت UPSERT قابل به‌روزرسانی است.',
                    code: 'CATEGORY_CSV_IMPORT_MODE_MISMATCH',
                    rowNumber: row.rowNumber,
                    slug: row.slug,
                  });
                }

                const category = await transaction.category.update({
                  where: {
                    id: existingCategory.id,
                  },
                  data: {
                    name: row.name,
                    ...(row.hasParentSlugValue && {
                      parentId,
                    }),
                    ...(row.isActive !== null && {
                      isActive: row.isActive,
                    }),
                    ...(row.sortOrder !== null && {
                      sortOrder: row.sortOrder,
                    }),
                    ...(row.showOnHome !== null && {
                      showOnHome: row.showOnHome,
                    }),
                    ...(row.hasImageUrlValue && {
                      imageUrl: row.imageUrl,
                    }),
                    ...(row.hasImageAltValue && {
                      imageAlt: row.imageAlt,
                    }),
                  },
                });

                await transaction.adminAuditLog.create({
                  data: {
                    actorUserId,
                    entityType: AdminAuditEntityType.CATEGORY,
                    entityId: category.id,
                    entityLabel: category.name,
                    action: AdminAuditAction.UPDATED,
                    changes: this.toJson({
                      event: 'admin_category_csv_import_updated',
                      source: 'CSV_IMPORT',
                      batchId,
                      rowNumber: row.rowNumber,
                      before: existingCategory,
                      after: {
                        name: category.name,
                        slug: category.slug,
                        parentId: category.parentId,
                        isActive: category.isActive,
                        sortOrder: category.sortOrder,
                        showOnHome: category.showOnHome,
                        imageUrl: category.imageUrl,
                        imageAlt: category.imageAlt,
                      },
                    }),
                  },
                });

                resolvedIds.set(category.slug, category.id);
                results.push({
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  parentId: category.parentId,
                  action,
                  rowNumber: row.rowNumber,
                });
              }

              pendingRows.splice(index, 1);
              progress = true;
            }

            if (!progress) {
              throw new BadRequestException({
                message:
                  'ترتیب والد و فرزند دسته‌بندی‌ها قابل حل نیست. ساختار سلسله‌مراتبی را بررسی کنید.',
                code: 'CATEGORY_CSV_IMPORT_UNRESOLVED_HIERARCHY',
                rows: pendingRows.map((row) => ({
                  rowNumber: row.rowNumber,
                  slug: row.slug,
                  parentSlug: row.parentSlug,
                })),
              });
            }
          }

          return results.sort((left, right) => left.rowNumber - right.rowNumber);
        },
        {
          maxWait: 10_000,
          timeout: 60_000,
        },
      );

      return {
        data: {
          batchId,
          entity: 'CATEGORY' as const,
          mode,
          summary: {
            totalRows: importedCategories.length,
            createdCount: importedCategories.filter(
              (item) => item.action === 'CREATE',
            ).length,
            updatedCount: importedCategories.filter(
              (item) => item.action === 'UPDATE',
            ).length,
          },
          categories: importedCategories,
        },
      };
    } catch (error) {
      this.rethrowUniqueConflict(error, 'دسته‌بندی');
    }
  }

  private async analyzeBrands(
    file: Express.Multer.File,
    mode: CatalogReferenceCsvImportMode,
  ): Promise<BrandAnalysis> {
    this.assertCsvFile(file);

    const matrix = this.parseCsvMatrix(file.buffer);
    const { headers, rows } = this.extractAndValidateRows(
      matrix,
      BRAND_CSV_COLUMNS,
      REQUIRED_BRAND_CSV_COLUMNS,
      'برند',
    );

    const parsedRows = rows.map((row, index) =>
      this.parseBrandRow(row, headers, index + 2),
    );

    this.addBrandWithinFileDuplicateErrors(parsedRows);

    const names = this.uniqueNonEmpty(parsedRows.map((row) => row.name));
    const slugs = this.uniqueNonEmpty(parsedRows.map((row) => row.slug));

    const existingBrands = await this.prisma.brand.findMany({
      where: {
        OR: [
          {
            name: {
              in: names,
            },
          },
          {
            slug: {
              in: slugs,
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        logoUrl: true,
      },
    });

    const existingByName = new Map(
      existingBrands.map((brand) => [brand.name, brand]),
    );
    const existingBySlug = new Map(
      existingBrands.map((brand) => [brand.slug, brand]),
    );

    const previewRows = parsedRows.map((row) => {
      const existingByCurrentSlug = existingBySlug.get(row.slug);
      const existingByCurrentName = existingByName.get(row.name);

      if (mode === CatalogReferenceCsvImportMode.CREATE_ONLY) {
        if (existingByCurrentSlug) {
          this.addRowError(row, {
            code: 'SLUG_ALREADY_EXISTS',
            field: 'slug',
            value: row.slug,
            message: `برندی با slug برابر «${row.slug}» از قبل وجود دارد.`,
          });
        }

        if (existingByCurrentName) {
          this.addRowError(row, {
            code: 'NAME_ALREADY_EXISTS',
            field: 'name',
            value: row.name,
            message: `برندی با نام «${row.name}» از قبل وجود دارد.`,
          });
        }
      } else if (
        existingByCurrentName &&
        existingByCurrentName.id !== existingByCurrentSlug?.id
      ) {
        this.addRowError(row, {
          code: 'NAME_ALREADY_EXISTS',
          field: 'name',
          value: row.name,
          message: `نام «${row.name}» متعلق به برند دیگری است.`,
        });
      }

      const action: CsvRowAction = existingByCurrentSlug ? 'UPDATE' : 'CREATE';
      const valid = row.errors.length === 0;

      return {
        rowNumber: row.rowNumber,
        name: row.name,
        slug: row.slug,
        isActive: row.isActive,
        logoUrl: row.logoUrl,
        action: valid ? action : null,
        valid,
        errors: row.errors,
      };
    });

    return {
      mode,
      parsedRows,
      existingBySlug,
      preview: {
        data: {
          entity: 'BRAND',
          mode,
          summary: this.buildSummary(previewRows),
          rows: previewRows,
        },
      },
    };
  }

  private async analyzeCategories(
    file: Express.Multer.File,
    mode: CatalogReferenceCsvImportMode,
  ): Promise<CategoryAnalysis> {
    this.assertCsvFile(file);

    const matrix = this.parseCsvMatrix(file.buffer);
    const { headers, rows } = this.extractAndValidateRows(
      matrix,
      CATEGORY_CSV_COLUMNS,
      REQUIRED_CATEGORY_CSV_COLUMNS,
      'دسته‌بندی',
    );

    const parsedRows = rows.map((row, index) =>
      this.parseCategoryRow(row, headers, index + 2),
    );

    this.addCategoryWithinFileDuplicateErrors(parsedRows);

    const existingCategories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        isActive: true,
        sortOrder: true,
        showOnHome: true,
        imageUrl: true,
        imageAlt: true,
      },
    });

    const existingBySlug = new Map(
      existingCategories.map((category) => [category.slug, category]),
    );
    const existingById = new Map(
      existingCategories.map((category) => [category.id, category]),
    );
    const rowsBySlug = new Map(parsedRows.map((row) => [row.slug, row]));

    for (const row of parsedRows) {
      const existingCategory = existingBySlug.get(row.slug);

      if (
        mode === CatalogReferenceCsvImportMode.CREATE_ONLY &&
        existingCategory
      ) {
        this.addRowError(row, {
          code: 'SLUG_ALREADY_EXISTS',
          field: 'slug',
          value: row.slug,
          message: `دسته‌بندی با slug برابر «${row.slug}» از قبل وجود دارد.`,
        });
      }

      if (row.parentSlug === row.slug) {
        this.addRowError(row, {
          code: 'SELF_PARENT',
          field: 'parent_slug',
          value: row.parentSlug,
          message: 'یک دسته‌بندی نمی‌تواند والد خودش باشد.',
        });
      }

      if (
        row.parentSlug &&
        !existingBySlug.has(row.parentSlug) &&
        !rowsBySlug.has(row.parentSlug)
      ) {
        this.addRowError(row, {
          code: 'PARENT_NOT_FOUND',
          field: 'parent_slug',
          value: row.parentSlug,
          message: `دسته‌بندی والد با slug برابر «${row.parentSlug}» پیدا نشد.`,
        });
      }
    }

    this.addCategoryCycleErrors(
      parsedRows,
      existingBySlug,
      existingById,
      mode,
    );

    const previewRows = parsedRows.map((row) => {
      const action: CsvRowAction = existingBySlug.has(row.slug)
        ? 'UPDATE'
        : 'CREATE';
      const valid = row.errors.length === 0;

      return {
        rowNumber: row.rowNumber,
        name: row.name,
        slug: row.slug,
        parentSlug: row.parentSlug,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
        showOnHome: row.showOnHome,
        imageUrl: row.imageUrl,
        imageAlt: row.imageAlt,
        action: valid ? action : null,
        valid,
        errors: row.errors,
      };
    });

    return {
      mode,
      parsedRows,
      existingBySlug,
      existingById,
      preview: {
        data: {
          entity: 'CATEGORY',
          mode,
          summary: this.buildSummary(previewRows),
          rows: previewRows,
        },
      },
    };
  }

  private parseBrandRow(
    cells: string[],
    headers: BrandCsvColumn[],
    rowNumber: number,
  ): ParsedBrandCsvRow {
    const raw = this.rowToObject(cells, headers) as RawBrandCsvRow;
    const errors: ReferenceCsvRowError[] = [];
    const name = this.cleanText(raw.name);
    const slug = this.cleanText(raw.slug).toLowerCase();
    const isActive = this.parseBoolean(raw.is_active, 'is_active', errors);
    const logoUrlValue = this.parseNullableText(raw.logo_url, {
      field: 'logo_url',
      maxLength: MAX_URL_LENGTH,
      errors,
    });

    this.validateRequiredText(name, 'name', MAX_NAME_LENGTH, errors);
    this.validateSlug(slug, 'slug', errors);

    if (logoUrlValue.hasValue && logoUrlValue.value !== null) {
      this.validateUrl(logoUrlValue.value, 'logo_url', errors);
    }

    return {
      rowNumber,
      raw,
      name,
      slug,
      isActive,
      logoUrl: logoUrlValue.value,
      hasLogoUrlValue: logoUrlValue.hasValue,
      errors,
    };
  }

  private parseCategoryRow(
    cells: string[],
    headers: CategoryCsvColumn[],
    rowNumber: number,
  ): ParsedCategoryCsvRow {
    const raw = this.rowToObject(cells, headers) as RawCategoryCsvRow;
    const errors: ReferenceCsvRowError[] = [];
    const name = this.cleanText(raw.name);
    const slug = this.cleanText(raw.slug).toLowerCase();
    const parentSlugValue = this.parseNullableText(raw.parent_slug, {
      field: 'parent_slug',
      maxLength: MAX_SLUG_LENGTH,
      lowercase: true,
      errors,
    });
    const isActive = this.parseBoolean(raw.is_active, 'is_active', errors);
    const sortOrder = this.parseInteger(raw.sort_order, 'sort_order', errors);
    const showOnHome = this.parseBoolean(
      raw.show_on_home,
      'show_on_home',
      errors,
    );
    const imageUrlValue = this.parseNullableText(raw.image_url, {
      field: 'image_url',
      maxLength: MAX_URL_LENGTH,
      errors,
    });
    const imageAltValue = this.parseNullableText(raw.image_alt, {
      field: 'image_alt',
      maxLength: MAX_IMAGE_ALT_LENGTH,
      errors,
    });

    this.validateRequiredText(name, 'name', MAX_NAME_LENGTH, errors);
    this.validateSlug(slug, 'slug', errors);

    if (parentSlugValue.value !== null) {
      this.validateSlug(parentSlugValue.value, 'parent_slug', errors);
    }

    if (imageUrlValue.hasValue && imageUrlValue.value !== null) {
      this.validateUrl(imageUrlValue.value, 'image_url', errors);
    }

    return {
      rowNumber,
      raw,
      name,
      slug,
      parentSlug: parentSlugValue.value,
      hasParentSlugValue: parentSlugValue.hasValue,
      isActive,
      sortOrder,
      showOnHome,
      imageUrl: imageUrlValue.value,
      hasImageUrlValue: imageUrlValue.hasValue,
      imageAlt: imageAltValue.value,
      hasImageAltValue: imageAltValue.hasValue,
      errors,
    };
  }

  private addBrandWithinFileDuplicateErrors(rows: ParsedBrandCsvRow[]) {
    this.addDuplicateErrors(rows, 'name', 'DUPLICATE_NAME_IN_FILE');
    this.addDuplicateErrors(rows, 'slug', 'DUPLICATE_SLUG_IN_FILE');
  }

  private addCategoryWithinFileDuplicateErrors(rows: ParsedCategoryCsvRow[]) {
    this.addDuplicateErrors(rows, 'slug', 'DUPLICATE_SLUG_IN_FILE');
  }

  private addDuplicateErrors<
    TRow extends {
      rowNumber: number;
      errors: ReferenceCsvRowError[];
    },
    TField extends keyof TRow,
  >(
    rows: TRow[],
    field: TField,
    code: 'DUPLICATE_NAME_IN_FILE' | 'DUPLICATE_SLUG_IN_FILE',
  ) {
    const positions = new Map<string, number[]>();

    for (const row of rows) {
      const value = row[field];

      if (typeof value !== 'string' || !value) {
        continue;
      }

      const current = positions.get(value) ?? [];
      current.push(row.rowNumber);
      positions.set(value, current);
    }

    for (const row of rows) {
      const value = row[field];

      if (typeof value !== 'string' || !value) {
        continue;
      }

      const duplicateRows = positions.get(value) ?? [];

      if (duplicateRows.length < 2) {
        continue;
      }

      this.addRowError(row, {
        code,
        field: String(field) as ReferenceCsvColumn,
        value,
        message: `مقدار «${value}» در ردیف‌های ${duplicateRows.join('، ')} تکرار شده است.`,
      });
    }
  }

  private addCategoryCycleErrors(
    rows: ParsedCategoryCsvRow[],
    existingBySlug: Map<string, ExistingCategory>,
    existingById: Map<string, ExistingCategory>,
    mode: CatalogReferenceCsvImportMode,
  ) {
    const parentBySlug = new Map<string, string | null>();

    for (const category of existingBySlug.values()) {
      const parent = category.parentId
        ? existingById.get(category.parentId)
        : undefined;

      parentBySlug.set(category.slug, parent?.slug ?? null);
    }

    for (const row of rows) {
      const existingCategory = existingBySlug.get(row.slug);
      const effectiveParentSlug = this.resolveEffectiveParentSlug(
        row,
        existingCategory,
        existingById,
        mode,
      );

      parentBySlug.set(row.slug, effectiveParentSlug);
    }

    const cycleMembers = new Set<string>();

    for (const startSlug of parentBySlug.keys()) {
      const path: string[] = [];
      const positionBySlug = new Map<string, number>();
      let currentSlug: string | null = startSlug;

      while (currentSlug && parentBySlug.has(currentSlug)) {
        const previousPosition = positionBySlug.get(currentSlug);

        if (previousPosition !== undefined) {
          for (const slug of path.slice(previousPosition)) {
            cycleMembers.add(slug);
          }
          break;
        }

        positionBySlug.set(currentSlug, path.length);
        path.push(currentSlug);
        currentSlug = parentBySlug.get(currentSlug) ?? null;
      }
    }

    for (const row of rows) {
      if (!cycleMembers.has(row.slug)) {
        continue;
      }

      this.addRowError(row, {
        code: 'CATEGORY_HIERARCHY_CYCLE',
        field: 'parent_slug',
        value: row.parentSlug,
        message: 'این رابطه والد و فرزند باعث ایجاد چرخه در دسته‌بندی‌ها می‌شود.',
      });
    }
  }

  private resolveEffectiveParentSlug(
    row: ParsedCategoryCsvRow,
    existingCategory: ExistingCategory | undefined,
    existingById: Map<string, ExistingCategory>,
    mode: CatalogReferenceCsvImportMode,
  ): string | null {
    if (
      mode === CatalogReferenceCsvImportMode.UPSERT &&
      existingCategory &&
      !row.hasParentSlugValue
    ) {
      return existingCategory.parentId
        ? (existingById.get(existingCategory.parentId)?.slug ?? null)
        : null;
    }

    return row.parentSlug;
  }

  private extractAndValidateRows<TColumn extends string>(
    matrix: string[][],
    allowedColumns: readonly TColumn[],
    requiredColumns: readonly TColumn[],
    entityLabel: string,
  ): {
    headers: TColumn[];
    rows: string[][];
  } {
    if (matrix.length === 0) {
      throw new BadRequestException('فایل CSV خالی است.');
    }

    const headers = matrix[0].map((header) =>
      this.normalizeHeader(header),
    );
    const duplicateHeaders = this.findDuplicates(headers);

    if (duplicateHeaders.length > 0) {
      throw new BadRequestException(
        `ستون‌های تکراری در فایل وجود دارد: ${duplicateHeaders.join('، ')}`,
      );
    }

    const allowed = new Set<string>(allowedColumns);
    const unknownHeaders = headers.filter((header) => !allowed.has(header));

    if (unknownHeaders.length > 0) {
      throw new BadRequestException(
        `ستون‌های ناشناخته برای ${entityLabel}: ${unknownHeaders.join('، ')}`,
      );
    }

    const missingHeaders = requiredColumns.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `ستون‌های اجباری وجود ندارند: ${missingHeaders.join('، ')}`,
      );
    }

    const rows = matrix.slice(1);

    if (rows.length === 0) {
      throw new BadRequestException(
        `هیچ ردیفی برای ورود ${entityLabel} در فایل وجود ندارد.`,
      );
    }

    if (rows.length > MAX_REFERENCE_CSV_ROWS) {
      throw new BadRequestException(
        `حداکثر ${MAX_REFERENCE_CSV_ROWS} ردیف در هر فایل پذیرفته می‌شود.`,
      );
    }

    return {
      headers: headers as TColumn[],
      rows,
    };
  }

  private parseCsvMatrix(buffer: Buffer): string[][] {
    let csvText: string;

    try {
      csvText = new TextDecoder('utf-8', {
        fatal: true,
      }).decode(buffer);
    } catch {
      throw new BadRequestException(
        'Encoding فایل معتبر نیست. فایل را با فرمت UTF-8 CSV ذخیره کنید.',
      );
    }

    if (csvText.includes('\0')) {
      throw new BadRequestException('محتوای فایل CSV معتبر نیست.');
    }

    try {
      const records = parse(csvText, {
        bom: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: false,
      }) as string[][];

      return records.filter((row) =>
        row.some((cell) => String(cell).trim().length > 0),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'CSV parse failed';

      throw new BadRequestException(`ساختار فایل CSV معتبر نیست: ${message}`);
    }
  }

  private rowToObject<TColumn extends string>(
    cells: string[],
    headers: TColumn[],
  ): Partial<Record<TColumn, string>> {
    return Object.fromEntries(
      headers.map((header, index) => [header, cells[index] ?? '']),
    ) as Partial<Record<TColumn, string>>;
  }

  private parseBoolean(
    rawValue: string | undefined,
    field: ReferenceCsvColumn,
    errors: ReferenceCsvRowError[],
  ): boolean | null {
    const value = this.cleanText(rawValue).toLowerCase();

    if (!value) {
      return null;
    }

    const trueValues = new Set([
      'true',
      '1',
      'yes',
      'y',
      'active',
      'بله',
      'فعال',
    ]);
    const falseValues = new Set([
      'false',
      '0',
      'no',
      'n',
      'inactive',
      'خیر',
      'غیرفعال',
    ]);

    if (trueValues.has(value)) {
      return true;
    }

    if (falseValues.has(value)) {
      return false;
    }

    errors.push({
      code: 'INVALID_BOOLEAN',
      field,
      value,
      message: `مقدار ستون ${field} باید true یا false باشد.`,
    });

    return null;
  }

  private parseInteger(
    rawValue: string | undefined,
    field: ReferenceCsvColumn,
    errors: ReferenceCsvRowError[],
  ): number | null {
    const value = this.toLatinDigits(this.cleanText(rawValue));

    if (!value) {
      return null;
    }

    if (!/^\d+$/.test(value)) {
      errors.push({
        code: 'INVALID_INTEGER',
        field,
        value,
        message: `مقدار ستون ${field} باید عدد صحیح غیرمنفی باشد.`,
      });

      return null;
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed)) {
      errors.push({
        code: 'INVALID_INTEGER',
        field,
        value,
        message: `مقدار ستون ${field} از محدوده مجاز خارج است.`,
      });

      return null;
    }

    return parsed;
  }

  private parseNullableText(
    rawValue: string | undefined,
    options: {
      field: ReferenceCsvColumn;
      maxLength: number;
      lowercase?: boolean;
      errors: ReferenceCsvRowError[];
    },
  ): {
    value: string | null;
    hasValue: boolean;
  } {
    const cleaned = this.cleanText(rawValue);

    if (!cleaned) {
      return {
        value: null,
        hasValue: false,
      };
    }

    if (cleaned.toUpperCase() === NULL_SENTINEL) {
      return {
        value: null,
        hasValue: true,
      };
    }

    const value = options.lowercase ? cleaned.toLowerCase() : cleaned;

    if (value.length > options.maxLength) {
      options.errors.push({
        code: 'FIELD_TOO_LONG',
        field: options.field,
        value,
        message: `طول ستون ${options.field} نباید بیشتر از ${options.maxLength} کاراکتر باشد.`,
      });
    }

    return {
      value,
      hasValue: true,
    };
  }

  private validateRequiredText(
    value: string,
    field: ReferenceCsvColumn,
    maxLength: number,
    errors: ReferenceCsvRowError[],
  ) {
    if (!value) {
      errors.push({
        code: 'REQUIRED_FIELD',
        field,
        value: null,
        message: `ستون ${field} اجباری است.`,
      });
      return;
    }

    if (value.length > maxLength) {
      errors.push({
        code: 'FIELD_TOO_LONG',
        field,
        value,
        message: `طول ستون ${field} نباید بیشتر از ${maxLength} کاراکتر باشد.`,
      });
    }
  }

  private validateSlug(
    value: string,
    field: 'slug' | 'parent_slug',
    errors: ReferenceCsvRowError[],
  ) {
    if (!value) {
      if (field === 'slug') {
        errors.push({
          code: 'REQUIRED_FIELD',
          field,
          value: null,
          message: 'ستون slug اجباری است.',
        });
      }
      return;
    }

    if (value.length > MAX_SLUG_LENGTH) {
      errors.push({
        code: 'FIELD_TOO_LONG',
        field,
        value,
        message: `طول slug نباید بیشتر از ${MAX_SLUG_LENGTH} کاراکتر باشد.`,
      });
    }

    if (!SLUG_PATTERN.test(value)) {
      errors.push({
        code: 'INVALID_SLUG',
        field,
        value,
        message:
          'slug فقط می‌تواند شامل حروف کوچک لاتین، عدد و خط تیره باشد.',
      });
    }
  }

  private validateUrl(
    value: string,
    field: 'logo_url' | 'image_url',
    errors: ReferenceCsvRowError[],
  ) {
    if (value.startsWith('/')) {
      return;
    }

    try {
      const url = new URL(value);

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Unsupported protocol');
      }
    } catch {
      errors.push({
        code: 'INVALID_URL',
        field,
        value,
        message: `آدرس ستون ${field} باید یک URL معتبر یا مسیر داخلی با / باشد.`,
      });
    }
  }

  private buildSummary(
    rows: Array<{
      action: CsvRowAction | null;
      valid: boolean;
    }>,
  ) {
    return {
      totalRows: rows.length,
      validRows: rows.filter((row) => row.valid).length,
      invalidRows: rows.filter((row) => !row.valid).length,
      createCount: rows.filter(
        (row) => row.valid && row.action === 'CREATE',
      ).length,
      updateCount: rows.filter(
        (row) => row.valid && row.action === 'UPDATE',
      ).length,
    };
  }

  private addRowError(
    row: {
      errors: ReferenceCsvRowError[];
    },
    error: ReferenceCsvRowError,
  ) {
    const alreadyExists = row.errors.some(
      (current) =>
        current.code === error.code &&
        current.field === error.field &&
        current.value === error.value,
    );

    if (!alreadyExists) {
      row.errors.push(error);
    }
  }

  private assertCsvFile(file: Express.Multer.File) {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('فقط فایل با پسوند CSV پذیرفته می‌شود.');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('فایل CSV خالی است.');
    }
  }

  private buildCsvTemplate(rows: readonly (readonly unknown[])[]): Buffer {
    const csv = rows
      .map((row) =>
        row.map((value) => this.escapeCsvCell(String(value))).join(','),
      )
      .join('\r\n');

    return Buffer.from(`\uFEFF${csv}\r\n`, 'utf8');
  }

  private escapeCsvCell(value: string) {
    if (!/[",\r\n]/.test(value)) {
      return value;
    }

    return `"${value.replaceAll('"', '""')}"`;
  }

  private normalizeHeader(value: string) {
    return value.replace(/^\uFEFF/, '').trim().toLowerCase();
  }

  private cleanText(value: string | undefined) {
    return String(value ?? '').trim();
  }

  private toLatinDigits(value: string) {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

    return value
      .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
  }

  private uniqueNonEmpty(values: string[]) {
    return [...new Set(values.filter(Boolean))];
  }

  private findDuplicates(values: string[]) {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const value of values) {
      if (seen.has(value)) {
        duplicates.add(value);
      }

      seen.add(value);
    }

    return [...duplicates];
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new BadRequestException('امکان تبدیل مقدار به JSON وجود ندارد.');
    }

    return JSON.parse(serialized) as Prisma.InputJsonValue;
  }

  private rethrowUniqueConflict(error: unknown, entityLabel: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        message: `هنگام ثبت CSV ${entityLabel}، مقدار یکتای تکراری ایجاد شد.`,
        code: 'REFERENCE_CSV_IMPORT_UNIQUE_CONFLICT',
        target: error.meta?.target ?? null,
      });
    }

    throw error;
  }
}
