'use client';

import { CatalogImportPreviewTable } from '@/components/admin/catalog/import/catalog-import-preview-table';
import { CatalogImportQuickCreateDialog } from '@/components/admin/catalog/import/catalog-import-quick-create-dialog';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useToast } from '@/components/providers/toast-provider';
import { adminBrandsApi } from '@/lib/api/admin-brands-client';
import { adminCatalogImportApi } from '@/lib/api/admin-catalog-import-client';
import { adminCategoriesApi } from '@/lib/api/admin-categories-client';
import { ClientApiError } from '@/lib/api/web-client';
import type { AdminCategory } from '@/lib/admin/catalog/category.types';
import type {
  BrandImportPreview,
  CatalogImportEntity,
  CatalogImportExecutionResult,
  CatalogImportMode,
  CatalogImportPreview,
  CategoryImportPreview,
  ProductImportPreview,
  QuickCreateCatalogReference,
  QuickCreateCatalogReferenceInput,
} from '@/lib/admin/catalog/catalog-import.types';
import { cn } from '@/lib/utils/cn';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  FolderTree,
  Package,
  RefreshCw,
  Tags,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Select } from '@/components/ui/select';

const MAX_CSV_FILE_BYTES = 2 * 1024 * 1024;

const IMPORT_MODE_OPTIONS = [
  {
    label: 'فقط ایجاد موارد جدید',
    value: 'CREATE_ONLY',
  },
  {
    label: 'ایجاد یا به‌روزرسانی',
    value: 'UPSERT',
  },
] satisfies Array<{
  label: string;
  value: CatalogImportMode;
}>;

const ENTITY_OPTIONS: Array<{
  value: CatalogImportEntity;
  label: string;
  description: string;
  icon: typeof Package;
}> = [
  {
    value: 'products',
    label: 'محصولات',
    description: 'ثبت یا به‌روزرسانی محصولات بدون تصاویر',
    icon: Package,
  },
  {
    value: 'brands',
    label: 'برندها',
    description: 'ساخت یا به‌روزرسانی برندها با CSV',
    icon: Tags,
  },
  {
    value: 'categories',
    label: 'دسته‌بندی‌ها',
    description: 'ساخت ساختار دسته‌بندی و رابطه والد و فرزند',
    icon: FolderTree,
  },
];

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function redirectWhenUnauthorized(error: unknown): boolean {
  if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
    window.location.assign('/admin/login');
    return true;
  }

  return false;
}

function getPreviewSummary(preview: CatalogImportPreview) {
  return preview.summary;
}

function getExecutionSummary(result: CatalogImportExecutionResult) {
  return result.summary;
}

