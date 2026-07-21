'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type {
  BrandImportPreview,
  CatalogImportEntity,
  CatalogImportRowAction,
  CatalogImportRowError,
  CategoryImportPreview,
  ProductImportPreview,
  QuickCreateCatalogReference,
} from '@/lib/admin/catalog/catalog-import.types';
import {
  AlertTriangle,
  CheckCircle2,
  FolderPlus,
  Tags,
} from 'lucide-react';

type CatalogImportPreviewTableProps = {
  entity: CatalogImportEntity;
  preview:
    | ProductImportPreview
    | BrandImportPreview
    | CategoryImportPreview;
  onQuickCreate: (
    reference: QuickCreateCatalogReference,
  ) => void;
};

function actionLabel(
  action: CatalogImportRowAction,
): string {
  if (action === 'CREATE') {
    return 'ایجاد';
  }

  if (action === 'UPDATE') {
    return 'به‌روزرسانی';
  }

  return '—';
}

function ActionBadge({
  action,
}: {
  action: CatalogImportRowAction;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
        action === 'CREATE' &&
          'bg-success-soft text-success',
        action === 'UPDATE' &&
          'bg-info-soft text-info',
        !action &&
          'bg-surface-muted text-foreground-muted',
      )}
    >
      {actionLabel(action)}
    </span>
  );
}

function ValidityBadge({
  valid,
}: {
  valid: boolean;
}) {
  return valid ? (
    <span className='inline-flex items-center gap-1.5 text-xs font-bold text-success'>
      <CheckCircle2 className='size-4' />
      معتبر
    </span>
  ) : (
    <span className='inline-flex items-center gap-1.5 text-xs font-bold text-danger'>
      <AlertTriangle className='size-4' />
      نیازمند اصلاح
    </span>
  );
}

type ProductErrorsProps = {
  errors: CatalogImportRowError[];
  preview: ProductImportPreview;
  onQuickCreate: (
    reference: QuickCreateCatalogReference,
  ) => void;
};

