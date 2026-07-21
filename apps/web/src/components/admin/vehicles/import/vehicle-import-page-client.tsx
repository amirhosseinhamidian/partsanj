'use client';

import { useToast } from '@/components/providers/toast-provider';
import { VehicleImportPreviewTable } from '@/components/admin/vehicles/import/vehicle-import-preview-table';
import { VehicleImportQuickCreateDialog } from '@/components/admin/vehicles/import/vehicle-import-quick-create-dialog';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import type {
  AdminVehicleMakeListItem,
} from '@/lib/admin/vehicles/vehicle-management.types';
import type {
  VehicleImportEntity,
  VehicleImportExecutionResult,
  VehicleImportMode,
  VehicleImportPreview,
  VehicleQuickCreateReference,
} from '@/lib/admin/vehicles/vehicle-import.types';
import { adminVehicleImportApi } from '@/lib/api/admin-vehicle-import-client';
import { adminVehiclesApi } from '@/lib/api/admin-vehicles-client';
import { ClientApiError } from '@/lib/api/web-client';
import { cn } from '@/lib/utils/cn';
import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileUp,
  Layers3,
  RefreshCw,
  Route,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const ENTITY_OPTIONS: Array<{
  value: VehicleImportEntity;
  label: string;
  description: string;
  icon: typeof CarFront;
}> = [
  { value: 'makes', label: 'برند خودرو', description: 'سازنده‌ها و برندهای خودرو', icon: CarFront },
  { value: 'models', label: 'مدل خودرو', description: 'مدل‌های وابسته به هر برند', icon: Route },
  { value: 'variants', label: 'تیپ / موتور', description: 'تیپ، موتور و بازه سال هر مدل', icon: Layers3 },
];

const MODE_OPTIONS = [
  { label: 'فقط ایجاد موارد جدید', value: 'CREATE_ONLY' },
  { label: 'ایجاد یا به‌روزرسانی', value: 'UPSERT' },
] satisfies Array<{ label: string; value: VehicleImportMode }>;

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function unauthorized(error: unknown) {
  if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
    window.location.assign('/admin/login');
    return true;
  }
  return false;
}

