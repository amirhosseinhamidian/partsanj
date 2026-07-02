'use client';

import type { AdminProductCompatibility } from '@/lib/admin/catalog/product.types';
import type {
  AdminVehicleVariant,
  VehicleYearCalendar,
} from '@/lib/admin/catalog/vehicle-catalog.types';
import { adminProductCompatibilitiesApi } from '@/lib/api/admin-product-compatibilities-client';
import { adminVehicleCatalogApi } from '@/lib/api/admin-vehicle-catalog-client';
import { ClientApiError } from '@/lib/api/web-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/ui/form-field';
import { IconButton } from '@/components/ui/icon-button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import {
  AlertTriangle,
  CarFront,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';

const MAX_COMPATIBILITIES = 100;

type CompatibilityVehicleVariant = {
  id: string;
  name: string;
  slug: string;
  engineCode: string | null;
  engineName: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  yearCalendar: VehicleYearCalendar;
  isActive: boolean;
  model: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    make: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
    };
  };
};

type CompatibilityDraft = {
  vehicleVariantId: string;
  vehicleVariant: CompatibilityVehicleVariant;
  notes: string;
  requiresVerification: boolean;
};

type ProductCompatibilitySectionProps = {
  productId: string;
  disabled?: boolean;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ClientApiError && (error.status === 401 || error.status === 403);
}

function formatVehicleYears(
  vehicle: Pick<CompatibilityVehicleVariant, 'yearFrom' | 'yearTo' | 'yearCalendar'>,
): string | null {
  const calendarLabel = vehicle.yearCalendar === 'SHAMSI' ? 'شمسی' : 'میلادی';

  const from = toPersianDigits(vehicle.yearFrom ?? 0);
  const to = toPersianDigits(vehicle.yearTo ?? 0);

  if (from && to) {
    return `مدل ${from} تا ${to} · ${calendarLabel}`;
  }

  if (from) {
    return `از مدل ${from} · ${calendarLabel}`;
  }

  if (to) {
    return `تا مدل ${to} · ${calendarLabel}`;
  }

  return null;
}

