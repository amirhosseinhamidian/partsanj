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
  VehicleYearCalendar,
} from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../database/prisma.service.js';
import { VehicleCsvImportMode } from './dto/vehicle-csv-import.dto.js';

const MAX_CSV_ROWS = 500;
const MAX_NAME_LENGTH = 160;
const MAX_SLUG_LENGTH = 180;
const MAX_URL_LENGTH = 2_048;
const MAX_ENGINE_CODE_LENGTH = 100;
const MAX_ENGINE_NAME_LENGTH = 160;
const MAX_NOTES_LENGTH = 2_000;
const NULL_SENTINEL = '__NULL__';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAKE_COLUMNS = [
  'name',
  'slug',
  'is_active',
  'sort_order',
  'logo_url',
] as const;

const MODEL_COLUMNS = [
  'make_slug',
  'make_name',
  'name',
  'slug',
  'is_active',
  'sort_order',
  'image_url',
] as const;

const VARIANT_COLUMNS = [
  'make_slug',
  'make_name',
  'model_slug',
  'model_name',
  'name',
  'slug',
  'engine_code',
  'engine_name',
  'year_from',
  'year_to',
  'year_calendar',
  'notes',
  'is_active',
  'sort_order',
] as const;

const REQUIRED_MAKE_COLUMNS = ['name', 'slug'] as const;
const REQUIRED_MODEL_COLUMNS = ['make_slug', 'name', 'slug'] as const;
const REQUIRED_VARIANT_COLUMNS = [
  'make_slug',
  'model_slug',
  'name',
  'slug',
] as const;

type CsvAction = 'CREATE' | 'UPDATE';
type MakeColumn = (typeof MAKE_COLUMNS)[number];
type ModelColumn = (typeof MODEL_COLUMNS)[number];
type VariantColumn = (typeof VARIANT_COLUMNS)[number];
type VehicleColumn = MakeColumn | ModelColumn | VariantColumn;

type CsvErrorCode =
  | 'REQUIRED_FIELD'
  | 'FIELD_TOO_LONG'
  | 'INVALID_SLUG'
  | 'INVALID_BOOLEAN'
  | 'INVALID_INTEGER'
  | 'INVALID_URL'
  | 'INVALID_YEAR_CALENDAR'
  | 'INVALID_YEAR_RANGE'
  | 'DUPLICATE_NAME_IN_FILE'
  | 'DUPLICATE_SLUG_IN_FILE'
  | 'NAME_ALREADY_EXISTS'
  | 'SLUG_ALREADY_EXISTS'
  | 'ENTITY_ALREADY_EXISTS'
  | 'VEHICLE_MAKE_NOT_FOUND'
  | 'VEHICLE_MAKE_INACTIVE'
  | 'VEHICLE_MODEL_NOT_FOUND'
  | 'VEHICLE_MODEL_INACTIVE'
  | 'VEHICLE_MODEL_MAKE_MISMATCH'
  | 'PARENT_CHANGE_NOT_ALLOWED';

type RowError = {
  code: CsvErrorCode;
  field: VehicleColumn;
  value: string | null;
  message: string;
};

type OptionalValue<T> = {
  provided: boolean;
  value: T | null;
};

type ExistingMake = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

type ExistingModel = {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  make: ExistingMake;
};

type ExistingVariant = {
  id: string;
  modelId: string;
  name: string;
  slug: string;
  engineCode: string | null;
  engineName: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  yearCalendar: VehicleYearCalendar;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
  model: ExistingModel;
};

type ParsedMakeRow = {
  rowNumber: number;
  name: string;
  slug: string;
  isActive: boolean | null;
  sortOrder: number | null;
  logoUrl: OptionalValue<string>;
  errors: RowError[];
};

type ParsedModelRow = {
  rowNumber: number;
  makeSlug: string;
  makeName: string;
  name: string;
  slug: string;
  isActive: boolean | null;
  sortOrder: number | null;
  imageUrl: OptionalValue<string>;
  errors: RowError[];
};

type ParsedVariantRow = {
  rowNumber: number;
  makeSlug: string;
  makeName: string;
  modelSlug: string;
  modelName: string;
  name: string;
  slug: string;
  engineCode: OptionalValue<string>;
  engineName: OptionalValue<string>;
  yearFrom: OptionalValue<number>;
  yearTo: OptionalValue<number>;
  yearCalendar: VehicleYearCalendar | null;
  notes: OptionalValue<string>;
  isActive: boolean | null;
  sortOrder: number | null;
  errors: RowError[];
};

type MissingMakeReference = {
  slug: string;
  affectedRows: number[];
  suggestedNames: string[];
  canCreate: boolean;
};

type MissingModelReference = {
  slug: string;
  makeSlug: string;
  affectedRows: number[];
  suggestedNames: string[];
  canCreate: boolean;
};

@Injectable()
export class VehicleCsvImportService {
  constructor(private readonly prisma: PrismaService) {}

  getMakesTemplate(): Buffer {
    return this.buildTemplate([
      MAKE_COLUMNS,
      ['سایپا', 'saipa', 'true', '10', ''],
      ['ایران خودرو', 'iran-khodro', 'true', '20', ''],
    ]);
  }

  getModelsTemplate(): Buffer {
    return this.buildTemplate([
      MODEL_COLUMNS,
      ['saipa', 'سایپا', 'پراید', 'pride', 'true', '10', ''],
      ['iran-khodro', 'ایران خودرو', 'پژو 405', 'peugeot-405', 'true', '20', ''],
    ]);
  }