export function VehicleImportPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [entity, setEntity] = useState<VehicleImportEntity>('makes');
  const [mode, setMode] = useState<VehicleImportMode>('CREATE_ONLY');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<VehicleImportPreview | null>(null);
  const [result, setResult] = useState<VehicleImportExecutionResult | null>(null);
  const [makes, setMakes] = useState<AdminVehicleMakeListItem[]>([]);
  const [quickCreate, setQuickCreate] = useState<VehicleQuickCreateReference | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadReferences = useCallback(async () => {
    try {
      const makeResponse = await adminVehiclesApi.listMakes();
      setMakes(makeResponse.data);
    } catch (loadError) {
      if (!unauthorized(loadError)) setError(message(loadError, 'دریافت اطلاعات خودروها با خطا مواجه شد'));
    }
  }, []);

  useEffect(() => { void loadReferences(); }, [loadReferences]);

  const runPreview = useCallback(async (target: File, silent = false) => {
    setIsPreviewing(true);
    setError(null);
    setResult(null);
    try {
      const next = await adminVehicleImportApi.preview(entity, target, mode);
      setPreview(next);
      if (!silent) {
        toast({
          position: 'top-left',
          variant: next.summary.invalidRows ? 'warning' : 'success',
          title: next.summary.invalidRows ? 'فایل بررسی شد و نیاز به اصلاح دارد' : 'فایل با موفقیت بررسی شد',
        });
      }
      return next;
    } catch (previewError) {
      if (!unauthorized(previewError)) setError(message(previewError, 'بررسی فایل با خطا مواجه شد'));
      setPreview(null);
      return null;
    } finally {
      setIsPreviewing(false);
    }
  }, [entity, mode, toast]);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const busy = isPreviewing || isExecuting || isDownloading || isCreating;

  async function createReference(input: {
    kind: 'make' | 'model';
    name: string;
    slug: string;
    makeSlug?: string;
  }) {
    if (!file) throw new Error('فایل CSV در دسترس نیست');
    setIsCreating(true);
    try {
      if (input.kind === 'make') {
        await adminVehiclesApi.createMake({
          name: input.name,
          slug: input.slug,
          isActive: true,
          sortOrder: 0,
        });
      } else {
        const make = makes.find((item) => item.slug === input.makeSlug);
        if (!make) throw new Error('برند خودرو پیدا نشد');
        await adminVehiclesApi.createModel({
          makeId: make.id,
          name: input.name,
          slug: input.slug,
          isActive: true,
          sortOrder: 0,
        });
      }
      setQuickCreate(null);
      await loadReferences();
      toast({ position: 'top-left', variant: 'success', title: input.kind === 'make' ? 'برند خودرو ساخته شد' : 'مدل خودرو ساخته شد' });
      await runPreview(file, true);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='ورود گروهی خودروها'
        description='برند، مدل و تیپ یا موتور خودروها را با CSV وارد یا به‌روزرسانی کنید'
        icon={<FileSpreadsheet className='size-5 lg:size-8' />}
        actions={<Button type='button' variant='outline' onClick={() => router.push('/admin/vehicles')}>بازگشت به خودروها</Button>}
      />

      <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-6'>
        <div className='grid gap-3 md:grid-cols-3'>
          {ENTITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.value === entity;
            return (
              <button
                key={option.value}
                type='button'
                disabled={busy}
                onClick={() => {
                  setEntity(option.value);
                  setFile(null);
                  reset();
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className={cn(
                  'rounded-card border p-4 text-start transition-colors',
                  selected ? 'border-brand bg-brand-soft' : 'border-border hover:border-brand/40 hover:bg-surface-muted',
                )}
              >
                <span className={cn('grid size-10 place-items-center rounded-control', selected ? 'bg-brand text-white' : 'bg-surface-muted text-foreground-secondary')}>
                  <Icon className='size-5' />
                </span>
                <span className='mt-3 block text-sm font-extrabold text-foreground'>{option.label}</span>
                <span className='mt-1 block text-xs leading-5 text-foreground-secondary'>{option.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-6'>
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]'>
          <div className='space-y-4'>
            <input
              ref={inputRef}
              type='file'
              accept='.csv,text/csv'
              disabled={busy}
              className='sr-only'
              onChange={(event) => {
                reset();
                const next = event.target.files?.[0] ?? null;
                if (!next) return setFile(null);
                if (!next.name.toLowerCase().endsWith('.csv')) return setError('فقط فایل CSV مجاز است');
                if (next.size > MAX_FILE_BYTES) return setError('حجم فایل نباید بیشتر از ۲ مگابایت باشد');
                setFile(next);
              }}
            />
            <div className={cn('rounded-card border border-dashed p-5', file ? 'border-success/40 bg-success-soft/40' : 'border-border bg-surface-muted')}>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='grid size-11 place-items-center rounded-control bg-surface text-foreground-muted'>
                    {file ? <CheckCircle2 className='size-5 text-success' /> : <Upload className='size-5' />}
                  </span>
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-bold text-foreground'>{file?.name ?? 'فایلی انتخاب نشده است'}</p>
                    <p className='mt-1 text-xs text-foreground-muted'>CSV UTF-8، حداکثر ۲ مگابایت و ۵۰۰ ردیف</p>
                  </div>
                </div>
                <Button type='button' variant='outline' disabled={busy} iconStart={<FileUp className='size-4' />} onClick={() => inputRef.current?.click()}>
                  انتخاب فایل
                </Button>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <Select
              id='vehicle-import-mode'
              label='حالت Import'
              value={mode}
              options={MODE_OPTIONS}
              disabled={busy}
              onValueChange={(value) => {
                setMode(value as VehicleImportMode);
                reset();
              }}
            />
            <Button
              type='button'
              variant='outline'
              fullWidth
              isLoading={isDownloading}
              loadingLabel='در حال دانلود'
              iconStart={<Download className='size-4' />}
              onClick={async () => {
                setIsDownloading(true);
                try { await adminVehicleImportApi.downloadTemplate(entity); }
                catch (downloadError) { if (!unauthorized(downloadError)) setError(message(downloadError, 'دانلود قالب با خطا مواجه شد')); }
                finally { setIsDownloading(false); }
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
            disabled={!file || busy}
            isLoading={isPreviewing}
            loadingLabel='در حال بررسی'
            iconStart={<RefreshCw className='size-4' />}
            onClick={() => file && void runPreview(file)}
          >
            {preview ? 'بررسی مجدد فایل' : 'بررسی فایل'}
          </Button>
          <Button
            type='button'
            disabled={!file || !preview || preview.summary.invalidRows > 0 || busy}
            isLoading={isExecuting}
            loadingLabel='در حال ثبت'
            iconStart={<Upload className='size-4' />}
            onClick={async () => {
              if (!file || !preview) return;
              setIsExecuting(true);
              setError(null);
              try {
                const executed = await adminVehicleImportApi.execute(entity, file, mode);
                setResult(executed);
                toast({ position: 'top-left', variant: 'success', title: 'Import خودروها با موفقیت انجام شد', description: `شناسه عملیات: ${executed.batchId}` });
              } catch (executeError) {
                if (!unauthorized(executeError)) setError(message(executeError, 'ثبت نهایی با خطا مواجه شد'));
              } finally {
                setIsExecuting(false);
              }
            }}
          >
            ثبت نهایی
          </Button>
        </div>
      </section>

      {error ? (
        <section className='rounded-card border border-danger/30 bg-danger-soft p-4'>
          <div className='flex gap-3'><AlertTriangle className='size-5 text-danger' /><p className='text-sm font-semibold text-danger'>{error}</p></div>
        </section>
      ) : null}

      {preview ? (
        <section className='space-y-4'>
          <div className='grid grid-cols-2 gap-3 lg:grid-cols-5'>
            {[
              ['کل ردیف‌ها', preview.summary.totalRows],
              ['معتبر', preview.summary.validRows],
              ['نامعتبر', preview.summary.invalidRows],
              ['ایجاد', preview.summary.createCount],
              ['به‌روزرسانی', preview.summary.updateCount],
            ].map(([label, value]) => (
              <div key={String(label)} className='rounded-card border border-border bg-surface p-4 shadow-panel'>
                <p className='text-xs text-foreground-muted'>{label}</p>
                <p className='mt-2 text-2xl font-black text-foreground'>{value}</p>
              </div>
            ))}
          </div>
          <VehicleImportPreviewTable entity={entity} preview={preview} onQuickCreate={setQuickCreate} />
        </section>
      ) : null}

      {result ? (
        <section className='rounded-card border border-success/30 bg-success-soft p-5'>
          <div className='flex gap-3'>
            <CheckCircle2 className='size-6 text-success' />
            <div>
              <h2 className='font-extrabold text-foreground'>Import با موفقیت انجام شد</h2>
              <p className='mt-2 text-sm text-foreground-secondary'>{result.summary.createdCount} مورد ایجاد و {result.summary.updatedCount} مورد به‌روزرسانی شد.</p>
              <p dir='ltr' className='mt-2 break-all text-left text-xs text-foreground-muted'>Batch ID: {result.batchId}</p>
            </div>
          </div>
        </section>
      ) : null}

      <VehicleImportQuickCreateDialog
        reference={quickCreate}
        makes={makes}
        isSubmitting={isCreating}
        onClose={() => setQuickCreate(null)}
        onCreate={createReference}
      />
    </div>
  );
}