function formatEngine(
  vehicle: Pick<CompatibilityVehicleVariant, 'engineCode' | 'engineName'>,
): string | null {
  const parts = [
    vehicle.engineName,
    vehicle.engineCode ? `کد موتور: ${vehicle.engineCode}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

function toCompatibilityVehicleVariant(
  compatibility: AdminProductCompatibility,
): CompatibilityVehicleVariant {
  return {
    id: compatibility.vehicleVariant.id,
    name: compatibility.vehicleVariant.name,
    slug: compatibility.vehicleVariant.slug,
    engineCode: compatibility.vehicleVariant.engineCode,
    engineName: compatibility.vehicleVariant.engineName,
    yearFrom: compatibility.vehicleVariant.yearFrom,
    yearTo: compatibility.vehicleVariant.yearTo,
    yearCalendar: compatibility.vehicleVariant.yearCalendar,
    isActive: compatibility.vehicleVariant.isActive,
    model: {
      id: compatibility.vehicleVariant.model.id,
      name: compatibility.vehicleVariant.model.name,
      slug: compatibility.vehicleVariant.model.slug,
      isActive: compatibility.vehicleVariant.model.isActive,
      make: {
        id: compatibility.vehicleVariant.model.make.id,
        name: compatibility.vehicleVariant.model.make.name,
        slug: compatibility.vehicleVariant.model.make.slug,
        isActive: compatibility.vehicleVariant.model.make.isActive,
      },
    },
  };
}

function toCompatibilityDraft(compatibility: AdminProductCompatibility): CompatibilityDraft {
  return {
    vehicleVariantId: compatibility.vehicleVariant.id,
    vehicleVariant: toCompatibilityVehicleVariant(compatibility),
    notes: compatibility.notes ?? '',
    requiresVerification: compatibility.requiresVerification,
  };
}

function toDraftFromVehicleVariant(
  vehicleVariant: AdminVehicleVariant,
  notes: string,
  requiresVerification: boolean,
): CompatibilityDraft {
  return {
    vehicleVariantId: vehicleVariant.id,
    vehicleVariant: {
      id: vehicleVariant.id,
      name: vehicleVariant.name,
      slug: vehicleVariant.slug,
      engineCode: vehicleVariant.engineCode,
      engineName: vehicleVariant.engineName,
      yearFrom: vehicleVariant.yearFrom,
      yearTo: vehicleVariant.yearTo,
      yearCalendar: vehicleVariant.yearCalendar,
      isActive: true,
      model: {
        id: vehicleVariant.model.id,
        name: vehicleVariant.model.name,
        slug: vehicleVariant.model.slug,
        isActive: true,
        make: {
          id: vehicleVariant.model.make.id,
          name: vehicleVariant.model.make.name,
          slug: vehicleVariant.model.make.slug,
          isActive: true,
        },
      },
    },
    notes,
    requiresVerification,
  };
}

function getDraftSignature(items: CompatibilityDraft[]): string {
  return JSON.stringify(
    items
      .map((item) => ({
        vehicleVariantId: item.vehicleVariantId,
        notes: item.notes.trim(),
        requiresVerification: item.requiresVerification,
      }))
      .sort((first, second) => first.vehicleVariantId.localeCompare(second.vehicleVariantId)),
  );
}

export function ProductCompatibilitySection({
  productId,
  disabled = false,
}: ProductCompatibilitySectionProps) {
  const [compatibilities, setCompatibilities] = useState<CompatibilityDraft[]>([]);

  const [persistedSignature, setPersistedSignature] = useState('[]');

  const [makes, setMakes] = useState<
    Awaited<ReturnType<typeof adminVehicleCatalogApi.listMakes>>['data']
  >([]);

  const [models, setModels] = useState<
    Awaited<ReturnType<typeof adminVehicleCatalogApi.listModels>>['data']
  >([]);

  const [variants, setVariants] = useState<
    Awaited<ReturnType<typeof adminVehicleCatalogApi.listVariants>>['data']
  >([]);

  const [selectedMakeId, setSelectedMakeId] = useState('');

  const [selectedModelId, setSelectedModelId] = useState('');

  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [compatibilityNotes, setCompatibilityNotes] = useState('');

  const [requiresVerification, setRequiresVerification] = useState(true);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [isModelsLoading, setIsModelsLoading] = useState(false);

  const [isVariantsLoading, setIsVariantsLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectionError, setSelectionError] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const modelRequestId = useRef(0);
  const variantRequestId = useRef(0);

  const isDirty = useMemo(
    () => getDraftSignature(compatibilities) !== persistedSignature,
    [compatibilities, persistedSignature],
  );

  const makeOptions = useMemo(
    () =>
      makes.map((make) => ({
        value: make.id,
        label: make.name,
        description: make.slug,
      })),
    [makes],
  );

  const modelOptions = useMemo(
    () =>
      models.map((model) => ({
        value: model.id,
        label: model.name,
        description: model.slug,
      })),
    [models],
  );

  const variantOptions = useMemo(
    () =>
      variants.map((variant) => {
        const description = [formatEngine(variant), formatVehicleYears(variant)]
          .filter(Boolean)
          .join(' · ');

        return {
          value: variant.id,
          label: variant.name,
          description: description || 'بدون اطلاعات تکمیلی',
        };
      }),
    [variants],
  );

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [selectedVariantId, variants],
  );

  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true);
    setLoadError(null);
    setSaveSuccess(false);

    try {
      const [makesResult, compatibilitiesResult] = await Promise.all([
        adminVehicleCatalogApi.listMakes(),
        adminProductCompatibilitiesApi.list(productId),
      ]);

      const nextCompatibilities =
        compatibilitiesResult.data.compatibilities.map(toCompatibilityDraft);

      setMakes(makesResult.data);
      setCompatibilities(nextCompatibilities);
      setPersistedSignature(getDraftSignature(nextCompatibilities));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        window.location.assign('/admin/login');
        return;
      }

      setLoadError(getErrorMessage(error, 'دریافت اطلاعات سازگاری خودرو با خطا مواجه شد'));
    } finally {
      setIsInitialLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  async function handleMakeChange(makeId: string) {
    if (disabled || isSaving) {
      return;
    }

    setSelectedMakeId(makeId);
    setSelectedModelId('');
    setSelectedVariantId('');
    setModels([]);
    setVariants([]);
    setSelectionError(null);

    if (!makeId) {
      return;
    }

    const requestId = modelRequestId.current + 1;

    modelRequestId.current = requestId;

    setIsModelsLoading(true);

    try {
      const result = await adminVehicleCatalogApi.listModels(makeId);

      if (requestId !== modelRequestId.current) {
        return;
      }

      setModels(result.data);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        window.location.assign('/admin/login');
        return;
      }

      if (requestId !== modelRequestId.current) {
        return;
      }

      setSelectionError(getErrorMessage(error, 'دریافت مدل‌های خودرو با خطا مواجه شد'));
    } finally {
      if (requestId === modelRequestId.current) {
        setIsModelsLoading(false);
      }
    }
  }

  async function handleModelChange(modelId: string) {
    if (disabled || isSaving) {
      return;
    }

    setSelectedModelId(modelId);
    setSelectedVariantId('');
    setVariants([]);
    setSelectionError(null);

    if (!modelId) {
      return;
    }

    const requestId = variantRequestId.current + 1;

    variantRequestId.current = requestId;

    setIsVariantsLoading(true);

    try {
      const result = await adminVehicleCatalogApi.listVariants(modelId);

      if (requestId !== variantRequestId.current) {
        return;
      }

      setVariants(result.data);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        window.location.assign('/admin/login');
        return;
      }

      if (requestId !== variantRequestId.current) {
        return;
      }

      setSelectionError(getErrorMessage(error, 'دریافت تیپ‌ها و موتورهای خودرو با خطا مواجه شد'));
    } finally {
      if (requestId === variantRequestId.current) {
        setIsVariantsLoading(false);
      }
    }
  }

  function handleAddCompatibility() {
    if (disabled || isSaving) {
      return;
    }

    setSelectionError(null);
    setSaveSuccess(false);

    if (!selectedVariant) {
      setSelectionError('ابتدا تیپ یا موتور خودرو را انتخاب کنید');

      return;
    }

    if (compatibilities.some((item) => item.vehicleVariantId === selectedVariant.id)) {
      setSelectionError('این تیپ خودرو قبلاً به محصول اضافه شده است');

      return;
    }

    if (compatibilities.length >= MAX_COMPATIBILITIES) {
      setSelectionError(
        `برای هر محصول حداکثر ${toPersianDigits(MAX_COMPATIBILITIES)} سازگاری قابل ثبت است`,
      );

      return;
    }

    setCompatibilities((current) => [
      ...current,
      toDraftFromVehicleVariant(selectedVariant, compatibilityNotes.trim(), requiresVerification),
    ]);

    setSelectedVariantId('');
    setCompatibilityNotes('');
    setRequiresVerification(true);
  }

  function updateCompatibility(
    vehicleVariantId: string,
    patch: Partial<Pick<CompatibilityDraft, 'notes' | 'requiresVerification'>>,
  ) {
    setCompatibilities((current) =>
      current.map((item) =>
        item.vehicleVariantId === vehicleVariantId
          ? {
              ...item,
              ...patch,
            }
          : item,
      ),
    );

    setSaveError(null);
    setSaveSuccess(false);
  }

  function removeCompatibility(vehicleVariantId: string) {
    if (disabled || isSaving) {
      return;
    }

    setCompatibilities((current) =>
      current.filter((item) => item.vehicleVariantId !== vehicleVariantId),
    );

    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSaveCompatibilities() {
    if (disabled || isSaving || !isDirty) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await adminProductCompatibilitiesApi.replace(productId, {
        items: compatibilities.map((item) => ({
          vehicleVariantId: item.vehicleVariantId,
          requiresVerification: item.requiresVerification,
          ...(item.notes.trim()
            ? {
                notes: item.notes.trim(),
              }
            : {}),
        })),
      });

      const nextCompatibilities = result.data.compatibilities.map(toCompatibilityDraft);

      setCompatibilities(nextCompatibilities);
      setPersistedSignature(getDraftSignature(nextCompatibilities));
      setSaveSuccess(true);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        window.location.assign('/admin/login');
        return;
      }

      setSaveError(getErrorMessage(error, 'ذخیره سازگاری‌های خودرو با خطا مواجه شد'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
      <div className='flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='type-section-title text-foreground'>سازگاری خودرو</h2>

            {isDirty ? (
              <Badge size='sm' variant='warning'>
                تغییرات ذخیره نشده
              </Badge>
            ) : null}

            {saveSuccess ? (
              <Badge size='sm' variant='success'>
                ذخیره شد
              </Badge>
            ) : null}
          </div>

          <p className='mt-1 text-sm leading-6 text-foreground-muted'>
            قطعه را فقط به تیپ و موتور دقیق خودرو متصل کنید تا احتمال ارسال قطعه اشتباه کاهش پیدا
            کند
          </p>
        </div>

        <Button
          type='button'
          size='sm'
          variant='outline'
          iconStart={<RefreshCw />}
          disabled={isInitialLoading || isModelsLoading || isVariantsLoading || isSaving}
          onClick={() => void loadInitialData()}
        >
          بروزرسانی
        </Button>
      </div>

      {disabled ? (
        <div className='mt-5 flex gap-3 rounded-control border border-warning/30 bg-warning-soft p-4 text-warning'>
          <AlertTriangle className='mt-0.5 size-5 shrink-0' />

          <p className='text-sm leading-6'>
            محصول آرشیو شده است و سازگاری‌های آن قابل ویرایش نیستند
          </p>
        </div>
      ) : null}

      {loadError ? (
        <div
          role='alert'
          className='mt-5 flex flex-col gap-3 rounded-control border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <p className='text-sm font-semibold text-danger'>{loadError}</p>

          <Button
            type='button'
            size='sm'
            variant='outline'
            iconStart={<RefreshCw />}
            onClick={() => void loadInitialData()}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      {isInitialLoading ? (
        <div className='mt-5 space-y-4'>
          <div className='h-12 animate-pulse rounded-control bg-surface-muted' />
          <div className='h-40 animate-pulse rounded-card bg-surface-muted' />
        </div>
      ) : null}

      {!isInitialLoading && !loadError ? (
        <div className='mt-5 space-y-6'>
          <div className='rounded-card border border-border bg-surface-muted p-4'>
            <div className='flex items-center gap-2'>
              <CarFront className='size-5 text-brand' />

              <h3 className='font-bold text-foreground'>افزودن سازگاری جدید</h3>
            </div>

            <div className='mt-4 grid gap-4 lg:grid-cols-3'>
              <FormField label='برند خودرو'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Combobox
                    id={id}
                    value={selectedMakeId}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    options={makeOptions}
                    clearable
                    disabled={disabled || isSaving}
                    onValueChange={(value) => void handleMakeChange(value)}
                    placeholder='انتخاب برند'
                    searchPlaceholder='جستجو در برندها'
                    emptyMessage='برند خودرویی پیدا نشد'
                  />
                )}
              </FormField>

              <FormField label='مدل خودرو'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Combobox
                    id={id}
                    value={selectedModelId}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    options={modelOptions}
                    clearable
                    loading={isModelsLoading}
                    disabled={disabled || isSaving || !selectedMakeId}
                    onValueChange={(value) => void handleModelChange(value)}
                    placeholder='انتخاب مدل'
                    searchPlaceholder='جستجو در مدل‌ها'
                    emptyMessage='مدلی پیدا نشد'
                  />
                )}
              </FormField>

              <FormField label='تیپ / موتور / بازه سال'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Combobox
                    id={id}
                    value={selectedVariantId}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    options={variantOptions}
                    clearable
                    loading={isVariantsLoading}
                    disabled={disabled || isSaving || !selectedModelId}
                    onValueChange={setSelectedVariantId}
                    placeholder='انتخاب تیپ یا موتور'
                    searchPlaceholder='جستجو در تیپ‌ها'
                    emptyMessage='تیپ یا موتور فعالی پیدا نشد'
                  />
                )}
              </FormField>
            </div>

            {selectedVariant ? (
              <div className='mt-4 rounded-control border border-brand/25 bg-brand-soft p-4'>
                <p className='font-bold text-foreground'>
                  {selectedVariant.model.make.name} · {selectedVariant.model.name} ·{' '}
                  {selectedVariant.name}
                </p>

                <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground-secondary'>
                  {formatEngine(selectedVariant) ? (
                    <span>{formatEngine(selectedVariant)}</span>
                  ) : null}

                  {formatVehicleYears(selectedVariant) ? (
                    <span>{formatVehicleYears(selectedVariant)}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]'>
              <FormField
                label='یادداشت فنی'
                helperText='مثلاً رنگ بدنه سنسور و نوع سوکت باید قبل از ارسال بررسی شود'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    maxLength={1000}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={disabled || isSaving}
                    value={compatibilityNotes}
                    onChange={(event) => setCompatibilityNotes(event.target.value)}
                    placeholder='یادداشت فنی اختیاری'
                  />
                )}
              </FormField>

              <FormField
                label='نیازمند تأیید فنی'
                helperText='برای قطعاتی که باید قبل از ارسال تطبیق داده شوند فعال بماند'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={disabled || isSaving}
                    checked={requiresVerification}
                    onCheckedChange={setRequiresVerification}
                  />
                )}
              </FormField>
            </div>

            {selectionError ? (
              <div
                role='alert'
                className='mt-4 flex gap-2 rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger'
              >
                <CircleAlert className='size-4 shrink-0' />
                {selectionError}
              </div>
            ) : null}

            <div className='mt-4 flex justify-end'>
              <Button
                type='button'
                iconStart={<Plus />}
                disabled={disabled || isSaving || !selectedVariantId}
                onClick={handleAddCompatibility}
              >
                افزودن سازگاری
              </Button>
            </div>
          </div>

          <div>
            <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
              <div>
                <h3 className='font-bold text-foreground'>سازگاری‌های ثبت‌شده</h3>

                <p className='mt-1 text-sm text-foreground-muted'>
                  {toPersianDigits(compatibilities.length)} مورد ثبت شده است
                </p>
              </div>

              <Button
                type='button'
                iconStart={isSaving ? <LoaderCircle className='animate-spin' /> : <Save />}
                isLoading={isSaving}
                disabled={disabled || isSaving || !isDirty}
                onClick={() => void handleSaveCompatibilities()}
              >
                ذخیره سازگاری‌ها
              </Button>
            </div>

            {saveError ? (
              <div
                role='alert'
                className='mb-4 rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger'
              >
                {saveError}
              </div>
            ) : null}

            {compatibilities.length === 0 ? (
              <div className='flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-muted px-5 py-10 text-center'>
                <CarFront className='size-8 text-foreground-muted' />

                <p className='mt-3 font-bold text-foreground'>هنوز سازگاری خودرویی ثبت نشده است</p>

                <p className='mt-1 max-w-lg text-sm leading-6 text-foreground-muted'>
                  برند، مدل و تیپ دقیق خودرو را از بخش بالا انتخاب و به محصول اضافه کنید
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {compatibilities.map((compatibility, index) => {
                  const vehicle = compatibility.vehicleVariant;

                  const hasInactiveVehicle =
                    !vehicle.isActive || !vehicle.model.isActive || !vehicle.model.make.isActive;

                  return (
                    <article
                      key={compatibility.vehicleVariantId}
                      className={cn(
                        'rounded-card border border-border bg-surface p-4',
                        hasInactiveVehicle && 'border-warning/40 bg-warning-soft',
                      )}
                    >
                      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                        <div className='min-w-0'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <p className='font-bold text-foreground'>
                              {vehicle.model.make.name} · {vehicle.model.name} · {vehicle.name}
                            </p>

                            {index === 0 ? (
                              <Badge size='sm' variant='brand'>
                                سازگاری اول
                              </Badge>
                            ) : null}

                            {compatibility.requiresVerification ? (
                              <Badge size='sm' variant='warning'>
                                نیازمند تأیید
                              </Badge>
                            ) : (
                              <Badge size='sm' variant='success'>
                                تأیید مستقیم
                              </Badge>
                            )}

                            {hasInactiveVehicle ? (
                              <Badge size='sm' variant='danger'>
                                غیرفعال در کاتالوگ خودرو
                              </Badge>
                            ) : null}
                          </div>

                          <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground-secondary'>
                            {formatEngine(vehicle) ? <span>{formatEngine(vehicle)}</span> : null}

                            {formatVehicleYears(vehicle) ? (
                              <span>{formatVehicleYears(vehicle)}</span>
                            ) : null}
                          </div>
                        </div>

                        <Tooltip content='حذف سازگاری'>
                          <span className='inline-flex'>
                            <IconButton
                              type='button'
                              aria-label={`حذف سازگاری ${vehicle.model.make.name} ${vehicle.model.name} ${vehicle.name}`}
                              icon={<Trash2 />}
                              variant='danger'
                              size='sm'
                              disabled={disabled || isSaving}
                              onClick={() => removeCompatibility(compatibility.vehicleVariantId)}
                            />
                          </span>
                        </Tooltip>
                      </div>

                      <div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]'>
                        <FormField label='یادداشت فنی'>
                          {({ id, labelId, describedBy, invalid }) => (
                            <Textarea
                              id={id}
                              rows={3}
                              maxLength={1000}
                              aria-labelledby={labelId}
                              aria-describedby={describedBy}
                              aria-invalid={invalid}
                              disabled={disabled || isSaving}
                              value={compatibility.notes}
                              onChange={(event) =>
                                updateCompatibility(compatibility.vehicleVariantId, {
                                  notes: event.target.value,
                                })
                              }
                              placeholder='یادداشت فنی اختیاری'
                            />
                          )}
                        </FormField>

                        <FormField label='نیازمند تأیید فنی' helperText='پیش از ارسال بررسی شود'>
                          {({ id, labelId, describedBy, invalid }) => (
                            <Switch
                              id={id}
                              aria-labelledby={labelId}
                              aria-describedby={describedBy}
                              aria-invalid={invalid}
                              disabled={disabled || isSaving}
                              checked={compatibility.requiresVerification}
                              onCheckedChange={(checked) =>
                                updateCompatibility(compatibility.vehicleVariantId, {
                                  requiresVerification: checked,
                                })
                              }
                            />
                          )}
                        </FormField>
                      </div>

                      {compatibility.requiresVerification ? (
                        <div className='mt-4 flex gap-2 rounded-control border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning'>
                          <ClipboardCheck className='size-4 shrink-0' />
                          پیش از ارسال، تطبیق فنی قطعه با خودرو باید انجام شود
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {!disabled && isDirty ? (
            <div className='flex gap-2 rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning'>
              <AlertTriangle className='size-4 shrink-0' />
              تغییرات سازگاری خودرو تا زمانی که دکمه «ذخیره سازگاری‌ها» را نزنید در دیتابیس ثبت
              نمی‌شوند
            </div>
          ) : null}

          {saveSuccess ? (
            <div className='flex gap-2 rounded-control border border-success/30 bg-success-soft px-4 py-3 text-sm text-success'>
              <CheckCircle2 className='size-4 shrink-0' />
              سازگاری‌های خودرو با موفقیت ذخیره شدند
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
