'use client';

import { useToast } from '@/components/providers/toast-provider';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { DataTable, type DataTableColumn } from '@/components/ui/data-table';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { PageHeader } from '@/components/ui/page-header';

import type {
  AdminInteractionImportPreview,
  AdminInteractionImportPreviewRow,
  AdminInteractionImportResult,
} from '@/lib/admin/interactions/import/admin-interaction-import.types';

import {
  normalizeAdminInteractionImportPreview,
  normalizeAdminInteractionImportResult,
} from '@/lib/admin/interactions/import/admin-interaction-import.types';

import { adminInteractionImportApi } from '@/lib/api/admin-interaction-import-client';

import { notifyAdminInteractionsChanged } from '@/lib/api/admin-interactions-client';

import { ClientApiError } from '@/lib/api/web-client';

import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';

import {
  AlertTriangle,
  Check,
  CircleCheck,
  Download,
  FileSpreadsheet,
  FileWarning,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';

import { useMemo, useRef, useState } from 'react';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${toPersianDigits(String(bytes))} بایت`;
  }

  if (bytes < 1024 * 1024) {
    return `${toPersianDigits((bytes / 1024).toFixed(1))} کیلوبایت`;
  }

  return `${toPersianDigits((bytes / 1024 / 1024).toFixed(2))} مگابایت`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'عملیات با خطا مواجه شد';
}

function validateCsvFile(file: File): string | null {
  const isCsv =
    file.name.toLowerCase().endsWith('.csv') ||
    file.type === 'text/csv' ||
    file.type === 'application/vnd.ms-excel';

  if (!isCsv) {
    return 'فقط فایل CSV قابل قبول است';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'حداکثر حجم فایل ۲ مگابایت است';
  }

  if (file.size === 0) {
    return 'فایل انتخاب‌شده خالی است';
  }

  return null;
}

function getTypeLabel(value: string | null) {
  switch (value?.toUpperCase()) {
    case 'REVIEW':
      return 'نظر';

    case 'QUESTION':
      return 'پرسش';

    default:
      return value ?? '—';
  }
}

function getSourceLabel(value: string | null) {
  switch (value?.toUpperCase()) {
    case 'INSTAGRAM':
      return 'اینستاگرام';

    case 'WHATSAPP':
      return 'واتساپ';

    case 'PHONE':
      return 'تلفن';

    case 'LEGACY':
      return 'سیستم قدیمی';

    default:
      return value ?? '—';
  }
}

export function AdminInteractionImportPageClient() {
  const { toast } = useToast();

  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<AdminInteractionImportPreview | null>(null);

  const [importResult, setImportResult] = useState<AdminInteractionImportResult | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const [isPreviewing, setIsPreviewing] = useState(false);

  const [isImporting, setIsImporting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  function resetImport() {
    setFile(null);

    setPreview(null);

    setImportResult(null);

    setConfirmOpen(false);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function selectFile(nextFile: File) {
    const error = validateCsvFile(nextFile);

    if (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: error,
      });

      return;
    }

    setFile(nextFile);

    setPreview(null);

    setImportResult(null);
  }

  async function handlePreview() {
    if (!file) {
      return;
    }

    setIsPreviewing(true);

    try {
      const response = await adminInteractionImportApi.preview(file);

      const normalized = normalizeAdminInteractionImportPreview(response.data);

      setPreview(normalized);

      if (normalized.valid) {
        toast({
          position: 'top-left',

          variant: 'success',

          title: 'فایل معتبر است و آماده Import می‌باشد',
        });
      } else {
        toast({
          position: 'top-left',

          variant: 'warning',

          title: 'برخی ردیف‌ها نیاز به اصلاح دارند',
        });
      }
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleImport() {
    if (!file || !preview?.valid) {
      return;
    }

    setIsImporting(true);

    try {
      const response = await adminInteractionImportApi.import(file);

      const normalized = normalizeAdminInteractionImportResult(response.data);

      setImportResult(normalized);

      setConfirmOpen(false);

      setFile(null);

      setPreview(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      notifyAdminInteractionsChanged();

      toast({
        position: 'top-left',

        variant: 'success',

        title: response.message ?? 'تعاملات با موفقیت وارد شدند',
      });
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true);

    try {
      const blob = await adminInteractionImportApi.downloadTemplate();

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement('a');

      anchor.href = url;

      anchor.download = 'partsanj-interactions-template.csv';

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  const columns = useMemo<DataTableColumn<AdminInteractionImportPreviewRow>[]>(
    () => [
      {
        key: 'rowNumber',

        header: 'ردیف',

        minWidth: '80px',

        cell: (row) => (
          <span className='font-bold text-foreground'>
            {toPersianDigits(String(row.rowNumber))}
          </span>
        ),
      },

      {
        key: 'status',

        header: 'وضعیت',

        minWidth: '130px',

        cell: (row) =>
          row.valid ? (
            <Badge variant='success' dot>
              معتبر
            </Badge>
          ) : row.duplicate ? (
            <Badge variant='warning' dot>
              تکراری
            </Badge>
          ) : (
            <Badge variant='danger' dot>
              نامعتبر
            </Badge>
          ),
      },

      {
        key: 'type',

        header: 'نوع',

        minWidth: '110px',

        cell: (row) => <Badge variant='info'>{getTypeLabel(row.type)}</Badge>,
      },

      {
        key: 'product',

        header: 'محصول',

        minWidth: '190px',

        cell: (row) => (
          <div className='min-w-0'>
            <p dir='ltr' className='truncate text-right text-sm font-bold text-foreground'>
              {row.productSku ?? '—'}
            </p>

            {row.productSlug ? (
              <p dir='ltr' className='mt-1 truncate text-right text-xs text-foreground-muted'>
                {row.productSlug}
              </p>
            ) : null}
          </div>
        ),
      },

      {
        key: 'author',

        header: 'نام مشتری',

        minWidth: '160px',

        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>
            {row.authorDisplayName ?? 'مشتری پارت‌سنج'}
          </span>
        ),
      },

      {
        key: 'rating',

        header: 'امتیاز',

        minWidth: '90px',

        cell: (row) =>
          row.rating !== null ? (
            <span className='font-extrabold text-brand'>
              {toPersianDigits(String(row.rating))} ★
            </span>
          ) : (
            <span className='text-foreground-muted'>—</span>
          ),
      },

      {
        key: 'source',

        header: 'منبع',

        minWidth: '130px',

        cell: (row) => (
          <span className='text-sm font-semibold text-foreground-secondary'>
            {getSourceLabel(row.source)}
          </span>
        ),
      },

      {
        key: 'body',

        header: 'محتوا',

        minWidth: '300px',

        cell: (row) => (
          <p className='line-clamp-2 text-sm leading-6 text-foreground-secondary'>
            {row.body ?? '—'}
          </p>
        ),
      },

      {
        key: 'errors',

        header: 'خطاها',

        minWidth: '280px',

        cell: (row) =>
          row.errors.length > 0 ? (
            <div className='space-y-1'>
              {row.errors.map((error, index) => (
                <p
                  key={`${row.rowNumber}-${index}`}
                  className='text-xs leading-5 font-semibold text-danger'
                >
                  {error}
                </p>
              ))}
            </div>
          ) : (
            <span className='text-xs font-semibold text-success'>بدون خطا</span>
          ),
      },
    ],
    [],
  );

  return (
    <>
      <div className='space-y-6'>
        <PageHeader
          title='ورود تعاملات از CSV'
          description='نظرات و پرسش‌های واقعی قبلی مشتریان را از منابع تاریخی وارد پارت‌سنج کنید'
          icon={<FileSpreadsheet className='size-5 lg:size-8' />}
          actions={
            <Button
              type='button'
              variant='outline'
              iconStart={<Download />}
              isLoading={isDownloadingTemplate}
              loadingLabel='در حال دریافت'
              onClick={() => void handleDownloadTemplate()}
            >
              دانلود فایل نمونه
            </Button>
          }
        />

        {importResult ? (
          <section className='rounded-card border border-success/25 bg-success-soft p-5'>
            <div className='flex items-start gap-3'>
              <span className='grid size-11 shrink-0 place-items-center rounded-full bg-surface text-success'>
                <CircleCheck className='size-6' />
              </span>

              <div className='min-w-0 flex-1'>
                <h2 className='font-extrabold text-foreground'>Import با موفقیت انجام شد</h2>

                <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                  اطلاعات فایل در یک عملیات کامل ثبت شد.
                </p>

                <div className='mt-4 flex flex-wrap gap-2'>
                  <Badge variant='success'>
                    {toPersianDigits(String(importResult.importedRows))} ردیف
                  </Badge>

                  {importResult.reviews > 0 ? (
                    <Badge variant='neutral'>
                      {toPersianDigits(String(importResult.reviews))} نظر
                    </Badge>
                  ) : null}

                  {importResult.questions > 0 ? (
                    <Badge variant='neutral'>
                      {toPersianDigits(String(importResult.questions))} پرسش
                    </Badge>
                  ) : null}
                </div>
              </div>

              <Button
                type='button'
                size='sm'
                variant='outline'
                iconStart={<RotateCcw />}
                onClick={resetImport}
              >
                Import جدید
              </Button>
            </div>
          </section>
        ) : null}

        <section className='rounded-card border border-border bg-surface p-5 shadow-panel'>
          <div className='flex items-start gap-3 border-b border-border pb-5'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <Upload className='size-5' />
            </span>

            <div>
              <h2 className='type-section-title text-foreground'>انتخاب فایل CSV</h2>

              <p className='mt-1 text-sm leading-6 text-foreground-muted'>
                حداکثر ۲۰۰ ردیف و حداکثر حجم فایل ۲ مگابایت
              </p>
            </div>
          </div>

          <div className='pt-5'>
            <input
              ref={inputRef}
              type='file'
              accept='.csv,text/csv'
              className='hidden'
              onChange={(event) => {
                const nextFile = event.target.files?.[0];

                if (nextFile) {
                  selectFile(nextFile);
                }
              }}
            />

            <div
              role='button'
              tabIndex={0}
              className={cn(
                'rounded-card border-2 border-dashed p-8 text-center transition outline-none',
                isDragging
                  ? 'border-brand bg-brand-soft'
                  : 'border-border bg-surface-muted hover:border-border-strong',
              )}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();

                  inputRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();

                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();

                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();

                setIsDragging(false);

                const nextFile = event.dataTransfer.files?.[0];

                if (nextFile) {
                  selectFile(nextFile);
                }
              }}
            >
              <FileSpreadsheet className='mx-auto size-12 text-brand' />

              <p className='mt-4 font-extrabold text-foreground'>فایل CSV را اینجا رها کنید</p>

              <p className='mt-1 text-sm text-foreground-muted'>یا برای انتخاب فایل کلیک کنید</p>
            </div>

            {file ? (
              <div className='mt-4 flex flex-col gap-3 rounded-control border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0'>
                  <p className='truncate font-bold text-foreground'>{file.name}</p>

                  <p className='mt-1 text-xs text-foreground-muted'>{formatFileSize(file.size)}</p>
                </div>

                <div className='flex gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    iconStart={<X />}
                    disabled={isPreviewing}
                    onClick={resetImport}
                  >
                    حذف فایل
                  </Button>

                  <Button
                    type='button'
                    size='sm'
                    iconStart={<FileSpreadsheet />}
                    isLoading={isPreviewing}
                    loadingLabel='در حال بررسی'
                    onClick={() => void handlePreview()}
                  >
                    بررسی فایل
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className='rounded-card border border-info/20 bg-info-soft p-4'>
          <p className='text-sm font-bold text-foreground'>ساختار فایل</p>

          <code
            dir='ltr'
            className='mt-3 block overflow-x-auto rounded-control bg-surface px-4 py-3 text-left text-xs text-foreground-secondary'
          >
            type,productSku,productSlug,authorDisplayName,rating,body,adminReply,source,sourceReference,sourceCreatedAt
          </code>

          <p className='mt-3 text-xs leading-6 text-foreground-muted'>
            این ابزار فقط برای واردکردن تعاملات واقعی قبلی مشتریان است. اگر نام مشتری مشخص نیست،
            مقدار نام می‌تواند خالی بماند تا «مشتری پارت‌سنج» استفاده شود.
          </p>
        </section>

        {preview ? (
          <>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='rounded-card border border-border bg-surface p-4'>
                <p className='text-xs font-bold text-foreground-muted'>کل ردیف‌ها</p>

                <p className='mt-2 text-2xl font-black text-foreground'>
                  {toPersianDigits(String(preview.totalRows))}
                </p>
              </div>

              <div className='rounded-card border border-success/20 bg-success-soft p-4'>
                <p className='text-xs font-bold text-success'>معتبر</p>

                <p className='mt-2 text-2xl font-black text-foreground'>
                  {toPersianDigits(String(preview.validRows))}
                </p>
              </div>

              <div className='rounded-card border border-danger/20 bg-danger-soft p-4'>
                <p className='text-xs font-bold text-danger'>نامعتبر</p>

                <p className='mt-2 text-2xl font-black text-foreground'>
                  {toPersianDigits(String(preview.invalidRows))}
                </p>
              </div>

              <div className='rounded-card border border-warning/20 bg-warning-soft p-4'>
                <p className='text-xs font-bold text-warning'>تکراری</p>

                <p className='mt-2 text-2xl font-black text-foreground'>
                  {toPersianDigits(String(preview.duplicateRows))}
                </p>
              </div>
            </div>

            <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
              <div className='flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h2 className='type-section-title text-foreground'>پیش‌نمایش Import</h2>

                  <p className='mt-1 text-sm text-foreground-muted'>
                    قبل از ثبت نهایی، تمام ردیف‌ها را بررسی کنید.
                  </p>
                </div>

                {preview.valid ? (
                  <Button type='button' iconStart={<Check />} onClick={() => setConfirmOpen(true)}>
                    Import نهایی
                  </Button>
                ) : (
                  <div className='flex items-center gap-2 rounded-control bg-danger-soft px-3 py-2 text-sm font-bold text-danger'>
                    <FileWarning className='size-4' />
                    ابتدا خطاهای فایل را اصلاح کنید
                  </div>
                )}
              </div>

              <div className='mt-5'>
                <DataTable
                  data={preview.rows}
                  columns={columns}
                  getRowId={(row) => String(row.rowNumber)}
                  tableClassName='min-w-[1500px]'
                  emptyTitle='ردیفی برای نمایش وجود ندارد'
                  emptyDescription='فایل CSV داده‌ای برای Preview ندارد'
                />
              </div>
            </section>
          </>
        ) : null}
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isImporting) {
            setConfirmOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأیید Import</DialogTitle>

            <DialogDescription>
              پس از تأیید، تمام ردیف‌های معتبر این فایل در دیتابیس ثبت می‌شوند.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className='flex gap-3 rounded-card border border-warning/20 bg-warning-soft p-4'>
              <AlertTriangle className='mt-0.5 size-5 shrink-0 text-warning' />

              <p className='text-sm leading-7 text-foreground-secondary'>
                این عملیات فقط برای تعاملات واقعی و قابل استناد مشتریان استفاده شود. اطلاعات ساختگی
                یا هویت‌های غیرواقعی وارد نکنید.
              </p>
            </div>

            <div className='mt-4 rounded-control border border-border p-4'>
              <p className='text-sm font-bold text-foreground'>
                {toPersianDigits(String(preview?.totalRows ?? 0))} ردیف آماده Import
              </p>

              <p className='mt-1 text-xs text-foreground-muted'>
                عملیات Backend به‌صورت Transaction انجام می‌شود.
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isImporting}
              onClick={() => setConfirmOpen(false)}
            >
              انصراف
            </Button>

            <Button
              type='button'
              isLoading={isImporting}
              loadingLabel='در حال Import'
              iconStart={<Upload />}
              onClick={() => void handleImport()}
            >
              تأیید و Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