function ProductErrors({
  errors,
  preview,
  onQuickCreate,
}: ProductErrorsProps) {
  if (errors.length === 0) {
    return (
      <span className='text-xs text-foreground-muted'>
        بدون خطا
      </span>
    );
  }

  return (
    <div className='min-w-64 space-y-2'>
      {errors.map((error, index) => {
        const key = `${error.code}-${error.field}-${index}`;

        const missingBrand =
          error.code === 'BRAND_NOT_FOUND' && error.value
            ? preview.missingReferences.brands.find(
                (item) => item.slug === error.value,
              )
            : undefined;

        const missingCategory =
          error.code === 'CATEGORY_NOT_FOUND' &&
          error.value
            ? preview.missingReferences.categories.find(
                (item) => item.slug === error.value,
              )
            : undefined;

        return (
          <div
            key={key}
            className='rounded-control border border-danger/20 bg-danger-soft/60 p-2.5'
          >
            <p className='text-xs leading-5 text-danger'>
              {error.message}
            </p>

            {missingBrand?.canCreate ? (
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='mt-2'
                iconStart={<Tags className='size-3.5' />}
                onClick={() => {
                  onQuickCreate({
                    kind: 'brand',
                    slug: missingBrand.slug,
                    suggestedName:
                      missingBrand.suggestedNames[0] ??
                      missingBrand.slug,
                  });
                }}
              >
                ساخت برند
              </Button>
            ) : null}

            {missingCategory?.canCreate ? (
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='mt-2'
                iconStart={
                  <FolderPlus className='size-3.5' />
                }
                onClick={() => {
                  onQuickCreate({
                    kind: 'category',
                    slug: missingCategory.slug,
                    suggestedName:
                      missingCategory.suggestedNames[0] ??
                      missingCategory.slug,
                    suggestedParentSlug:
                      missingCategory
                        .suggestedParentSlugs?.[0] ?? '',
                  });
                }}
              >
                ساخت دسته‌بندی
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ReferenceErrors({
  errors,
}: {
  errors: CatalogImportRowError[];
}) {
  if (errors.length === 0) {
    return (
      <span className='text-xs text-foreground-muted'>
        بدون خطا
      </span>
    );
  }

  return (
    <div className='min-w-64 space-y-1.5'>
      {errors.map((error, index) => (
        <p
          key={`${error.code}-${error.field}-${index}`}
          className='rounded-control border border-danger/20 bg-danger-soft/60 px-2.5 py-2 text-xs leading-5 text-danger'
        >
          {error.message}
        </p>
      ))}
    </div>
  );
}

function ProductRows({
  preview,
  onQuickCreate,
}: {
  preview: ProductImportPreview;
  onQuickCreate: (
    reference: QuickCreateCatalogReference,
  ) => void;
}) {
  return (
    <>
      {preview.rows.map((row) => (
        <tr
          key={`${row.rowNumber}-${row.sku}`}
          className='border-b border-border last:border-b-0'
        >
          <td className='whitespace-nowrap px-4 py-3 text-sm text-foreground-secondary'>
            {row.rowNumber}
          </td>

          <td className='min-w-56 px-4 py-3'>
            <p className='text-sm font-bold text-foreground'>
              {row.name || 'بدون نام'}
            </p>

            <p
              dir='ltr'
              className='mt-1 text-left text-xs text-foreground-muted'
            >
              {row.sku || '—'}
            </p>
          </td>

          <td className='min-w-44 px-4 py-3'>
            <p
              dir='ltr'
              className='text-left text-xs font-medium text-foreground-secondary'
            >
              {row.brandSlug || '—'}
            </p>
          </td>

          <td className='min-w-44 px-4 py-3'>
            <p
              dir='ltr'
              className='text-left text-xs font-medium text-foreground-secondary'
            >
              {row.categorySlug || '—'}
            </p>
          </td>

          <td className='whitespace-nowrap px-4 py-3'>
            <ActionBadge action={row.action} />
          </td>

          <td className='whitespace-nowrap px-4 py-3'>
            <ValidityBadge valid={row.valid} />
          </td>

          <td className='px-4 py-3'>
            <ProductErrors
              errors={row.errors}
              preview={preview}
              onQuickCreate={onQuickCreate}
            />
          </td>
        </tr>
      ))}
    </>
  );
}

function BrandRows({
  preview,
}: {
  preview: BrandImportPreview;
}) {
  return (
    <>
      {preview.rows.map((row) => (
        <tr
          key={`${row.rowNumber}-${row.slug}`}
          className='border-b border-border last:border-b-0'
        >
          <td className='whitespace-nowrap px-4 py-3 text-sm text-foreground-secondary'>
            {row.rowNumber}
          </td>

          <td className='min-w-52 px-4 py-3'>
            <p className='text-sm font-bold text-foreground'>
              {row.name || 'بدون نام'}
            </p>
          </td>

          <td className='min-w-48 px-4 py-3'>
            <p
              dir='ltr'
              className='text-left text-xs font-medium text-foreground-secondary'
            >
              {row.slug || '—'}
            </p>
          </td>

          <td className='whitespace-nowrap px-4 py-3'>
            {row.isActive === null
              ? 'پیش‌فرض'
              : row.isActive
                ? 'فعال'
                : 'غیرفعال'}
          </td>

          <td className='whitespace-nowrap px-4 py-3'>
            <ActionBadge action={row.action} />
          </td>

          <td className='whitespace-nowrap px-4 py-3'>
            <ValidityBadge valid={row.valid} />
          </td>

          <td className='px-4 py-3'>
            <ReferenceErrors errors={row.errors} />
          </td>
        </tr>
      ))}
    </>
  );
}

function CategoryRows({
  preview,
}: {
  preview: CategoryImportPreview;
}) {
  return (
    <>
      {preview.rows.map((row) => (
        <tr
          key={`${row.rowNumber}-${row.slug}`}
          className='border-b border-border last:border-b-0'
        >
          <td className='whitespace-nowrap px-4 py-3 text-sm text-foreground-secondary'>
            {row.rowNumber}
          </td>

          <td className='min-w-52 px-4 py-3'>
            <p className='text-sm font-bold text-foreground'>
              {row.name || 'بدون نام'}
            </p>
          </td>

          <td className='min-w-48 px-4 py-3'>
            <p
              dir='ltr'
              className='text-left text-xs font-medium text-foreground-secondary'
            >
              {row.slug || '—'}
            </p>
          </td>

          <td className='min-w-48 px-4 py-3'>
            <p
              dir='ltr'
              className='text-left text-xs font-medium text-foreground-secondary'
            >
              {row.parentSlug || 'دسته اصلی'}
            </p>
          </td>

          <td className='whitespace-nowrap px-4 py-3'>
            <ActionBadge action={row.action} />
          </td>

          <td className='whitespace-nowrap px-4 py-3'>
            <ValidityBadge valid={row.valid} />
          </td>

          <td className='px-4 py-3'>
            <ReferenceErrors errors={row.errors} />
          </td>
        </tr>
      ))}
    </>
  );
}

export function CatalogImportPreviewTable({
  entity,
  preview,
  onQuickCreate,
}: CatalogImportPreviewTableProps) {
  return (
    <div className='overflow-hidden rounded-card border border-border bg-surface'>
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-start'>
          <thead className='bg-surface-muted'>
            <tr className='border-b border-border'>
              <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                ردیف
              </th>

              <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                {entity === 'products'
                  ? 'محصول / SKU'
                  : 'نام'}
              </th>

              <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                {entity === 'products'
                  ? 'برند'
                  : 'Slug'}
              </th>

              {entity === 'products' ? (
                <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                  دسته‌بندی
                </th>
              ) : null}

              {entity === 'categories' ? (
                <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                  والد
                </th>
              ) : null}

              {entity === 'brands' ? (
                <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                  وضعیت
                </th>
              ) : null}

              <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                عملیات
              </th>

              <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                اعتبار
              </th>

              <th className='px-4 py-3 text-start text-xs font-extrabold text-foreground-secondary'>
                خطاها
              </th>
            </tr>
          </thead>

          <tbody>
            {entity === 'products' ? (
              <ProductRows
                preview={preview as ProductImportPreview}
                onQuickCreate={onQuickCreate}
              />
            ) : null}

            {entity === 'brands' ? (
              <BrandRows
                preview={preview as BrandImportPreview}
              />
            ) : null}

            {entity === 'categories' ? (
              <CategoryRows
                preview={preview as CategoryImportPreview}
              />
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
