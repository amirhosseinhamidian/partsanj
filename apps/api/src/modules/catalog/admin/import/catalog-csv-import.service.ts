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
  ProductAuditAction,
  ProductStatus,
  StockStatus,
} from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../database/prisma.service.js';
import { ProductCsvImportMode } from './dto/preview-product-csv-import.dto.js';

const MAX_PRODUCT_CSV_ROWS = 500;
const MAX_SKU_LENGTH = 100;
const MAX_NAME_LENGTH = 255;
const MAX_SLUG_LENGTH = 255;
const MAX_SHORT_DESCRIPTION_LENGTH = 1_000;
const MAX_DESCRIPTION_LENGTH = 50_000;
const DEFAULT_STOCK_QUANTITY = 0;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const PRODUCT_CSV_COLUMNS = [
  'sku',
  'name',
  'slug',
  'brand_slug',
  'brand_name',
  'category_slug',
  'category_name',
  'category_parent_slug',
  'price_toman',
  'sale_price_toman',
  'stock_quantity',
  'stock_status',
  'short_description',
  'description',
  'low_stock_threshold',
] as const;

const REQUIRED_PRODUCT_CSV_COLUMNS = [
  'sku',
  'name',
  'slug',
  'brand_slug',
  'category_slug',
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const VALID_STOCK_STATUSES = new Set<string>(Object.values(StockStatus));

type ProductCsvColumn = (typeof PRODUCT_CSV_COLUMNS)[number];
type ProductCsvRowAction = 'CREATE' | 'UPDATE';

type ProductCsvErrorCode =
  | 'REQUIRED_FIELD'
  | 'FIELD_TOO_LONG'
  | 'INVALID_SLUG'
  | 'INVALID_INTEGER'
  | 'INVALID_STOCK_STATUS'
  | 'SALE_PRICE_WITHOUT_PRICE'
  | 'SALE_PRICE_GREATER_THAN_PRICE'
  | 'DUPLICATE_SKU_IN_FILE'
  | 'DUPLICATE_SLUG_IN_FILE'
  | 'BRAND_NOT_FOUND'
  | 'BRAND_INACTIVE'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_INACTIVE'
  | 'SKU_ALREADY_EXISTS'
  | 'SLUG_ALREADY_EXISTS';

type ProductCsvRowError = {
  code: ProductCsvErrorCode;
  field: ProductCsvColumn;
  value: string | null;
  message: string;
};

type RawProductCsvRow = Partial<Record<ProductCsvColumn, string>>;

type ParsedProductCsvRow = {
  rowNumber: number;
  raw: RawProductCsvRow;
  sku: string;
  name: string;
  slug: string;
  brandSlug: string;
  brandName: string | null;
  categorySlug: string;
  categoryName: string | null;
  categoryParentSlug: string | null;
  priceToman: number | null;
  salePriceToman: number | null;
  stockQuantity: number | null;
  stockStatus: StockStatus | null;
  shortDescription: string | null;
  description: string | null;
  lowStockThreshold: number | null;
  errors: ProductCsvRowError[];
};

type MissingReferenceAccumulator = {
  affectedRows: Set<number>;
  suggestedNames: Set<string>;
  suggestedParentSlugs: Set<string>;
};

@Injectable()
export class CatalogCsvImportService {
  constructor(private readonly prisma: PrismaService) {}

  getProductTemplate(): Buffer {
    const templateRows = [
      PRODUCT_CSV_COLUMNS,
      [
        'FORCE-REG-001',
        'آفتامات دینام پراید انژکتور',
        'force-pride-injector-regulator',
        'force',
        'فورس',
        'alternator-regulators',
        'آفتامات دینام',
        'alternator-parts',
        '780000',
        '',
        '10',
        StockStatus.IN_STOCK,
        'آفتامات دینام مناسب پراید انژکتوری',
        'توضیحات کامل محصول در این ستون قرار می‌گیرد.',
        '3',
      ],
    ];

    const csv = templateRows
      .map((row) => row.map((value) => this.escapeCsvCell(String(value))).join(','))
      .join('\r\n');

    return Buffer.from(`\uFEFF${csv}\r\n`, 'utf8');
  }

  async previewProducts(file: Express.Multer.File, mode: ProductCsvImportMode) {
    this.assertCsvFile(file);

    const matrix = this.parseCsvMatrix(file.buffer);
    const { headers, rows } = this.extractAndValidateRows(matrix);

    const parsedRows = rows.map((row, index) =>
      this.parseProductRow(row, headers, index + 2),
    );

    this.addWithinFileDuplicateErrors(parsedRows);

    const brandSlugs = this.uniqueNonEmpty(parsedRows.map((row) => row.brandSlug));
    const categorySlugs = this.uniqueNonEmpty(parsedRows.map((row) => row.categorySlug));
    const skus = this.uniqueNonEmpty(parsedRows.map((row) => row.sku));
    const slugs = this.uniqueNonEmpty(parsedRows.map((row) => row.slug));

    const [brands, categories, existingProducts] = await Promise.all([
      this.prisma.brand.findMany({
        where: {
          slug: {
            in: brandSlugs,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      }),
      this.prisma.category.findMany({
        where: {
          slug: {
            in: categorySlugs,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      }),
      this.prisma.product.findMany({
        where: {
          OR: [
            {
              sku: {
                in: skus,
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
          sku: true,
          slug: true,
          name: true,
          priceToman: true,
        },
      }),
    ]);

    const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));
    const categoryBySlug = new Map(
      categories.map((category) => [category.slug, category]),
    );
    const productBySku = new Map(existingProducts.map((product) => [product.sku, product]));
    const productBySlug = new Map(
      existingProducts.map((product) => [product.slug, product]),
    );

    const missingBrands = new Map<string, MissingReferenceAccumulator>();
    const missingCategories = new Map<string, MissingReferenceAccumulator>();

    const previewRows = parsedRows.map((row) => {
      const brand = brandBySlug.get(row.brandSlug);

      if (row.brandSlug) {
        if (!brand) {
          this.addRowError(row, {
            code: 'BRAND_NOT_FOUND',
            field: 'brand_slug',
            value: row.brandSlug,
            message: `برند با slug برابر «${row.brandSlug}» پیدا نشد.`,
          });

          this.accumulateMissingReference(missingBrands, row.brandSlug, {
            rowNumber: row.rowNumber,
            suggestedName: row.brandName,
          });
        } else if (!brand.isActive) {
          this.addRowError(row, {
            code: 'BRAND_INACTIVE',
            field: 'brand_slug',
            value: row.brandSlug,
            message: `برند «${brand.name}» وجود دارد اما غیرفعال است.`,
          });
        }
      }

      const category = categoryBySlug.get(row.categorySlug);

      if (row.categorySlug) {
        if (!category) {
          this.addRowError(row, {
            code: 'CATEGORY_NOT_FOUND',
            field: 'category_slug',
            value: row.categorySlug,
            message: `دسته‌بندی با slug برابر «${row.categorySlug}» پیدا نشد.`,
          });

          this.accumulateMissingReference(missingCategories, row.categorySlug, {
            rowNumber: row.rowNumber,
            suggestedName: row.categoryName,
            suggestedParentSlug: row.categoryParentSlug,
          });
        } else if (!category.isActive) {
          this.addRowError(row, {
            code: 'CATEGORY_INACTIVE',
            field: 'category_slug',
            value: row.categorySlug,
            message: `دسته‌بندی «${category.name}» وجود دارد اما غیرفعال است.`,
          });
        }
      }

      const existingBySku = productBySku.get(row.sku);
      const existingBySlug = productBySlug.get(row.slug);
      let action: ProductCsvRowAction = existingBySku ? 'UPDATE' : 'CREATE';

      if (mode === ProductCsvImportMode.CREATE_ONLY) {
        action = 'CREATE';

        if (existingBySku) {
          this.addRowError(row, {
            code: 'SKU_ALREADY_EXISTS',
            field: 'sku',
            value: row.sku,
            message: `محصولی با SKU برابر «${row.sku}» قبلاً ثبت شده است.`,
          });
        }

        if (existingBySlug) {
          this.addRowError(row, {
            code: 'SLUG_ALREADY_EXISTS',
            field: 'slug',
            value: row.slug,
            message: `محصولی با slug برابر «${row.slug}» قبلاً ثبت شده است.`,
          });
        }
      } else if (existingBySku) {
        action = 'UPDATE';

        if (existingBySlug && existingBySlug.id !== existingBySku.id) {
          this.addRowError(row, {
            code: 'SLUG_ALREADY_EXISTS',
            field: 'slug',
            value: row.slug,
            message: `slug برابر «${row.slug}» متعلق به محصول دیگری است.`,
          });
        }
      } else {
        action = 'CREATE';

        if (existingBySlug) {
          this.addRowError(row, {
            code: 'SLUG_ALREADY_EXISTS',
            field: 'slug',
            value: row.slug,
            message: `محصولی با slug برابر «${row.slug}» قبلاً ثبت شده است.`,
          });
        }
      }

      const effectivePriceToman =
        row.priceToman ?? (action === 'UPDATE' ? existingBySku?.priceToman ?? null : null);

      if (row.salePriceToman !== null && effectivePriceToman === null) {
        this.addRowError(row, {
          code: 'SALE_PRICE_WITHOUT_PRICE',
          field: 'sale_price_toman',
          value: row.raw.sale_price_toman ?? null,
          message: 'قیمت فروش ویژه بدون قیمت اصلی قابل ثبت نیست.',
        });
      }

      if (
        row.salePriceToman !== null &&
        effectivePriceToman !== null &&
        row.salePriceToman > effectivePriceToman
      ) {
        this.addRowError(row, {
          code: 'SALE_PRICE_GREATER_THAN_PRICE',
          field: 'sale_price_toman',
          value: row.raw.sale_price_toman ?? null,
          message: 'قیمت فروش ویژه نمی‌تواند از قیمت اصلی بیشتر باشد.',
        });
      }

      const valid = row.errors.length === 0;

      return {
        rowNumber: row.rowNumber,
        sku: row.sku,
        name: row.name,
        slug: row.slug,
        brandSlug: row.brandSlug,
        categorySlug: row.categorySlug,
        action,
        valid,
        errors: row.errors,
        warnings: [],
        normalized: {
          priceToman: row.priceToman,
          salePriceToman: row.salePriceToman,
          stockQuantity:
            row.stockQuantity ??
            (action === 'CREATE' ? DEFAULT_STOCK_QUANTITY : null),
          stockStatus:
            row.stockStatus ??
            (action === 'CREATE' ? StockStatus.CHECK_AVAILABILITY : null),
          lowStockThreshold:
            row.lowStockThreshold ??
            (action === 'CREATE' ? DEFAULT_LOW_STOCK_THRESHOLD : null),
          shortDescription: row.shortDescription,
          description: row.description,
        },
      };
    });

    const validRows = previewRows.filter((row) => row.valid);

    return {
      data: {
        mode,
        summary: {
          totalRows: previewRows.length,
          validRows: validRows.length,
          invalidRows: previewRows.length - validRows.length,
          createCount: validRows.filter((row) => row.action === 'CREATE').length,
          updateCount: validRows.filter((row) => row.action === 'UPDATE').length,
        },
        rows: previewRows,
        missingReferences: {
          brands: this.serializeMissingReferences(missingBrands),
          categories: this.serializeMissingReferences(missingCategories, true),
        },
      },
    };
  }

  async executeProducts(
    file: Express.Multer.File,
    mode: ProductCsvImportMode,
    actorUserId: string,
  ) {
    const preview = await this.previewProducts(file, mode);

    if (preview.data.summary.invalidRows > 0) {
      throw new BadRequestException({
        message: 'فایل CSV دارای ردیف نامعتبر است و قابل ثبت نیست.',
        code: 'CSV_IMPORT_HAS_ERRORS',
        summary: preview.data.summary,
        invalidRows: preview.data.rows
          .filter((row) => !row.valid)
          .map((row) => ({
            rowNumber: row.rowNumber,
            sku: row.sku,
            errors: row.errors,
          })),
      });
    }

    const matrix = this.parseCsvMatrix(file.buffer);
    const { headers, rows } = this.extractAndValidateRows(matrix);
    const parsedRows = rows.map((row, index) =>
      this.parseProductRow(row, headers, index + 2),
    );

    const brandSlugs = this.uniqueNonEmpty(parsedRows.map((row) => row.brandSlug));
    const categorySlugs = this.uniqueNonEmpty(parsedRows.map((row) => row.categorySlug));
    const skus = this.uniqueNonEmpty(parsedRows.map((row) => row.sku));

    const [brands, categories, existingProducts] = await Promise.all([
      this.prisma.brand.findMany({
        where: {
          slug: {
            in: brandSlugs,
          },
          isActive: true,
        },
        select: {
          id: true,
          slug: true,
        },
      }),
      this.prisma.category.findMany({
        where: {
          slug: {
            in: categorySlugs,
          },
          isActive: true,
        },
        select: {
          id: true,
          slug: true,
        },
      }),
      this.prisma.product.findMany({
        where: {
          sku: {
            in: skus,
          },
        },
        select: {
          id: true,
          sku: true,
          slug: true,
          name: true,
          shortDescription: true,
          description: true,
          priceToman: true,
          salePriceToman: true,
          stockQuantity: true,
          stockStatus: true,
          lowStockThreshold: true,
          brandId: true,
          categoryId: true,
        },
      }),
    ]);

    const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));
    const categoryBySlug = new Map(
      categories.map((category) => [category.slug, category]),
    );
    const productBySku = new Map(
      existingProducts.map((product) => [product.sku, product]),
    );

    const batchId = randomUUID();

    try {
      const importedProducts = await this.prisma.$transaction(
        async (transaction) => {
          const results: Array<{
            id: string;
            sku: string;
            name: string;
            action: ProductCsvRowAction;
            rowNumber: number;
          }> = [];

          for (const row of parsedRows) {
            const brand = brandBySlug.get(row.brandSlug);
            const category = categoryBySlug.get(row.categorySlug);

            if (!brand || !category) {
              throw new BadRequestException({
                message: 'برند یا دسته‌بندی یکی از محصولات در زمان ثبت در دسترس نیست.',
                code: 'CSV_IMPORT_REFERENCE_CHANGED',
                rowNumber: row.rowNumber,
                sku: row.sku,
              });
            }

            const existingProduct = productBySku.get(row.sku);
            const action: ProductCsvRowAction = existingProduct ? 'UPDATE' : 'CREATE';

            if (action === 'CREATE') {
              const stockQuantity = row.stockQuantity ?? DEFAULT_STOCK_QUANTITY;
              const stockStatus = this.resolveProductStockStatus(
                row.stockStatus ?? StockStatus.CHECK_AVAILABILITY,
                stockQuantity,
              );
              const lowStockThreshold =
                row.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;

              this.assertFinalProductValues({
                priceToman: row.priceToman,
                salePriceToman: row.salePriceToman,
                stockQuantity,
                stockStatus,
                lowStockThreshold,
              });

              const product = await transaction.product.create({
                data: {
                  sku: row.sku,
                  name: row.name,
                  slug: row.slug,
                  brandId: brand.id,
                  categoryId: category.id,
                  shortDescription: row.shortDescription,
                  description: row.description,
                  priceToman: row.priceToman,
                  salePriceToman: row.salePriceToman,
                  stockQuantity,
                  stockStatus,
                  lowStockThreshold,
                  status: ProductStatus.DRAFT,
                  isPublished: false,
                  isTorobEnabled: false,
                  showOnHome: false,
                },
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  slug: true,
                  brandId: true,
                  categoryId: true,
                  shortDescription: true,
                  description: true,
                  priceToman: true,
                  salePriceToman: true,
                  stockQuantity: true,
                  stockStatus: true,
                  lowStockThreshold: true,
                  status: true,
                  isPublished: true,
                  isTorobEnabled: true,
                  showOnHome: true,
                },
              });

              const auditChanges = {
                event: 'admin_product_csv_import_created',
                source: 'CSV_IMPORT',
                batchId,
                rowNumber: row.rowNumber,
                snapshot: product,
              };

              await transaction.productAuditLog.create({
                data: {
                  productId: product.id,
                  actorUserId,
                  action: ProductAuditAction.CREATED,
                  changes: this.toJson(auditChanges),
                },
              });

              await transaction.adminAuditLog.create({
                data: {
                  actorUserId,
                  entityType: AdminAuditEntityType.PRODUCT,
                  entityId: product.id,
                  entityLabel: product.name,
                  action: AdminAuditAction.CREATED,
                  changes: this.toJson(auditChanges),
                },
              });

              results.push({
                id: product.id,
                sku: product.sku,
                name: product.name,
                action,
                rowNumber: row.rowNumber,
              });

              continue;
            }

            if (mode !== ProductCsvImportMode.UPSERT || !existingProduct) {
              throw new BadRequestException({
                message: 'محصول موجود فقط در حالت UPSERT قابل به‌روزرسانی است.',
                code: 'CSV_IMPORT_MODE_MISMATCH',
                rowNumber: row.rowNumber,
                sku: row.sku,
              });
            }

            const priceToman = this.hasCsvValue(row.raw.price_toman)
              ? row.priceToman
              : existingProduct.priceToman;
            const salePriceToman = this.hasCsvValue(row.raw.sale_price_toman)
              ? row.salePriceToman
              : existingProduct.salePriceToman;
            const stockQuantity = this.hasCsvValue(row.raw.stock_quantity)
              ? (row.stockQuantity ?? DEFAULT_STOCK_QUANTITY)
              : existingProduct.stockQuantity;
            const requestedStockStatus = this.hasCsvValue(row.raw.stock_status)
              ? (row.stockStatus ?? StockStatus.CHECK_AVAILABILITY)
              : existingProduct.stockStatus;
            const stockStatus = this.resolveProductStockStatus(
              requestedStockStatus,
              stockQuantity,
            );
            const lowStockThreshold = this.hasCsvValue(
              row.raw.low_stock_threshold,
            )
              ? (row.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD)
              : existingProduct.lowStockThreshold;
            const shortDescription = this.hasCsvValue(row.raw.short_description)
              ? row.shortDescription
              : existingProduct.shortDescription;
            const description = this.hasCsvValue(row.raw.description)
              ? row.description
              : existingProduct.description;

            this.assertFinalProductValues({
              priceToman,
              salePriceToman,
              stockQuantity,
              stockStatus,
              lowStockThreshold,
            });

            const before = {
              sku: existingProduct.sku,
              name: existingProduct.name,
              slug: existingProduct.slug,
              brandId: existingProduct.brandId,
              categoryId: existingProduct.categoryId,
              shortDescription: existingProduct.shortDescription,
              description: existingProduct.description,
              priceToman: existingProduct.priceToman,
              salePriceToman: existingProduct.salePriceToman,
              stockQuantity: existingProduct.stockQuantity,
              stockStatus: existingProduct.stockStatus,
              lowStockThreshold: existingProduct.lowStockThreshold,
            };

            const product = await transaction.product.update({
              where: {
                id: existingProduct.id,
              },
              data: {
                name: row.name,
                slug: row.slug,
                brandId: brand.id,
                categoryId: category.id,
                shortDescription,
                description,
                priceToman,
                salePriceToman,
                stockQuantity,
                stockStatus,
                lowStockThreshold,
              },
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                brandId: true,
                categoryId: true,
                shortDescription: true,
                description: true,
                priceToman: true,
                salePriceToman: true,
                stockQuantity: true,
                stockStatus: true,
                lowStockThreshold: true,
              },
            });

            const auditChanges = {
              event: 'admin_product_csv_import_updated',
              source: 'CSV_IMPORT',
              batchId,
              rowNumber: row.rowNumber,
              before,
              after: product,
            };

            await transaction.productAuditLog.create({
              data: {
                productId: product.id,
                actorUserId,
                action: ProductAuditAction.UPDATED,
                changes: this.toJson(auditChanges),
              },
            });

            await transaction.adminAuditLog.create({
              data: {
                actorUserId,
                entityType: AdminAuditEntityType.PRODUCT,
                entityId: product.id,
                entityLabel: product.name,
                action: AdminAuditAction.UPDATED,
                changes: this.toJson(auditChanges),
              },
            });

            results.push({
              id: product.id,
              sku: product.sku,
              name: product.name,
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
          mode,
          summary: {
            totalRows: importedProducts.length,
            createdCount: importedProducts.filter((item) => item.action === 'CREATE')
              .length,
            updatedCount: importedProducts.filter((item) => item.action === 'UPDATE')
              .length,
          },
          products: importedProducts,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'هنگام ثبت CSV، مقدار یکتای تکراری برای SKU یا slug ایجاد شد.',
          code: 'CSV_IMPORT_UNIQUE_CONFLICT',
          target: error.meta?.target ?? null,
        });
      }

      throw error;
    }
  }

  private resolveProductStockStatus(
    requestedStatus: StockStatus,
    stockQuantity: number,
  ): StockStatus {
    if (requestedStatus === StockStatus.CHECK_AVAILABILITY) {
      return StockStatus.CHECK_AVAILABILITY;
    }

    return stockQuantity > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK;
  }

  private assertFinalProductValues(input: {
    priceToman: number | null;
    salePriceToman: number | null;
    stockQuantity: number;
    stockStatus: StockStatus;
    lowStockThreshold: number;
  }) {
    if (input.salePriceToman !== null && input.priceToman === null) {
      throw new BadRequestException(
        'قیمت فروش ویژه بدون قیمت اصلی قابل ثبت نیست.',
      );
    }

    if (
      input.salePriceToman !== null &&
      input.priceToman !== null &&
      input.salePriceToman > input.priceToman
    ) {
      throw new BadRequestException(
        'قیمت فروش ویژه نمی‌تواند از قیمت اصلی بیشتر باشد.',
      );
    }

    if (input.stockQuantity < 0 || input.lowStockThreshold < 0) {
      throw new BadRequestException('مقادیر موجودی محصول معتبر نیستند.');
    }

    if (
      input.stockStatus === StockStatus.IN_STOCK &&
      input.stockQuantity === 0
    ) {
      throw new BadRequestException(
        'محصول موجود باید حداقل یک واحد موجودی داشته باشد.',
      );
    }

    if (
      input.stockStatus === StockStatus.OUT_OF_STOCK &&
      input.stockQuantity > 0
    ) {
      throw new BadRequestException(
        'محصول ناموجود نمی‌تواند موجودی مثبت داشته باشد.',
      );
    }
  }

  private hasCsvValue(value: string | undefined) {
    return Boolean(value?.trim());
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
      throw new BadRequestException('امکان تبدیل مقدار به JSON وجود ندارد.');
    }

    return JSON.parse(serialized) as Prisma.InputJsonValue;
  }

  private assertCsvFile(file: Express.Multer.File) {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('فقط فایل با پسوند CSV پذیرفته می‌شود.');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('فایل CSV خالی است.');
    }
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

      return records.filter((row) => row.some((cell) => cell.trim().length > 0));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV parse failed';

      throw new BadRequestException(`ساختار فایل CSV معتبر نیست: ${message}`);
    }
  }

  private extractAndValidateRows(matrix: string[][]) {
    if (matrix.length === 0) {
      throw new BadRequestException('فایل CSV فاقد Header است.');
    }

    const rawHeaders = matrix[0] ?? [];
    const headers = rawHeaders.map((header) => header.trim().toLowerCase());

    if (headers.length === 1 && headers[0]?.includes(';')) {
      throw new BadRequestException(
        'جداکننده فایل باید ویرگول باشد. فایل را به صورت CSV UTF-8 (Comma delimited) ذخیره کنید.',
      );
    }

    const duplicateHeaders = this.findDuplicates(headers);

    if (duplicateHeaders.length > 0) {
      throw new BadRequestException(
        `ستون‌های تکراری در Header وجود دارد: ${duplicateHeaders.join(', ')}`,
      );
    }

    const allowedColumns = new Set<string>(PRODUCT_CSV_COLUMNS);
    const unknownHeaders = headers.filter((header) => !allowedColumns.has(header));

    if (unknownHeaders.length > 0) {
      throw new BadRequestException(
        `ستون‌های ناشناخته در فایل وجود دارد: ${unknownHeaders.join(', ')}`,
      );
    }

    const missingHeaders = REQUIRED_PRODUCT_CSV_COLUMNS.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `ستون‌های اجباری در فایل وجود ندارند: ${missingHeaders.join(', ')}`,
      );
    }

    const rows = matrix.slice(1);

    if (rows.length === 0) {
      throw new BadRequestException('فایل CSV هیچ ردیف محصولی ندارد.');
    }

    if (rows.length > MAX_PRODUCT_CSV_ROWS) {
      throw new BadRequestException(
        `حداکثر ${MAX_PRODUCT_CSV_ROWS} ردیف محصول در هر فایل قابل بررسی است.`,
      );
    }

    return {
      headers: headers as ProductCsvColumn[],
      rows,
    };
  }

  private parseProductRow(
    cells: string[],
    headers: ProductCsvColumn[],
    rowNumber: number,
  ): ParsedProductCsvRow {
    const raw = Object.fromEntries(
      headers.map((header, index) => [header, cells[index]?.trim() ?? '']),
    ) as RawProductCsvRow;

    const row: ParsedProductCsvRow = {
      rowNumber,
      raw,
      sku: raw.sku?.trim() ?? '',
      name: raw.name?.trim() ?? '',
      slug: raw.slug?.trim().toLowerCase() ?? '',
      brandSlug: raw.brand_slug?.trim().toLowerCase() ?? '',
      brandName: this.nullIfEmpty(raw.brand_name),
      categorySlug: raw.category_slug?.trim().toLowerCase() ?? '',
      categoryName: this.nullIfEmpty(raw.category_name),
      categoryParentSlug: this.nullIfEmpty(raw.category_parent_slug)?.toLowerCase() ?? null,
      priceToman: null,
      salePriceToman: null,
      stockQuantity: null,
      stockStatus: null,
      shortDescription: this.nullIfEmpty(raw.short_description),
      description: this.nullIfEmpty(raw.description),
      lowStockThreshold: null,
      errors: [],
    };

    this.validateRequiredString(row, 'sku', row.sku, MAX_SKU_LENGTH, 'SKU');
    this.validateRequiredString(row, 'name', row.name, MAX_NAME_LENGTH, 'نام محصول');
    this.validateRequiredString(row, 'slug', row.slug, MAX_SLUG_LENGTH, 'slug محصول');
    this.validateRequiredString(
      row,
      'brand_slug',
      row.brandSlug,
      MAX_SLUG_LENGTH,
      'slug برند',
    );
    this.validateRequiredString(
      row,
      'category_slug',
      row.categorySlug,
      MAX_SLUG_LENGTH,
      'slug دسته‌بندی',
    );

    this.validateSlug(row, 'slug', row.slug, 'slug محصول');
    this.validateSlug(row, 'brand_slug', row.brandSlug, 'slug برند');
    this.validateSlug(row, 'category_slug', row.categorySlug, 'slug دسته‌بندی');

    if (row.categoryParentSlug) {
      this.validateSlug(
        row,
        'category_parent_slug',
        row.categoryParentSlug,
        'slug دسته‌بندی والد',
      );
    }

    if (row.brandName && row.brandName.length > MAX_NAME_LENGTH) {
      this.addFieldTooLongError(row, 'brand_name', row.brandName, MAX_NAME_LENGTH);
    }

    if (row.categoryName && row.categoryName.length > MAX_NAME_LENGTH) {
      this.addFieldTooLongError(row, 'category_name', row.categoryName, MAX_NAME_LENGTH);
    }

    if (
      row.shortDescription &&
      row.shortDescription.length > MAX_SHORT_DESCRIPTION_LENGTH
    ) {
      this.addFieldTooLongError(
        row,
        'short_description',
        row.shortDescription,
        MAX_SHORT_DESCRIPTION_LENGTH,
      );
    }

    if (row.description && row.description.length > MAX_DESCRIPTION_LENGTH) {
      this.addFieldTooLongError(
        row,
        'description',
        row.description,
        MAX_DESCRIPTION_LENGTH,
      );
    }

    row.priceToman = this.parseOptionalNonNegativeInteger(
      row,
      'price_toman',
      raw.price_toman,
    );
    row.salePriceToman = this.parseOptionalNonNegativeInteger(
      row,
      'sale_price_toman',
      raw.sale_price_toman,
    );
    row.stockQuantity = this.parseOptionalNonNegativeInteger(
      row,
      'stock_quantity',
      raw.stock_quantity,
    );
    row.lowStockThreshold = this.parseOptionalNonNegativeInteger(
      row,
      'low_stock_threshold',
      raw.low_stock_threshold,
    );

    const rawStockStatus = this.nullIfEmpty(raw.stock_status)?.toUpperCase() ?? null;

    if (rawStockStatus) {
      if (!VALID_STOCK_STATUSES.has(rawStockStatus)) {
        this.addRowError(row, {
          code: 'INVALID_STOCK_STATUS',
          field: 'stock_status',
          value: raw.stock_status ?? null,
          message: `مقدار stock_status باید یکی از ${Array.from(VALID_STOCK_STATUSES).join(', ')} باشد.`,
        });
      } else {
        row.stockStatus = rawStockStatus as StockStatus;
      }
    }

    return row;
  }

  private addWithinFileDuplicateErrors(rows: ParsedProductCsvRow[]) {
    const skuCounts = this.countNonEmpty(rows.map((row) => row.sku));
    const slugCounts = this.countNonEmpty(rows.map((row) => row.slug));

    for (const row of rows) {
      if (row.sku && (skuCounts.get(row.sku) ?? 0) > 1) {
        this.addRowError(row, {
          code: 'DUPLICATE_SKU_IN_FILE',
          field: 'sku',
          value: row.sku,
          message: `SKU برابر «${row.sku}» در همین فایل تکرار شده است.`,
        });
      }

      if (row.slug && (slugCounts.get(row.slug) ?? 0) > 1) {
        this.addRowError(row, {
          code: 'DUPLICATE_SLUG_IN_FILE',
          field: 'slug',
          value: row.slug,
          message: `slug برابر «${row.slug}» در همین فایل تکرار شده است.`,
        });
      }
    }
  }

  private validateRequiredString(
    row: ParsedProductCsvRow,
    field: ProductCsvColumn,
    value: string,
    maxLength: number,
    label: string,
  ) {
    if (!value) {
      this.addRowError(row, {
        code: 'REQUIRED_FIELD',
        field,
        value: null,
        message: `${label} اجباری است.`,
      });
      return;
    }

    if (value.length > maxLength) {
      this.addFieldTooLongError(row, field, value, maxLength);
    }
  }

  private validateSlug(
    row: ParsedProductCsvRow,
    field: ProductCsvColumn,
    value: string,
    label: string,
  ) {
    if (value && !SLUG_PATTERN.test(value)) {
      this.addRowError(row, {
        code: 'INVALID_SLUG',
        field,
        value,
        message: `${label} فقط می‌تواند شامل حروف کوچک لاتین، عدد و خط تیره باشد.`,
      });
    }
  }

  private parseOptionalNonNegativeInteger(
    row: ParsedProductCsvRow,
    field: ProductCsvColumn,
    value: string | undefined,
  ): number | null {
    const normalized = this.normalizeIntegerString(value);

    if (!normalized) {
      return null;
    }

    if (!/^\d+$/.test(normalized)) {
      this.addRowError(row, {
        code: 'INVALID_INTEGER',
        field,
        value: value ?? null,
        message: `مقدار ستون ${field} باید عدد صحیح و غیرمنفی باشد.`,
      });
      return null;
    }

    const parsedValue = Number(normalized);

    if (!Number.isSafeInteger(parsedValue) || parsedValue > 2_147_483_647) {
      this.addRowError(row, {
        code: 'INVALID_INTEGER',
        field,
        value: value ?? null,
        message: `مقدار ستون ${field} خارج از محدوده مجاز است.`,
      });
      return null;
    }

    return parsedValue;
  }

  private normalizeIntegerString(value: string | undefined) {
    if (!value?.trim()) {
      return '';
    }

    return this.toLatinDigits(value)
      .replace(/[\s,_٬،]/g, '')
      .trim();
  }

  private toLatinDigits(value: string) {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

    return value
      .split('')
      .map((character) => {
        const persianIndex = persianDigits.indexOf(character);

        if (persianIndex >= 0) {
          return String(persianIndex);
        }

        const arabicIndex = arabicDigits.indexOf(character);

        if (arabicIndex >= 0) {
          return String(arabicIndex);
        }

        return character;
      })
      .join('');
  }

  private addFieldTooLongError(
    row: ParsedProductCsvRow,
    field: ProductCsvColumn,
    value: string,
    maxLength: number,
  ) {
    this.addRowError(row, {
      code: 'FIELD_TOO_LONG',
      field,
      value,
      message: `مقدار ستون ${field} نباید بیشتر از ${maxLength} کاراکتر باشد.`,
    });
  }

  private addRowError(row: ParsedProductCsvRow, error: ProductCsvRowError) {
    const isDuplicate = row.errors.some(
      (current) =>
        current.code === error.code &&
        current.field === error.field &&
        current.value === error.value,
    );

    if (!isDuplicate) {
      row.errors.push(error);
    }
  }

  private accumulateMissingReference(
    target: Map<string, MissingReferenceAccumulator>,
    slug: string,
    input: {
      rowNumber: number;
      suggestedName?: string | null;
      suggestedParentSlug?: string | null;
    },
  ) {
    const current = target.get(slug) ?? {
      affectedRows: new Set<number>(),
      suggestedNames: new Set<string>(),
      suggestedParentSlugs: new Set<string>(),
    };

    current.affectedRows.add(input.rowNumber);

    if (input.suggestedName) {
      current.suggestedNames.add(input.suggestedName);
    }

    if (input.suggestedParentSlug) {
      current.suggestedParentSlugs.add(input.suggestedParentSlug);
    }

    target.set(slug, current);
  }

  private serializeMissingReferences(
    references: Map<string, MissingReferenceAccumulator>,
    includeParentSlugs = false,
  ) {
    return Array.from(references.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([slug, value]) => ({
        slug,
        affectedRows: Array.from(value.affectedRows).sort((left, right) => left - right),
        suggestedNames: Array.from(value.suggestedNames),
        ...(includeParentSlugs && {
          suggestedParentSlugs: Array.from(value.suggestedParentSlugs),
        }),
        canCreate: true,
      }));
  }

  private uniqueNonEmpty(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  private countNonEmpty(values: string[]) {
    const counts = new Map<string, number>();

    for (const value of values) {
      if (!value) {
        continue;
      }

      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return counts;
  }

  private findDuplicates(values: string[]) {
    return Array.from(
      new Set(values.filter((value, index) => values.indexOf(value) !== index)),
    );
  }

  private nullIfEmpty(value: string | undefined) {
    const normalized = value?.trim() ?? '';

    return normalized || null;
  }

  private escapeCsvCell(value: string) {
    if (!/[",\r\n]/.test(value)) {
      return value;
    }

    return `"${value.replace(/"/g, '""')}"`;
  }
}
