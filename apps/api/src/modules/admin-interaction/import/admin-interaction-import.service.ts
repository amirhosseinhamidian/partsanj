import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import {
  AdminAuditAction,
  AdminAuditEntityType,
  ContentModerationStatus,
  InteractionAuthorType,
  InteractionSource,
  Prisma,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import type {
  AdminInteractionCsvRow,
  AdminInteractionImportPreviewRow,
  AdminInteractionImportProduct,
  AdminInteractionImportType,
} from './admin-interaction-import.types.js';

const MAX_IMPORT_ROWS = 200;

const DEFAULT_IMPORTED_AUTHOR_NAME = 'مشتری پارت‌سنج';

const ALLOWED_IMPORT_SOURCES = new Set<InteractionSource>([
  InteractionSource.INSTAGRAM,
  InteractionSource.WHATSAPP,
  InteractionSource.PHONE,
  InteractionSource.LEGACY,
]);

@Injectable()
export class AdminInteractionImportService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(file: Express.Multer.File) {
    const rows = await this.buildPreview(file);

    const valid = rows.filter((row) => row.valid).length;
    const invalid = rows.length - valid;
    const duplicates = rows.filter((row) => row.duplicate).length;

    return {
      data: {
        rows,

        meta: {
          total: rows.length,
          valid,
          invalid,
          duplicates,
          canImport: rows.length > 0 && invalid === 0,
        },
      },
    };
  }

  async import(file: Express.Multer.File, actorUserId: string) {
    const rows = await this.buildPreview(file);

    const invalidRows = rows.filter((row) => !row.valid);

    if (invalidRows.length > 0) {
      throw new BadRequestException({
        message: 'CSV contains invalid rows. Preview and fix the file before importing.',

        invalidRows: invalidRows.map((row) => ({
          rowNumber: row.rowNumber,
          errors: row.errors,
        })),
      });
    }

    const now = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const settings = await transaction.siteSetting.findUnique({
        where: {
          id: 'site',
        },

        select: {
          supportDisplayName: true,
        },
      });

      const supportDisplayName = settings?.supportDisplayName?.trim() || 'پارت‌سنج';

      const importedItems: Array<{
        type: AdminInteractionImportType;
        id: string;
        productId: string;
        replyId: string | null;
      }> = [];

      let reviewCount = 0;
      let questionCount = 0;
      let replyCount = 0;

      for (const row of rows) {
        if (!row.valid || !row.type || !row.product || !row.source || !row.sourceReference) {
          continue;
        }

        const publishedAt = row.sourceCreatedAt ?? now;

        if (row.type === 'REVIEW') {
          const duplicate = await transaction.productReview.findFirst({
            where: {
              productId: row.product.id,
              source: row.source,
              sourceReference: row.sourceReference,
            },

            select: {
              id: true,
            },
          });

          if (duplicate) {
            throw new ConflictException(`Row ${row.rowNumber} was already imported`);
          }

          const review = await transaction.productReview.create({
            data: {
              productId: row.product.id,

              authorType: InteractionAuthorType.IMPORTED_CUSTOMER,

              authorDisplayName: row.authorDisplayName,

              rating: row.rating!,

              body: row.body,

              status: ContentModerationStatus.APPROVED,

              isVerifiedPurchase: false,

              source: row.source,

              sourceReference: row.sourceReference,

              sourceCreatedAt: row.sourceCreatedAt,

              moderatedAt: now,

              publishedAt,
            },

            select: {
              id: true,
            },
          });

          reviewCount += 1;

          await transaction.adminAuditLog.create({
            data: {
              actorUserId,

              entityType: AdminAuditEntityType.PRODUCT_REVIEW,

              entityId: review.id,

              entityLabel: `نظر واردشده ${row.product.name}`,

              action: AdminAuditAction.IMPORTED,

              changes: {
                import: {
                  type: 'REVIEW',
                  productId: row.product.id,
                  source: row.source,
                  sourceReference: row.sourceReference,
                  rowNumber: row.rowNumber,
                },
              },
            },
          });

          let replyId: string | null = null;

          if (row.adminReply) {
            const reply = await transaction.productReviewReply.create({
              data: {
                reviewId: review.id,

                authorUserId: actorUserId,

                authorType: InteractionAuthorType.STAFF,

                authorDisplayName: supportDisplayName,

                body: row.adminReply,

                status: ContentModerationStatus.APPROVED,

                source: InteractionSource.ADMIN,

                moderatedAt: now,

                publishedAt: now,
              },

              select: {
                id: true,
              },
            });

            replyId = reply.id;
            replyCount += 1;

            await transaction.adminAuditLog.create({
              data: {
                actorUserId,

                entityType: AdminAuditEntityType.PRODUCT_REVIEW_REPLY,

                entityId: reply.id,

                entityLabel: `پاسخ رسمی به نظر ${row.product.name}`,

                action: AdminAuditAction.REPLIED,

                changes: {
                  parentId: review.id,
                  importedWithParent: true,
                },
              },
            });
          }

          importedItems.push({
            type: 'REVIEW',
            id: review.id,
            productId: row.product.id,
            replyId,
          });

          continue;
        }

        if (row.type === 'QUESTION') {
          const duplicate = await transaction.productQuestion.findFirst({
            where: {
              productId: row.product.id,
              source: row.source,
              sourceReference: row.sourceReference,
            },

            select: {
              id: true,
            },
          });

          if (duplicate) {
            throw new ConflictException(`Row ${row.rowNumber} was already imported`);
          }

          const question = await transaction.productQuestion.create({
            data: {
              productId: row.product.id,

              authorType: InteractionAuthorType.IMPORTED_CUSTOMER,

              authorDisplayName: row.authorDisplayName,

              body: row.body!,

              status: ContentModerationStatus.APPROVED,

              source: row.source,

              sourceReference: row.sourceReference,

              sourceCreatedAt: row.sourceCreatedAt,

              moderatedAt: now,

              publishedAt,
            },

            select: {
              id: true,
            },
          });

          questionCount += 1;

          await transaction.adminAuditLog.create({
            data: {
              actorUserId,

              entityType: AdminAuditEntityType.PRODUCT_QUESTION,

              entityId: question.id,

              entityLabel: `پرسش واردشده ${row.product.name}`,

              action: AdminAuditAction.IMPORTED,

              changes: {
                import: {
                  type: 'QUESTION',
                  productId: row.product.id,
                  source: row.source,
                  sourceReference: row.sourceReference,
                  rowNumber: row.rowNumber,
                },
              },
            },
          });

          let replyId: string | null = null;

          if (row.adminReply) {
            const reply = await transaction.productQuestionReply.create({
              data: {
                questionId: question.id,

                authorUserId: actorUserId,

                authorType: InteractionAuthorType.STAFF,

                authorDisplayName: supportDisplayName,

                body: row.adminReply,

                status: ContentModerationStatus.APPROVED,

                source: InteractionSource.ADMIN,

                moderatedAt: now,

                publishedAt: now,
              },

              select: {
                id: true,
              },
            });

            replyId = reply.id;
            replyCount += 1;

            await transaction.adminAuditLog.create({
              data: {
                actorUserId,

                entityType: AdminAuditEntityType.PRODUCT_QUESTION_REPLY,

                entityId: reply.id,

                entityLabel: `پاسخ رسمی به پرسش ${row.product.name}`,

                action: AdminAuditAction.REPLIED,

                changes: {
                  parentId: question.id,
                  importedWithParent: true,
                },
              },
            });
          }

          importedItems.push({
            type: 'QUESTION',
            id: question.id,
            productId: row.product.id,
            replyId,
          });
        }
      }

      return {
        data: {
          imported: {
            total: reviewCount + questionCount,

            reviews: reviewCount,
            questions: questionCount,
            replies: replyCount,
          },

          items: importedItems,
        },
      };
    });
  }

  getTemplate() {
    /*
     * UTF-8 BOM باعث می‌شود Excel فایل فارسی
     * را معمولاً صحیح‌تر تشخیص دهد.
     */
    return [
      '\uFEFFtype,productSku,productSlug,authorDisplayName,rating,body,adminReply,source,sourceReference,sourceCreatedAt',

      'REVIEW,PART-001,,مشتری پارت‌سنج,5,"کیفیت قطعه خوب بود و بدون مشکل نصب شد.","ممنون از ثبت تجربه شما.",WHATSAPP,wa-example-001,2026-08-01T10:30:00+03:30',

      'QUESTION,,sample-product-slug,مشتری پارت‌سنج,,"آیا این قطعه برای مدل موردنظر من مناسب است؟","برای بررسی دقیق، مدل و تیپ خودرو را اعلام کنید.",INSTAGRAM,ig-example-001,2026-08-02T12:00:00+03:30',
    ].join('\n');
  }

  private async buildPreview(
    file: Express.Multer.File,
  ): Promise<AdminInteractionImportPreviewRow[]> {
    this.validateFile(file);

    const rawRows = this.parseCsv(file);

    if (rawRows.length === 0) {
      throw new BadRequestException('CSV file has no data rows');
    }

    if (rawRows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(`CSV may contain at most ${MAX_IMPORT_ROWS} rows`);
    }

    const productSkus = [
      ...new Set(
        rawRows
          .map((row) => this.clean(row.productSku))
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    const productSlugs = [
      ...new Set(
        rawRows
          .map((row) => this.clean(row.productSlug))
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    const productOr: Prisma.ProductWhereInput[] = [];

    if (productSkus.length > 0) {
      productOr.push({
        sku: {
          in: productSkus,
        },
      });
    }

    if (productSlugs.length > 0) {
      productOr.push({
        slug: {
          in: productSlugs,
        },
      });
    }

    const products =
      productOr.length > 0
        ? await this.prisma.product.findMany({
            where: {
              OR: productOr,
            },

            select: {
              id: true,
              sku: true,
              slug: true,
              name: true,
            },
          })
        : [];

    const productsBySku = new Map(products.map((product) => [product.sku, product]));

    const productsBySlug = new Map(products.map((product) => [product.slug, product]));

    const previewRows = rawRows.map((rawRow, index) =>
      this.normalizeRow(rawRow, index + 2, productsBySku, productsBySlug),
    );

    this.markFileDuplicates(previewRows);

    await this.markDatabaseDuplicates(previewRows);

    for (const row of previewRows) {
      row.valid = row.errors.length === 0;
    }

    return previewRows;
  }

  private parseCsv(file: Express.Multer.File): AdminInteractionCsvRow[] {
    try {
      return parse(file.buffer, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException(
        'CSV file could not be parsed. Check quotes, columns and encoding.',
      );
    }
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('Only .csv files are accepted');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }
  }

  private normalizeRow(
    rawRow: AdminInteractionCsvRow,
    rowNumber: number,

    productsBySku: Map<string, AdminInteractionImportProduct>,

    productsBySlug: Map<string, AdminInteractionImportProduct>,
  ): AdminInteractionImportPreviewRow {
    const errors: string[] = [];
    const warnings: string[] = [];

    const productSku = this.clean(rawRow.productSku);

    const productSlug = this.clean(rawRow.productSlug);

    const type = this.normalizeImportType(rawRow.type);

    if (!type) {
      errors.push('type must be REVIEW or QUESTION');
    }

    if (!productSku && !productSlug) {
      errors.push('productSku or productSlug is required');
    }

    const productFromSku = productSku ? (productsBySku.get(productSku) ?? null) : null;

    const productFromSlug = productSlug ? (productsBySlug.get(productSlug) ?? null) : null;

    if (productSku && !productFromSku) {
      errors.push(`Product SKU "${productSku}" was not found`);
    }

    if (productSlug && !productFromSlug) {
      errors.push(`Product slug "${productSlug}" was not found`);
    }

    if (productFromSku && productFromSlug && productFromSku.id !== productFromSlug.id) {
      errors.push('productSku and productSlug refer to different products');
    }

    const product = productFromSku ?? productFromSlug ?? null;

    let authorDisplayName = this.clean(rawRow.authorDisplayName) ?? DEFAULT_IMPORTED_AUTHOR_NAME;

    if (authorDisplayName.length > 100) {
      errors.push('authorDisplayName may contain at most 100 characters');

      authorDisplayName = authorDisplayName.slice(0, 100);
    }

    const body = this.clean(rawRow.body);

    const adminReply = this.clean(rawRow.adminReply);

    if (body && body.length > 3000) {
      errors.push('body may contain at most 3000 characters');
    }

    if (type === 'QUESTION' && (!body || body.length < 2)) {
      errors.push('QUESTION requires body text');
    }

    if (type === 'QUESTION' && body && body.length > 2000) {
      errors.push('QUESTION body may contain at most 2000 characters');
    }

    if (adminReply && adminReply.length > 3000) {
      errors.push('adminReply may contain at most 3000 characters');
    }

    const rating = this.normalizeRating(rawRow.rating);

    if (type === 'REVIEW' && rating === null) {
      errors.push('REVIEW requires rating from 1 to 5');
    }

    if (type === 'QUESTION' && rating !== null) {
      errors.push('QUESTION must not contain rating');
    }

    const source = this.normalizeSource(rawRow.source);

    if (!source) {
      errors.push('source must be INSTAGRAM, WHATSAPP, PHONE or LEGACY');
    }

    let sourceCreatedAt: Date | null = null;

    const sourceCreatedAtText = this.clean(rawRow.sourceCreatedAt);

    if (sourceCreatedAtText) {
      const date = new Date(sourceCreatedAtText);

      if (Number.isNaN(date.getTime())) {
        errors.push('sourceCreatedAt is not a valid date');
      } else if (date.getTime() > Date.now() + 5 * 60 * 1000) {
        errors.push('sourceCreatedAt cannot be in the future');
      } else {
        sourceCreatedAt = date;
      }
    }

    let sourceReference = this.clean(rawRow.sourceReference);

    if (sourceReference && sourceReference.length > 255) {
      errors.push('sourceReference may contain at most 255 characters');
    }

    if (!sourceReference && type && product && source) {
      sourceReference = this.createGeneratedReference({
        type,
        productId: product.id,
        source,
        authorDisplayName,
        rating,
        body,
        sourceCreatedAt,
      });

      warnings.push('sourceReference was generated automatically');
    }

    return {
      rowNumber,

      valid: errors.length === 0,

      duplicate: false,

      errors,
      warnings,

      type,

      product,

      authorDisplayName,

      rating,

      body,

      adminReply,

      source,

      sourceReference,

      sourceCreatedAt,
    };
  }

  private normalizeImportType(value: unknown): AdminInteractionImportType | null {
    const normalized = this.clean(value)?.toUpperCase();

    if (normalized === 'REVIEW' || normalized === 'PRODUCT_REVIEW') {
      return 'REVIEW';
    }

    if (normalized === 'QUESTION' || normalized === 'PRODUCT_QUESTION') {
      return 'QUESTION';
    }

    return null;
  }

  private normalizeSource(value: unknown): InteractionSource | null {
    const normalized = (this.clean(value) ?? 'LEGACY').toUpperCase();

    const candidate = normalized as InteractionSource;

    if (ALLOWED_IMPORT_SOURCES.has(candidate)) {
      return candidate;
    }

    return null;
  }

  private normalizeRating(value: unknown): number | null {
    const text = this.clean(value);

    if (!text) {
      return null;
    }

    const rating = Number(text);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return null;
    }

    return rating;
  }

  private clean(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  private createGeneratedReference(input: {
    type: AdminInteractionImportType;

    productId: string;

    source: InteractionSource;

    authorDisplayName: string;

    rating: number | null;

    body: string | null;

    sourceCreatedAt: Date | null;
  }) {
    const value = [
      input.type,
      input.productId,
      input.source,
      input.authorDisplayName,
      input.rating ?? '',
      input.body ?? '',
      input.sourceCreatedAt?.toISOString() ?? '',
    ].join('|');

    const hash = createHash('sha256').update(value).digest('hex');

    return `import:${hash}`;
  }

  private markFileDuplicates(rows: AdminInteractionImportPreviewRow[]) {
    const seen = new Map<string, number>();

    for (const row of rows) {
      if (!row.type || !row.product || !row.source || !row.sourceReference) {
        continue;
      }

      const key = [row.type, row.product.id, row.source, row.sourceReference].join(':');

      const previousRow = seen.get(key);

      if (previousRow) {
        row.duplicate = true;

        row.errors.push(`Duplicate of CSV row ${previousRow}`);

        continue;
      }

      seen.set(key, row.rowNumber);
    }
  }

  private async markDatabaseDuplicates(rows: AdminInteractionImportPreviewRow[]) {
    const reviewRows = rows.filter(
      (
        row,
      ): row is AdminInteractionImportPreviewRow & {
        type: 'REVIEW';
        product: AdminInteractionImportProduct;
        source: InteractionSource;
        sourceReference: string;
      } =>
        row.type === 'REVIEW' &&
        Boolean(row.product) &&
        Boolean(row.source) &&
        Boolean(row.sourceReference),
    );

    const questionRows = rows.filter(
      (
        row,
      ): row is AdminInteractionImportPreviewRow & {
        type: 'QUESTION';
        product: AdminInteractionImportProduct;
        source: InteractionSource;
        sourceReference: string;
      } =>
        row.type === 'QUESTION' &&
        Boolean(row.product) &&
        Boolean(row.source) &&
        Boolean(row.sourceReference),
    );

    const existingReviews =
      reviewRows.length > 0
        ? await this.prisma.productReview.findMany({
            where: {
              OR: reviewRows.map((row) => ({
                productId: row.product.id,

                source: row.source,

                sourceReference: row.sourceReference,
              })),
            },

            select: {
              productId: true,
              source: true,
              sourceReference: true,
            },
          })
        : [];

    const existingQuestions =
      questionRows.length > 0
        ? await this.prisma.productQuestion.findMany({
            where: {
              OR: questionRows.map((row) => ({
                productId: row.product.id,

                source: row.source,

                sourceReference: row.sourceReference,
              })),
            },

            select: {
              productId: true,
              source: true,
              sourceReference: true,
            },
          })
        : [];

    const reviewKeys = new Set(
      existingReviews.map((row) => [row.productId, row.source, row.sourceReference].join(':')),
    );

    const questionKeys = new Set(
      existingQuestions.map((row) => [row.productId, row.source, row.sourceReference].join(':')),
    );

    for (const row of reviewRows) {
      const key = [row.product.id, row.source, row.sourceReference].join(':');

      if (reviewKeys.has(key)) {
        row.duplicate = true;

        row.errors.push('This review was already imported');
      }
    }

    for (const row of questionRows) {
      const key = [row.product.id, row.source, row.sourceReference].join(':');

      if (questionKeys.has(key)) {
        row.duplicate = true;

        row.errors.push('This question was already imported');
      }
    }
  }
}