  getVariantsTemplate(): Buffer {
    return this.buildTemplate([
      VARIANT_COLUMNS,
      [
        'saipa',
        'سایپا',
        'pride',
        'پراید',
        'پراید انژکتور',
        'pride-injector',
        '',
        'M13',
        '1382',
        '1391',
        'SHAMSI',
        '',
        'true',
        '10',
      ],
      [
        'iran-khodro',
        'ایران خودرو',
        'peugeot-405',
        'پژو 405',
        'پژو 405 موتور XU7',
        'peugeot-405-xu7',
        'XU7',
        'XU7JP',
        '1375',
        '',
        'SHAMSI',
        '',
        'true',
        '20',
      ],
    ]);
  }

  async previewMakes(file: Express.Multer.File, mode: VehicleCsvImportMode) {
    return (await this.analyzeMakes(file, mode)).preview;
  }

  async previewModels(file: Express.Multer.File, mode: VehicleCsvImportMode) {
    return (await this.analyzeModels(file, mode)).preview;
  }

  async previewVariants(file: Express.Multer.File, mode: VehicleCsvImportMode) {
    return (await this.analyzeVariants(file, mode)).preview;
  }

  async executeMakes(
    file: Express.Multer.File,
    mode: VehicleCsvImportMode,
    actorUserId: string,
  ) {
    const analysis = await this.analyzeMakes(file, mode);

    this.assertValidPreview(
      analysis.preview.data.summary.invalidRows,
      'فایل برندهای خودرو دارای ردیف نامعتبر است.',
      'VEHICLE_MAKE_CSV_IMPORT_INVALID_ROWS',
      analysis.preview.data,
    );

    const batchId = randomUUID();

    try {
      const makes = await this.prisma.$transaction(async (transaction) => {
        const results: Array<{
          id: string;
          name: string;
          slug: string;
          action: CsvAction;
          rowNumber: number;
        }> = [];

        for (const row of analysis.rows) {
          const existing = analysis.existingBySlug.get(row.slug);
          const action: CsvAction = existing ? 'UPDATE' : 'CREATE';

          if (!existing) {
            const created = await transaction.vehicleMake.create({
              data: {
                name: row.name,
                slug: row.slug,
                isActive: row.isActive ?? true,
                sortOrder: row.sortOrder ?? 0,
                logoUrl: row.logoUrl.value,
              },
            });

            await this.writeAudit(transaction, {
              actorUserId,
              entityType: AdminAuditEntityType.VEHICLE_MAKE,
              entityId: created.id,
              entityLabel: created.name,
              action: AdminAuditAction.CREATED,
              changes: {
                event: 'admin_vehicle_make_csv_import_created',
                source: 'CSV_IMPORT',
                batchId,
                rowNumber: row.rowNumber,
                snapshot: this.makeSnapshot(created),
              },
            });

            results.push({
              id: created.id,
              name: created.name,
              slug: created.slug,
              action,
              rowNumber: row.rowNumber,
            });
            continue;
          }

          if (mode !== VehicleCsvImportMode.UPSERT) {
            throw new BadRequestException('برند موجود فقط در حالت UPSERT قابل تغییر است.');
          }

          const updated = await transaction.vehicleMake.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              ...(row.isActive !== null && { isActive: row.isActive }),
              ...(row.sortOrder !== null && { sortOrder: row.sortOrder }),
              ...(row.logoUrl.provided && { logoUrl: row.logoUrl.value }),
            },
          });

          await this.writeAudit(transaction, {
            actorUserId,
            entityType: AdminAuditEntityType.VEHICLE_MAKE,
            entityId: updated.id,
            entityLabel: updated.name,
            action: AdminAuditAction.UPDATED,
            changes: {
              event: 'admin_vehicle_make_csv_import_updated',
              source: 'CSV_IMPORT',
              batchId,
              rowNumber: row.rowNumber,
              before: this.makeSnapshot(existing),
              after: this.makeSnapshot(updated),
            },
          });

          results.push({
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            action,
            rowNumber: row.rowNumber,
          });
        }

        return results;
      });

      return {
        data: {
          batchId,
          entity: 'VEHICLE_MAKE' as const,
          mode,
          summary: this.executionSummary(makes),
          makes,
        },
      };
    } catch (error) {
      this.rethrowDatabaseError(error);
    }
  }

  async executeModels(
    file: Express.Multer.File,
    mode: VehicleCsvImportMode,
    actorUserId: string,
  ) {
    const analysis = await this.analyzeModels(file, mode);

    this.assertValidPreview(
      analysis.preview.data.summary.invalidRows,
      'فایل مدل‌های خودرو دارای ردیف نامعتبر است.',
      'VEHICLE_MODEL_CSV_IMPORT_INVALID_ROWS',
      analysis.preview.data,
    );

    const batchId = randomUUID();

    try {
      const models = await this.prisma.$transaction(async (transaction) => {
        const results: Array<{
          id: string;
          name: string;
          slug: string;
          action: CsvAction;
          rowNumber: number;
        }> = [];

        for (const row of analysis.rows) {
          const make = analysis.makeBySlug.get(row.makeSlug);
          const existing = analysis.existingBySlug.get(row.slug);

          if (!make) {
            throw new BadRequestException('برند خودرو در زمان ثبت پیدا نشد.');
          }

          const action: CsvAction = existing ? 'UPDATE' : 'CREATE';

          if (!existing) {
            const created = await transaction.vehicleModel.create({
              data: {
                makeId: make.id,
                name: row.name,
                slug: row.slug,
                isActive: row.isActive ?? true,
                sortOrder: row.sortOrder ?? 0,
                imageUrl: row.imageUrl.value,
              },
            });

            await this.writeAudit(transaction, {
              actorUserId,
              entityType: AdminAuditEntityType.VEHICLE_MODEL,
              entityId: created.id,
              entityLabel: `${make.name} · ${created.name}`,
              action: AdminAuditAction.CREATED,
              changes: {
                event: 'admin_vehicle_model_csv_import_created',
                source: 'CSV_IMPORT',
                batchId,
                rowNumber: row.rowNumber,
                make: { id: make.id, name: make.name, slug: make.slug },
                snapshot: this.modelSnapshot(created, make),
              },
            });

            results.push({
              id: created.id,
              name: created.name,
              slug: created.slug,
              action,
              rowNumber: row.rowNumber,
            });
            continue;
          }

          if (mode !== VehicleCsvImportMode.UPSERT) {
            throw new BadRequestException('مدل موجود فقط در حالت UPSERT قابل تغییر است.');
          }

          const updated = await transaction.vehicleModel.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              ...(row.isActive !== null && { isActive: row.isActive }),
              ...(row.sortOrder !== null && { sortOrder: row.sortOrder }),
              ...(row.imageUrl.provided && { imageUrl: row.imageUrl.value }),
            },
          });

          await this.writeAudit(transaction, {
            actorUserId,
            entityType: AdminAuditEntityType.VEHICLE_MODEL,
            entityId: updated.id,
            entityLabel: `${make.name} · ${updated.name}`,
            action: AdminAuditAction.UPDATED,
            changes: {
              event: 'admin_vehicle_model_csv_import_updated',
              source: 'CSV_IMPORT',
              batchId,
              rowNumber: row.rowNumber,
              before: this.modelSnapshot(existing, existing.make),
              after: this.modelSnapshot(updated, make),
            },
          });

          results.push({
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            action,
            rowNumber: row.rowNumber,
          });
        }

        return results;
      });

      return {
        data: {
          batchId,
          entity: 'VEHICLE_MODEL' as const,
          mode,
          summary: this.executionSummary(models),
          models,
        },
      };
    } catch (error) {
      this.rethrowDatabaseError(error);
    }
  }

  async executeVariants(
    file: Express.Multer.File,
    mode: VehicleCsvImportMode,
    actorUserId: string,
  ) {
    const analysis = await this.analyzeVariants(file, mode);

    this.assertValidPreview(
      analysis.preview.data.summary.invalidRows,
      'فایل تیپ‌ها و موتورهای خودرو دارای ردیف نامعتبر است.',
      'VEHICLE_VARIANT_CSV_IMPORT_INVALID_ROWS',
      analysis.preview.data,
    );

    const batchId = randomUUID();

    try {
      const variants = await this.prisma.$transaction(async (transaction) => {
        const results: Array<{
          id: string;
          name: string;
          slug: string;
          action: CsvAction;
          rowNumber: number;
        }> = [];

        for (const row of analysis.rows) {
          const model = analysis.modelBySlug.get(row.modelSlug);
          const existing = analysis.existingBySlug.get(row.slug);

          if (!model) {
            throw new BadRequestException('مدل خودرو در زمان ثبت پیدا نشد.');
          }

          const action: CsvAction = existing ? 'UPDATE' : 'CREATE';

          if (!existing) {
            const created = await transaction.vehicleVariant.create({
              data: {
                modelId: model.id,
                name: row.name,
                slug: row.slug,
                engineCode: row.engineCode.value,
                engineName: row.engineName.value,
                yearFrom: row.yearFrom.value,
                yearTo: row.yearTo.value,
                yearCalendar: row.yearCalendar ?? VehicleYearCalendar.SHAMSI,
                notes: row.notes.value,
                isActive: row.isActive ?? true,
                sortOrder: row.sortOrder ?? 0,
              },
            });

            await this.writeAudit(transaction, {
              actorUserId,
              entityType: AdminAuditEntityType.VEHICLE_VARIANT,
              entityId: created.id,
              entityLabel: `${model.make.name} · ${model.name} · ${created.name}`,
              action: AdminAuditAction.CREATED,
              changes: {
                event: 'admin_vehicle_variant_csv_import_created',
                source: 'CSV_IMPORT',
                batchId,
                rowNumber: row.rowNumber,
                model: {
                  id: model.id,
                  name: model.name,
                  slug: model.slug,
                  make: {
                    id: model.make.id,
                    name: model.make.name,
                    slug: model.make.slug,
                  },
                },
                snapshot: this.variantSnapshot(created),
              },
            });

            results.push({
              id: created.id,
              name: created.name,
              slug: created.slug,
              action,
              rowNumber: row.rowNumber,
            });
            continue;
          }

          if (mode !== VehicleCsvImportMode.UPSERT) {
            throw new BadRequestException('تیپ موجود فقط در حالت UPSERT قابل تغییر است.');
          }

          const updated = await transaction.vehicleVariant.update({
            where: { id: existing.id },
            data: {
              name: row.name,
              ...(row.engineCode.provided && { engineCode: row.engineCode.value }),
              ...(row.engineName.provided && { engineName: row.engineName.value }),
              ...(row.yearFrom.provided && { yearFrom: row.yearFrom.value }),
              ...(row.yearTo.provided && { yearTo: row.yearTo.value }),
              ...(row.yearCalendar !== null && { yearCalendar: row.yearCalendar }),
              ...(row.notes.provided && { notes: row.notes.value }),
              ...(row.isActive !== null && { isActive: row.isActive }),
              ...(row.sortOrder !== null && { sortOrder: row.sortOrder }),
            },
          });

          await this.writeAudit(transaction, {
            actorUserId,
            entityType: AdminAuditEntityType.VEHICLE_VARIANT,
            entityId: updated.id,
            entityLabel: `${model.make.name} · ${model.name} · ${updated.name}`,
            action: AdminAuditAction.UPDATED,
            changes: {
              event: 'admin_vehicle_variant_csv_import_updated',
              source: 'CSV_IMPORT',
              batchId,
              rowNumber: row.rowNumber,
              before: this.variantSnapshot(existing),
              after: this.variantSnapshot(updated),
            },
          });

          results.push({
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            action,
            rowNumber: row.rowNumber,
          });
        }

        return results;
      });

      return {
        data: {
          batchId,
          entity: 'VEHICLE_VARIANT' as const,
          mode,
          summary: this.executionSummary(variants),
          variants,
        },
      };
    } catch (error) {
      this.rethrowDatabaseError(error);
    }
  }

  private async analyzeMakes(file: Express.Multer.File, mode: VehicleCsvImportMode) {
    const rawRows = this.parseCsv(file, MAKE_COLUMNS, REQUIRED_MAKE_COLUMNS);
    const rows: ParsedMakeRow[] = rawRows.map((raw, index) => {
      const errors: RowError[] = [];
      const name = this.requiredText(raw.name, 'name', index + 2, MAX_NAME_LENGTH, errors);
      const slug = this.requiredSlug(raw.slug, 'slug', index + 2, errors);

      return {
        rowNumber: index + 2,
        name,
        slug,
        isActive: this.optionalBoolean(raw.is_active, 'is_active', errors),
        sortOrder: this.optionalInteger(raw.sort_order, 'sort_order', errors, 0),
        logoUrl: this.optionalUrl(raw.logo_url, 'logo_url', errors),
        errors,
      };
    });

    this.addDuplicateErrors(rows, (row) => row.slug, 'slug', 'DUPLICATE_SLUG_IN_FILE');
    this.addDuplicateErrors(rows, (row) => row.name.toLocaleLowerCase('fa'), 'name', 'DUPLICATE_NAME_IN_FILE');

    const existing = await this.prisma.vehicleMake.findMany({
      where: {
        OR: [
          { slug: { in: rows.map((row) => row.slug).filter(Boolean) } },
          { name: { in: rows.map((row) => row.name).filter(Boolean) } },
        ],
      },
    });

    const existingBySlug = new Map(existing.map((item) => [item.slug, item]));

    for (const row of rows) {
      const bySlug = existingBySlug.get(row.slug);
      const conflictingName = existing.find(
        (item) => item.name === row.name && item.slug !== row.slug,
      );

      if (conflictingName) {
        row.errors.push(this.error('NAME_ALREADY_EXISTS', 'name', row.name, 'نام برند خودرو قبلاً ثبت شده است.'));
      }

      if (bySlug && mode === VehicleCsvImportMode.CREATE_ONLY) {
        row.errors.push(this.error('ENTITY_ALREADY_EXISTS', 'slug', row.slug, 'برند خودرو با این slug قبلاً ثبت شده است.'));
      }
    }

    return {
      rows,
      existingBySlug,
      preview: {
        data: {
          entity: 'VEHICLE_MAKE' as const,
          mode,
          summary: this.previewSummary(rows, existingBySlug),
          rows: rows.map((row) => ({
            rowNumber: row.rowNumber,
            name: row.name,
            slug: row.slug,
            isActive: row.isActive,
            sortOrder: row.sortOrder,
            logoUrl: row.logoUrl.value,
            action: row.errors.length ? null : existingBySlug.has(row.slug) ? 'UPDATE' as const : 'CREATE' as const,
            valid: row.errors.length === 0,
            errors: row.errors,
          })),
          missingReferences: {
            makes: [] as MissingMakeReference[],
            models: [] as MissingModelReference[],
          },
        },
      },
    };
  }

  private async analyzeModels(file: Express.Multer.File, mode: VehicleCsvImportMode) {
    const rawRows = this.parseCsv(file, MODEL_COLUMNS, REQUIRED_MODEL_COLUMNS);
    const rows: ParsedModelRow[] = rawRows.map((raw, index) => {
      const errors: RowError[] = [];
      return {
        rowNumber: index + 2,
        makeSlug: this.requiredSlug(raw.make_slug, 'make_slug', index + 2, errors),
        makeName: this.optionalText(raw.make_name),
        name: this.requiredText(raw.name, 'name', index + 2, MAX_NAME_LENGTH, errors),
        slug: this.requiredSlug(raw.slug, 'slug', index + 2, errors),
        isActive: this.optionalBoolean(raw.is_active, 'is_active', errors),
        sortOrder: this.optionalInteger(raw.sort_order, 'sort_order', errors, 0),
        imageUrl: this.optionalUrl(raw.image_url, 'image_url', errors),
        errors,
      };
    });

    this.addDuplicateErrors(rows, (row) => row.slug, 'slug', 'DUPLICATE_SLUG_IN_FILE');
    this.addDuplicateErrors(rows, (row) => `${row.makeSlug}::${row.name.toLocaleLowerCase('fa')}`, 'name', 'DUPLICATE_NAME_IN_FILE');

    const makes = await this.prisma.vehicleMake.findMany();
    const models = await this.prisma.vehicleModel.findMany({
      include: { make: true },
    });
    const makeBySlug = new Map(makes.map((item) => [item.slug, item]));
    const existingBySlug = new Map(models.map((item) => [item.slug, item]));

    for (const row of rows) {
      const make = makeBySlug.get(row.makeSlug);
      const existing = existingBySlug.get(row.slug);

      if (!make) {
        row.errors.push(this.error('VEHICLE_MAKE_NOT_FOUND', 'make_slug', row.makeSlug, `برند خودرو با slug برابر «${row.makeSlug}» پیدا نشد.`));
      } else if (!make.isActive) {
        row.errors.push(this.error('VEHICLE_MAKE_INACTIVE', 'make_slug', row.makeSlug, 'برند خودرو غیرفعال است.'));
      }

      const nameConflict = models.find(
        (item) => item.make.slug === row.makeSlug && item.name === row.name && item.slug !== row.slug,
      );
      if (nameConflict) {
        row.errors.push(this.error('NAME_ALREADY_EXISTS', 'name', row.name, 'این نام مدل برای برند انتخاب‌شده قبلاً ثبت شده است.'));
      }

      if (existing && mode === VehicleCsvImportMode.CREATE_ONLY) {
        row.errors.push(this.error('ENTITY_ALREADY_EXISTS', 'slug', row.slug, 'مدل خودرو با این slug قبلاً ثبت شده است.'));
      }

      if (existing && existing.make.slug !== row.makeSlug) {
        row.errors.push(this.error('PARENT_CHANGE_NOT_ALLOWED', 'make_slug', row.makeSlug, 'تغییر برند والد مدل در Import مجاز نیست.'));
      }
    }

    return {
      rows,
      makeBySlug,
      existingBySlug,
      preview: {
        data: {
          entity: 'VEHICLE_MODEL' as const,
          mode,
          summary: this.previewSummary(rows, existingBySlug),
          rows: rows.map((row) => ({
            rowNumber: row.rowNumber,
            makeSlug: row.makeSlug,
            makeName: row.makeName,
            name: row.name,
            slug: row.slug,
            isActive: row.isActive,
            sortOrder: row.sortOrder,
            imageUrl: row.imageUrl.value,
            action: row.errors.length ? null : existingBySlug.has(row.slug) ? 'UPDATE' as const : 'CREATE' as const,
            valid: row.errors.length === 0,
            errors: row.errors,
          })),
          missingReferences: {
            makes: this.collectMissingMakes(rows),
            models: [] as MissingModelReference[],
          },
        },
      },
    };
  }

  private async analyzeVariants(file: Express.Multer.File, mode: VehicleCsvImportMode) {
    const rawRows = this.parseCsv(file, VARIANT_COLUMNS, REQUIRED_VARIANT_COLUMNS);
    const rows: ParsedVariantRow[] = rawRows.map((raw, index) => {
      const errors: RowError[] = [];
      const yearFrom = this.optionalNullableInteger(raw.year_from, 'year_from', errors, 1);
      const yearTo = this.optionalNullableInteger(raw.year_to, 'year_to', errors, 1);
      const yearCalendar = this.optionalYearCalendar(raw.year_calendar, errors);

      if (yearFrom.value !== null && yearTo.value !== null && yearFrom.value > yearTo.value) {
        errors.push(this.error('INVALID_YEAR_RANGE', 'year_to', String(yearTo.value), 'سال پایان نباید کمتر از سال شروع باشد.'));
      }

      return {
        rowNumber: index + 2,
        makeSlug: this.requiredSlug(raw.make_slug, 'make_slug', index + 2, errors),
        makeName: this.optionalText(raw.make_name),
        modelSlug: this.requiredSlug(raw.model_slug, 'model_slug', index + 2, errors),
        modelName: this.optionalText(raw.model_name),
        name: this.requiredText(raw.name, 'name', index + 2, MAX_NAME_LENGTH, errors),
        slug: this.requiredSlug(raw.slug, 'slug', index + 2, errors),
        engineCode: this.optionalNullableText(raw.engine_code, 'engine_code', MAX_ENGINE_CODE_LENGTH, errors),
        engineName: this.optionalNullableText(raw.engine_name, 'engine_name', MAX_ENGINE_NAME_LENGTH, errors),
        yearFrom,
        yearTo,
        yearCalendar,
        notes: this.optionalNullableText(raw.notes, 'notes', MAX_NOTES_LENGTH, errors),
        isActive: this.optionalBoolean(raw.is_active, 'is_active', errors),
        sortOrder: this.optionalInteger(raw.sort_order, 'sort_order', errors, 0),
        errors,
      };
    });

    this.addDuplicateErrors(rows, (row) => row.slug, 'slug', 'DUPLICATE_SLUG_IN_FILE');
    this.addDuplicateErrors(rows, (row) => `${row.modelSlug}::${row.name.toLocaleLowerCase('fa')}`, 'name', 'DUPLICATE_NAME_IN_FILE');

    const makes = await this.prisma.vehicleMake.findMany();
    const models = await this.prisma.vehicleModel.findMany({ include: { make: true } });
    const variants = await this.prisma.vehicleVariant.findMany({
      include: { model: { include: { make: true } } },
    });

    const makeBySlug = new Map(makes.map((item) => [item.slug, item]));
    const modelBySlug = new Map(models.map((item) => [item.slug, item]));
    const existingBySlug = new Map(variants.map((item) => [item.slug, item]));

    for (const row of rows) {
      const make = makeBySlug.get(row.makeSlug);
      const model = modelBySlug.get(row.modelSlug);
      const existing = existingBySlug.get(row.slug);

      if (!make) {
        row.errors.push(this.error('VEHICLE_MAKE_NOT_FOUND', 'make_slug', row.makeSlug, `برند خودرو با slug برابر «${row.makeSlug}» پیدا نشد.`));
      } else if (!make.isActive) {
        row.errors.push(this.error('VEHICLE_MAKE_INACTIVE', 'make_slug', row.makeSlug, 'برند خودرو غیرفعال است.'));
      }

      if (!model) {
        row.errors.push(this.error('VEHICLE_MODEL_NOT_FOUND', 'model_slug', row.modelSlug, `مدل خودرو با slug برابر «${row.modelSlug}» پیدا نشد.`));
      } else {
        if (!model.isActive) {
          row.errors.push(this.error('VEHICLE_MODEL_INACTIVE', 'model_slug', row.modelSlug, 'مدل خودرو غیرفعال است.'));
        }
        if (model.make.slug !== row.makeSlug) {
          row.errors.push(this.error('VEHICLE_MODEL_MAKE_MISMATCH', 'make_slug', row.makeSlug, 'مدل خودرو متعلق به برند واردشده نیست.'));
        }
      }

      const nameConflict = variants.find(
        (item) => item.model.slug === row.modelSlug && item.name === row.name && item.slug !== row.slug,
      );
      if (nameConflict) {
        row.errors.push(this.error('NAME_ALREADY_EXISTS', 'name', row.name, 'این نام تیپ برای مدل انتخاب‌شده قبلاً ثبت شده است.'));
      }

      if (existing && mode === VehicleCsvImportMode.CREATE_ONLY) {
        row.errors.push(this.error('ENTITY_ALREADY_EXISTS', 'slug', row.slug, 'تیپ خودرو با این slug قبلاً ثبت شده است.'));
      }

      if (existing && existing.model.slug !== row.modelSlug) {
        row.errors.push(this.error('PARENT_CHANGE_NOT_ALLOWED', 'model_slug', row.modelSlug, 'تغییر مدل والد تیپ در Import مجاز نیست.'));
      }

      if (existing && row.errors.length === 0) {
        const finalFrom = row.yearFrom.provided ? row.yearFrom.value : existing.yearFrom;
        const finalTo = row.yearTo.provided ? row.yearTo.value : existing.yearTo;
        if (finalFrom !== null && finalTo !== null && finalFrom > finalTo) {
          row.errors.push(this.error('INVALID_YEAR_RANGE', 'year_to', finalTo ? String(finalTo) : null, 'سال پایان نهایی نباید کمتر از سال شروع باشد.'));
        }
      }
    }

    return {
      rows,
      makeBySlug,
      modelBySlug,
      existingBySlug,
      preview: {
        data: {
          entity: 'VEHICLE_VARIANT' as const,
          mode,
          summary: this.previewSummary(rows, existingBySlug),
          rows: rows.map((row) => ({
            rowNumber: row.rowNumber,
            makeSlug: row.makeSlug,
            makeName: row.makeName,
            modelSlug: row.modelSlug,
            modelName: row.modelName,
            name: row.name,
            slug: row.slug,
            engineCode: row.engineCode.value,
            engineName: row.engineName.value,
            yearFrom: row.yearFrom.value,
            yearTo: row.yearTo.value,
            yearCalendar: row.yearCalendar,
            notes: row.notes.value,
            isActive: row.isActive,
            sortOrder: row.sortOrder,
            action: row.errors.length ? null : existingBySlug.has(row.slug) ? 'UPDATE' as const : 'CREATE' as const,
            valid: row.errors.length === 0,
            errors: row.errors,
          })),
          missingReferences: {
            makes: this.collectMissingMakes(rows),
            models: this.collectMissingModels(rows, makeBySlug),
          },
        },
      },
    };
  }

  private parseCsv<TColumn extends string>(
    file: Express.Multer.File,
    allowedColumns: readonly TColumn[],
    requiredColumns: readonly TColumn[],
  ): Array<Partial<Record<TColumn, string>>> {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('فقط فایل با پسوند CSV مجاز است.');
    }

    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(file.buffer);
    } catch {
      throw new BadRequestException('فایل CSV باید با UTF-8 ذخیره شده باشد.');
    }

    let matrix: string[][];
    try {
      matrix = parse(text, {
        bom: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: false,
      }) as string[][];
    } catch {
      throw new BadRequestException('ساختار فایل CSV معتبر نیست.');
    }

    if (matrix.length < 2) {
      throw new BadRequestException('فایل CSV حداقل باید یک ردیف داده داشته باشد.');
    }

    const headers = matrix[0].map((value) => value.trim().toLowerCase());
    const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
    if (duplicateHeaders.length) {
      throw new BadRequestException(`ستون تکراری در CSV: ${[...new Set(duplicateHeaders)].join(', ')}`);
    }

    const unknownHeaders = headers.filter((header) => !allowedColumns.includes(header as TColumn));
    if (unknownHeaders.length) {
      throw new BadRequestException(`ستون ناشناخته در CSV: ${unknownHeaders.join(', ')}`);
    }

    const missingHeaders = requiredColumns.filter((header) => !headers.includes(header));
    if (missingHeaders.length) {
      throw new BadRequestException(`ستون الزامی وجود ندارد: ${missingHeaders.join(', ')}`);
    }

    const dataRows = matrix.slice(1);
    if (dataRows.length > MAX_CSV_ROWS) {
      throw new BadRequestException(`حداکثر ${MAX_CSV_ROWS} ردیف در هر فایل مجاز است.`);
    }

    return dataRows.map((cells) => {
      const row: Partial<Record<TColumn, string>> = {};
      headers.forEach((header, index) => {
        row[header as TColumn] = cells[index] ?? '';
      });
      return row;
    });
  }

  private requiredText(
    value: string | undefined,
    field: VehicleColumn,
    _rowNumber: number,
    maxLength: number,
    errors: RowError[],
  ): string {
    const normalized = this.normalizeText(value);
    if (!normalized) {
      errors.push(this.error('REQUIRED_FIELD', field, null, `فیلد ${field} الزامی است.`));
      return '';
    }
    if (normalized.length > maxLength) {
      errors.push(this.error('FIELD_TOO_LONG', field, normalized, `طول ${field} بیشتر از حد مجاز است.`));
    }
    return normalized;
  }

  private requiredSlug(
    value: string | undefined,
    field: VehicleColumn,
    rowNumber: number,
    errors: RowError[],
  ): string {
    const normalized = this.requiredText(value, field, rowNumber, MAX_SLUG_LENGTH, errors).toLowerCase();
    if (normalized && !SLUG_PATTERN.test(normalized)) {
      errors.push(this.error('INVALID_SLUG', field, normalized, 'Slug فقط می‌تواند شامل حروف کوچک انگلیسی، عدد و خط تیره باشد.'));
    }
    return normalized;
  }

  private optionalText(value: string | undefined): string {
    return this.normalizeText(value);
  }

  private optionalNullableText(
    value: string | undefined,
    field: VehicleColumn,
    maxLength: number,
    errors: RowError[],
  ): OptionalValue<string> {
    const raw = this.normalizeText(value);
    if (!raw) return { provided: false, value: null };
    if (raw === NULL_SENTINEL) return { provided: true, value: null };
    if (raw.length > maxLength) {
      errors.push(this.error('FIELD_TOO_LONG', field, raw, `طول ${field} بیشتر از حد مجاز است.`));
    }
    return { provided: true, value: raw };
  }

  private optionalBoolean(
    value: string | undefined,
    field: VehicleColumn,
    errors: RowError[],
  ): boolean | null {
    const normalized = this.normalizeLatinDigits(this.normalizeText(value)).toLowerCase();
    if (!normalized) return null;
    if (['true', '1', 'yes', 'بله', 'فعال'].includes(normalized)) return true;
    if (['false', '0', 'no', 'خیر', 'غیرفعال'].includes(normalized)) return false;
    errors.push(this.error('INVALID_BOOLEAN', field, normalized, `مقدار ${field} باید true یا false باشد.`));
    return null;
  }

  private optionalInteger(
    value: string | undefined,
    field: VehicleColumn,
    errors: RowError[],
    minimum: number,
  ): number | null {
    const normalized = this.normalizeLatinDigits(this.normalizeText(value));
    if (!normalized) return null;
    if (!/^\d+$/.test(normalized)) {
      errors.push(this.error('INVALID_INTEGER', field, normalized, `مقدار ${field} باید عدد صحیح باشد.`));
      return null;
    }
    const parsed = Number(normalized);
    if (!Number.isSafeInteger(parsed) || parsed < minimum) {
      errors.push(this.error('INVALID_INTEGER', field, normalized, `مقدار ${field} معتبر نیست.`));
      return null;
    }
    return parsed;
  }

  private optionalNullableInteger(
    value: string | undefined,
    field: VehicleColumn,
    errors: RowError[],
    minimum: number,
  ): OptionalValue<number> {
    const normalized = this.normalizeLatinDigits(this.normalizeText(value));
    if (!normalized) return { provided: false, value: null };
    if (normalized === NULL_SENTINEL) return { provided: true, value: null };
    if (!/^\d+$/.test(normalized)) {
      errors.push(this.error('INVALID_INTEGER', field, normalized, `مقدار ${field} باید عدد صحیح باشد.`));
      return { provided: true, value: null };
    }
    const parsed = Number(normalized);
    if (!Number.isSafeInteger(parsed) || parsed < minimum) {
      errors.push(this.error('INVALID_INTEGER', field, normalized, `مقدار ${field} معتبر نیست.`));
      return { provided: true, value: null };
    }
    return { provided: true, value: parsed };
  }

  private optionalUrl(
    value: string | undefined,
    field: VehicleColumn,
    errors: RowError[],
  ): OptionalValue<string> {
    const normalized = this.normalizeText(value);
    if (!normalized) return { provided: false, value: null };
    if (normalized === NULL_SENTINEL) return { provided: true, value: null };
    if (normalized.length > MAX_URL_LENGTH) {
      errors.push(this.error('FIELD_TOO_LONG', field, normalized, `طول ${field} بیشتر از حد مجاز است.`));
      return { provided: true, value: normalized };
    }
    try {
      const url = new URL(normalized);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      errors.push(this.error('INVALID_URL', field, normalized, `آدرس ${field} معتبر نیست.`));
    }
    return { provided: true, value: normalized };
  }

  private optionalYearCalendar(
    value: string | undefined,
    errors: RowError[],
  ): VehicleYearCalendar | null {
    const normalized = this.normalizeText(value).toUpperCase();
    if (!normalized) return null;
    if (normalized === VehicleYearCalendar.SHAMSI) return VehicleYearCalendar.SHAMSI;
    if (normalized === VehicleYearCalendar.GREGORIAN) return VehicleYearCalendar.GREGORIAN;
    errors.push(this.error('INVALID_YEAR_CALENDAR', 'year_calendar', normalized, 'تقویم سال باید SHAMSI یا GREGORIAN باشد.'));
    return null;
  }

  private addDuplicateErrors<TRow extends { errors: RowError[] }>(
    rows: TRow[],
    keyOf: (row: TRow) => string,
    field: VehicleColumn,
    code: 'DUPLICATE_NAME_IN_FILE' | 'DUPLICATE_SLUG_IN_FILE',
  ) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = keyOf(row);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const row of rows) {
      const key = keyOf(row);
      if (key && (counts.get(key) ?? 0) > 1) {
        row.errors.push(this.error(code, field, key, 'این مقدار داخل فایل CSV تکراری است.'));
      }
    }
  }

  private collectMissingMakes(rows: Array<ParsedModelRow | ParsedVariantRow>): MissingMakeReference[] {
    const map = new Map<string, MissingMakeReference>();
    for (const row of rows) {
      const missing = row.errors.some((error) => error.code === 'VEHICLE_MAKE_NOT_FOUND');
      if (!missing || !row.makeSlug) continue;
      const current = map.get(row.makeSlug) ?? {
        slug: row.makeSlug,
        affectedRows: [],
        suggestedNames: [],
        canCreate: false,
      };
      current.affectedRows.push(row.rowNumber);
      if (row.makeName && !current.suggestedNames.includes(row.makeName)) current.suggestedNames.push(row.makeName);
      current.canCreate = current.suggestedNames.length > 0;
      map.set(row.makeSlug, current);
    }
    return [...map.values()];
  }

  private collectMissingModels(
    rows: ParsedVariantRow[],
    makeBySlug: Map<string, ExistingMake>,
  ): MissingModelReference[] {
    const map = new Map<string, MissingModelReference>();
    for (const row of rows) {
      const missing = row.errors.some((error) => error.code === 'VEHICLE_MODEL_NOT_FOUND');
      if (!missing || !row.modelSlug) continue;
      const key = `${row.makeSlug}::${row.modelSlug}`;
      const current = map.get(key) ?? {
        slug: row.modelSlug,
        makeSlug: row.makeSlug,
        affectedRows: [],
        suggestedNames: [],
        canCreate: false,
      };
      current.affectedRows.push(row.rowNumber);
      if (row.modelName && !current.suggestedNames.includes(row.modelName)) current.suggestedNames.push(row.modelName);
      current.canCreate = Boolean(makeBySlug.get(row.makeSlug)?.isActive && current.suggestedNames.length);
      map.set(key, current);
    }
    return [...map.values()];
  }

  private previewSummary<TRow extends { slug: string; errors: RowError[] }>(
    rows: TRow[],
    existingBySlug: Map<string, unknown>,
  ) {
    const validRows = rows.filter((row) => row.errors.length === 0);
    return {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: rows.length - validRows.length,
      createCount: validRows.filter((row) => !existingBySlug.has(row.slug)).length,
      updateCount: validRows.filter((row) => existingBySlug.has(row.slug)).length,
    };
  }

  private executionSummary(items: Array<{ action: CsvAction }>) {
    return {
      totalRows: items.length,
      createdCount: items.filter((item) => item.action === 'CREATE').length,
      updatedCount: items.filter((item) => item.action === 'UPDATE').length,
    };
  }

  private assertValidPreview(
    invalidRows: number,
    message: string,
    code: string,
    preview: unknown,
  ) {
    if (invalidRows > 0) {
      throw new BadRequestException({ message, code, preview });
    }
  }

  private error(
    code: CsvErrorCode,
    field: VehicleColumn,
    value: string | null,
    message: string,
  ): RowError {
    return { code, field, value, message };
  }

  private normalizeText(value: string | undefined): string {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  }

  private normalizeLatinDigits(value: string): string {
    return value
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  }

  private buildTemplate(rows: readonly (readonly string[])[]): Buffer {
    const content = rows
      .map((row) => row.map((cell) => this.escapeCsvCell(String(cell))).join(','))
      .join('\r\n');
    return Buffer.from(`\uFEFF${content}\r\n`, 'utf8');
  }

  private escapeCsvCell(value: string): string {
    if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  }

  private makeSnapshot(make: {
    name: string;
    slug: string;
    logoUrl: string | null;
    isActive: boolean;
    sortOrder: number;
  }) {
    return {
      name: make.name,
      slug: make.slug,
      logoUrl: make.logoUrl,
      isActive: make.isActive,
      sortOrder: make.sortOrder,
    };
  }

  private modelSnapshot(
    model: {
      name: string;
      slug: string;
      imageUrl: string | null;
      isActive: boolean;
      sortOrder: number;
    },
    make: {
      id: string;
      name: string;
      slug: string;
    },
  ) {
    return {
      make: {
        id: make.id,
        name: make.name,
        slug: make.slug,
      },
      name: model.name,
      slug: model.slug,
      imageUrl: model.imageUrl,
      isActive: model.isActive,
      sortOrder: model.sortOrder,
    };
  }

  private variantSnapshot(variant: {
    name: string;
    slug: string;
    engineCode: string | null;
    engineName: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    yearCalendar: VehicleYearCalendar;
    notes: string | null;
    isActive: boolean;
    sortOrder: number;
  }) {
    return {
      name: variant.name,
      slug: variant.slug,
      engineCode: variant.engineCode,
      engineName: variant.engineName,
      yearFrom: variant.yearFrom,
      yearTo: variant.yearTo,
      yearCalendar: variant.yearCalendar,
      notes: variant.notes,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
    };
  }

  private async writeAudit(
    transaction: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      entityType: AdminAuditEntityType;
      entityId: string;
      entityLabel: string;
      action: AdminAuditAction;
      changes: Record<string, unknown>;
    },
  ) {
    await transaction.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        entityLabel: input.entityLabel,
        action: input.action,
        changes: input.changes as Prisma.InputJsonValue,
      },
    });
  }

  private rethrowDatabaseError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException({
        message: 'یکی از نام‌ها یا slugهای خودرو با داده موجود تداخل دارد.',
        code: 'VEHICLE_CSV_IMPORT_UNIQUE_CONFLICT',
      });
    }
    throw error;
  }
}