export function CatalogImportPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entity, setEntity] = useState<CatalogImportEntity>('products');

  const [mode, setMode] = useState<CatalogImportMode>('CREATE_ONLY');

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);

  const [executionResult, setExecutionResult] = useState<CatalogImportExecutionResult | null>(null);

  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [quickCreateReference, setQuickCreateReference] =
    useState<QuickCreateCatalogReference | null>(null);

  const [pageError, setPageError] = useState<string | null>(null);

  const [isPreviewing, setIsPreviewing] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const [isCreatingReference, setIsCreatingReference] = useState(false);

  const resetResultState = useCallback(() => {
    setPreview(null);
    setExecutionResult(null);
    setPageError(null);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const result = await adminCategoriesApi.list();
      setCategories(result);
    } catch (error) {
      if (redirectWhenUnauthorized(error)) {
        return;
      }

      setPageError(getErrorMessage(error, 'دریافت دسته‌بندی‌ها با خطا مواجه شد'));
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const runPreview = useCallback(
    async (
      targetFile: File,
      options?: {
        silentSuccess?: boolean;
      },
    ) => {
      setIsPreviewing(true);
      setPageError(null);
      setExecutionResult(null);

      try {
        const result = await adminCatalogImportApi.preview(entity, targetFile, mode);

        setPreview(result);

        if (!options?.silentSuccess) {
          toast({
            position: 'top-left',
            variant: result.summary.invalidRows > 0 ? 'warning' : 'success',
            title:
              result.summary.invalidRows > 0
                ? 'فایل بررسی شد و نیاز به اصلاح دارد'
                : 'فایل با موفقیت بررسی شد',
          });
        }

        return result;
      } catch (error) {
        if (redirectWhenUnauthorized(error)) {
          return null;
        }

        setPreview(null);
        setPageError(getErrorMessage(error, 'بررسی فایل CSV با خطا مواجه شد'));

        return null;
      } finally {
        setIsPreviewing(false);
      }
    },
    [entity, mode, toast],
  );

  function handleEntityChange(nextEntity: CatalogImportEntity) {
    if (nextEntity === entity) {
      return;
    }

    setEntity(nextEntity);
    setFile(null);
    setQuickCreateReference(null);
    resetResultState();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleModeChange(nextMode: CatalogImportMode) {
    if (nextMode === mode) {
      return;
    }

    setMode(nextMode);
    resetResultState();
  }

  function handleFileChange(nextFile: File | null) {
    resetResultState();

    if (!nextFile) {
      setFile(null);
      return;
    }

    const hasCsvExtension = nextFile.name.toLowerCase().endsWith('.csv');

    if (!hasCsvExtension) {
      setFile(null);
      setPageError('فقط فایل با پسوند CSV مجاز است');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    if (nextFile.size > MAX_CSV_FILE_BYTES) {
      setFile(null);
      setPageError('حجم فایل CSV نباید بیشتر از ۲ مگابایت باشد');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return;
    }

    setFile(nextFile);
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);
    setPageError(null);

    try {
      await adminCatalogImportApi.downloadTemplate(entity);
    } catch (error) {
      if (redirectWhenUnauthorized(error)) {
        return;
      }

      setPageError(getErrorMessage(error, 'دانلود قالب CSV با خطا مواجه شد'));
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  async function handlePreview() {
    if (!file) {
      setPageError('ابتدا فایل CSV را انتخاب کن');
      return;
    }

    await runPreview(file);
  }

  async function handleExecute() {
    if (!file || !preview) {
      setPageError('قبل از ثبت نهایی، فایل را بررسی کن');
      return;
    }

    if (preview.summary.invalidRows > 0) {
      setPageError('تا زمان رفع همه خطاها امکان ثبت نهایی وجود ندارد');
      return;
    }

    setIsExecuting(true);
    setPageError(null);

    try {
      const result = await adminCatalogImportApi.execute(entity, file, mode);

      setExecutionResult(result);

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'Import با موفقیت انجام شد',
        description: `شناسه عملیات: ${result.batchId}`,
      });
    } catch (error) {
      if (redirectWhenUnauthorized(error)) {
        return;
      }

      setPageError(getErrorMessage(error, 'ثبت نهایی فایل CSV با خطا مواجه شد'));
    } finally {
      setIsExecuting(false);
    }
  }

  async function handleQuickCreate(input: QuickCreateCatalogReferenceInput) {
    if (!file) {
      setPageError('فایل CSV در دسترس نیست');
      return;
    }

    setIsCreatingReference(true);
    setPageError(null);

    try {
      if (input.kind === 'brand') {
        await adminBrandsApi.create({
          name: input.name,
          slug: input.slug,
          isActive: true,
        });
      } else {
        const parent = input.parentSlug
          ? categories.find((category) => category.slug === input.parentSlug)
          : undefined;

        if (input.parentSlug && !parent) {
          throw new Error('دسته‌بندی والد انتخاب‌شده پیدا نشد');
        }

        await adminCategoriesApi.create({
          name: input.name,
          slug: input.slug,
          parentId: parent?.id,
          sortOrder: 0,
          isActive: true,
          showOnHome: false,
        });

        await loadCategories();
      }

      setQuickCreateReference(null);

      toast({
        position: 'top-left',
        variant: 'success',
        title: input.kind === 'brand' ? 'برند ساخته شد' : 'دسته‌بندی ساخته شد',
      });

      await runPreview(file, {
        silentSuccess: true,
      });
    } catch (error) {
      if (redirectWhenUnauthorized(error)) {
        return;
      }

      setPageError(
        getErrorMessage(
          error,
          input.kind === 'brand' ? 'ساخت برند با خطا مواجه شد' : 'ساخت دسته‌بندی با خطا مواجه شد',
        ),
      );

      throw error;
    } finally {
      setIsCreatingReference(false);
    }
  }

  const summary = preview ? getPreviewSummary(preview) : null;

  const executionSummary = executionResult ? getExecutionSummary(executionResult) : null;

  const isBusy = isPreviewing || isExecuting || isDownloadingTemplate || isCreatingReference;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='ورود گروهی کاتالوگ'
        description='محصولات، برندها و دسته‌بندی‌ها را با فایل CSV بررسی و ثبت کن'
        icon={<FileSpreadsheet className='size-5' />}
        actions={
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              router.push('/admin/catalog/products');
            }}
          >
            بازگشت به محصولات
          </Button>
        }
      />

      <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-6'>
        <div className='grid gap-3 md:grid-cols-3'>
          {ENTITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = option.value === entity;

            return (
              <button
                key={option.value}
                type='button'
                disabled={isBusy}
                onClick={() => {
                  handleEntityChange(option.value);
                }}
                className={cn(
                  'rounded-card border p-4 text-start transition-colors disabled:pointer-events-none disabled:opacity-60',
                  isSelected
                    ? 'border-brand bg-brand-soft shadow-[0_0_0_3px_rgba(37,99,235,0.08)]'
                    : 'border-border bg-surface hover:border-brand/40 hover:bg-surface-muted',
                )}
              >
                <span
                  className={cn(
                    'grid size-10 place-items-center rounded-control',
                    isSelected
                      ? 'bg-brand text-white'
                      : 'bg-surface-muted text-foreground-secondary',
                  )}
                >
                  <Icon className='size-5' />
                </span>

                <span className='mt-3 block text-sm font-extrabold text-foreground'>
                  {option.label}
                </span>

                <span className='mt-1 block text-xs leading-5 text-foreground-secondary'>
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-6'>
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]'>
          <div className='space-y-4'>
            <div>
              <h2 className='text-base font-extrabold text-foreground'>فایل CSV</h2>

              <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                فایل حداکثر ۲ مگابایت و شامل حداکثر ۵۰۰ ردیف باشد.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type='file'
              accept='.csv,text/csv'
              disabled={isBusy}
              className='sr-only'
              onChange={(event) => {
                handleFileChange(event.target.files?.[0] ?? null);
              }}
            />

            <div
              className={cn(
                'rounded-card border border-dashed p-5',
                file ? 'border-success/40 bg-success-soft/40' : 'border-border bg-surface-muted',
              )}
            >
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-control',
                      file ? 'bg-success-soft text-success' : 'bg-surface text-foreground-muted',
                    )}
                  >
                    {file ? <CheckCircle2 className='size-5' /> : <Upload className='size-5' />}
                  </span>

                  <div className='min-w-0'>
                    <p className='truncate text-sm font-bold text-foreground'>
                      {file ? file.name : 'هنوز فایلی انتخاب نشده است'}
                    </p>

                    <p className='mt-1 text-xs text-foreground-muted'>
                      {file
                        ? `${Math.max(1, Math.ceil(file.size / 1024))} کیلوبایت`
                        : 'فایل خروجی Excel را با فرمت CSV UTF-8 ذخیره کن'}
                    </p>
                  </div>
                </div>

                <Button
                  type='button'
                  variant='outline'
                  disabled={isBusy}
                  iconStart={<FileUp className='size-4' />}
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  انتخاب فایل
                </Button>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <label className='block space-y-2'>
              <Select
                id='blog-post-category'
                label='حالت Import'
                value={mode}
                options={IMPORT_MODE_OPTIONS}
                disabled={isBusy}
                onValueChange={(value) => {
                  handleModeChange(value as CatalogImportMode);
                }}
              />
            </label>

            <Button
              type='button'
              variant='outline'
              fullWidth
              isLoading={isDownloadingTemplate}
              loadingLabel='در حال دانلود'
              iconStart={<Download className='size-4' />}
              onClick={() => {
                void handleDownloadTemplate();
              }}
            >
              دانلود قالب CSV
            </Button>
          </div>
        </div>

        <div className='mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            disabled={!file || isBusy}
            isLoading={isPreviewing}
            loadingLabel='در حال بررسی'
            iconStart={<RefreshCw className='size-4' />}
            onClick={() => {
              void handlePreview();
            }}
          >
            {preview ? 'بررسی مجدد فایل' : 'بررسی فایل'}
          </Button>

          <Button
            type='button'
            disabled={!file || !preview || preview.summary.invalidRows > 0 || isBusy}
            isLoading={isExecuting}
            loadingLabel='در حال ثبت'
            iconStart={<Upload className='size-4' />}
            onClick={() => {
              void handleExecute();
            }}
          >
            ثبت نهایی
          </Button>
        </div>
      </section>

      {entity === 'products' ? (
        <section className='rounded-card border border-info/30 bg-info-soft p-4'>
          <p className='text-sm font-bold text-foreground'>تصاویر محصولات از CSV ثبت نمی‌شوند</p>

          <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
            محصولات جدید به‌صورت پیش‌نویس و بدون انتشار ساخته می‌شوند. تصویر هر محصول را بعداً از
            صفحه ویرایش همان محصول آپلود کن.
          </p>
        </section>
      ) : null}

      {pageError ? (
        <section className='rounded-card border border-danger/30 bg-danger-soft p-4'>
          <div className='flex items-start gap-3'>
            <AlertTriangle className='mt-0.5 size-5 shrink-0 text-danger' />

            <p className='text-sm leading-6 font-semibold text-danger'>{pageError}</p>
          </div>
        </section>
      ) : null}

      {summary ? (
        <section className='space-y-4'>
          <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
            {[
              {
                label: 'کل ردیف‌ها',
                value: summary.totalRows,
              },
              {
                label: 'معتبر',
                value: summary.validRows,
              },
              {
                label: 'نامعتبر',
                value: summary.invalidRows,
              },
              {
                label: 'ایجاد',
                value: summary.createCount,
              },
              {
                label: 'به‌روزرسانی',
                value: summary.updateCount,
              },
            ].map((item) => (
              <div
                key={item.label}
                className='rounded-card border border-border bg-surface p-4 shadow-panel'
              >
                <p className='text-xs font-medium text-foreground-muted'>{item.label}</p>

                <p className='mt-2 text-2xl font-black text-foreground'>{item.value}</p>
              </div>
            ))}
          </div>

          <CatalogImportPreviewTable
            entity={entity}
            preview={preview as ProductImportPreview | BrandImportPreview | CategoryImportPreview}
            onQuickCreate={(reference) => {
              setQuickCreateReference(reference);
            }}
          />
        </section>
      ) : null}

      {executionSummary && executionResult ? (
        <section className='rounded-card border border-success/30 bg-success-soft p-5'>
          <div className='flex items-start gap-3'>
            <CheckCircle2 className='mt-0.5 size-6 shrink-0 text-success' />

            <div>
              <h2 className='text-base font-extrabold text-foreground'>
                Import با موفقیت انجام شد
              </h2>

              <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
                {executionSummary.createdCount} مورد ایجاد و {executionSummary.updatedCount} مورد
                به‌روزرسانی شد.
              </p>

              <p dir='ltr' className='mt-2 text-left text-xs break-all text-foreground-muted'>
                Batch ID: {executionResult.batchId}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <CatalogImportQuickCreateDialog
        reference={quickCreateReference}
        categories={categories}
        isSubmitting={isCreatingReference}
        onClose={() => {
          setQuickCreateReference(null);
        }}
        onCreate={handleQuickCreate}
      />
    </div>
  );
}
