'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { storefrontVehiclesApi } from '@/lib/api/storefront-vehicles-client';
import { readStorefrontVehicleSelection } from '@/lib/storefront/vehicles/vehicle-selection-storage';
import type { StorefrontProductCompatibility } from '@/lib/storefront/catalog/catalog.types';
import type {
  StorefrontVehicleMake,
  StorefrontVehicleModel,
  StorefrontVehicleSelection,
  StorefrontVehicleSelectionInput,
  StorefrontVehicleVariant,
} from '@/lib/storefront/vehicles/vehicle.types';
import { CarFront, CheckCircle2, CircleAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';

type CompatibilityCheckResult = {
  vehicleVariantId: string;
  compatibility: StorefrontProductCompatibility | null;
};

type ProductCompatibilityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  compatibilities: StorefrontProductCompatibility[];
  initialSelection?: StorefrontVehicleSelectionInput;
  onVehicleConfirmed: (selection: StorefrontVehicleSelection) => void;
};

function formatYear(value: number): string {
  return toPersianDigits(value);
}

function getVariantDetails(variant: StorefrontVehicleVariant): string {
  const details: string[] = [];

  if (variant.engineName) {
    details.push(variant.engineName);
  }

  if (variant.engineCode) {
    details.push(`کد موتور: ${variant.engineCode}`);
  }

  const calendarLabel = variant.yearCalendar === 'GREGORIAN' ? 'میلادی' : 'شمسی';

  if (variant.yearFrom !== null && variant.yearTo !== null) {
    details.push(
      `${formatYear(variant.yearFrom)} تا ${formatYear(variant.yearTo)} ${calendarLabel}`,
    );
  } else if (variant.yearFrom !== null) {
    details.push(`از ${formatYear(variant.yearFrom)} ${calendarLabel}`);
  } else if (variant.yearTo !== null) {
    details.push(`تا ${formatYear(variant.yearTo)} ${calendarLabel}`);
  }

  return details.join(' · ') || 'جزئیات فنی ثبت نشده است';
}

function CompatibilityResult({ result }: { result: CompatibilityCheckResult }) {
  if (!result.compatibility) {
    return (
      <div className='rounded-card border border-danger/30 bg-danger-soft p-4'>
        <div className='flex gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-control bg-surface text-danger'>
            <TriangleAlert className='size-5' />
          </span>

          <div>
            <h3 className='text-sm font-extrabold text-danger'>
              تطابق این قطعه با خودروی شما تأیید نشده است
            </h3>

            <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
              این خودرو در فهرست سازگاری‌های ثبت‌شده برای این قطعه وجود ندارد
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (result.compatibility.requiresVerification) {
    return (
      <div className='rounded-card border border-warning/30 bg-warning-soft p-4'>
        <div className='flex gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-control bg-surface text-warning'>
            <ShieldCheck className='size-5' />
          </span>

          <div>
            <h3 className='text-sm font-extrabold text-warning'>
              قطعه سازگار است، اما نیازمند بررسی پیش از ارسال است
            </h3>

            <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
              تطبیق اولیه ثبت شده است، اما مشخصات فنی باید پیش از ارسال بررسی شود
            </p>

            {result.compatibility.notes ? (
              <p className='mt-3 rounded-control bg-surface/70 p-3 text-sm leading-6 text-foreground-secondary'>
                {result.compatibility.notes}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-card border border-success/30 bg-success-soft p-4'>
      <div className='flex gap-3'>
        <span className='grid size-10 shrink-0 place-items-center rounded-control bg-surface text-success'>
          <CheckCircle2 className='size-5' />
        </span>

        <div>
          <h3 className='text-sm font-extrabold text-success'>این قطعه با خودروی شما سازگار است</h3>

          <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
            سازگاری این قطعه برای خودرو و تیپ انتخاب‌شده ثبت شده است
          </p>

          {result.compatibility.notes ? (
            <p className='mt-3 rounded-control bg-surface/70 p-3 text-sm leading-6 text-foreground-secondary'>
              {result.compatibility.notes}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ProductCompatibilityDialog({
  open,
  onOpenChange,
  productName,
  compatibilities,
  initialSelection,
  onVehicleConfirmed,
}: ProductCompatibilityDialogProps) {
  const [makes, setMakes] = useState<StorefrontVehicleMake[]>([]);
  const [models, setModels] = useState<StorefrontVehicleModel[]>([]);
  const [variants, setVariants] = useState<StorefrontVehicleVariant[]>([]);

  const [selectedMakeSlug, setSelectedMakeSlug] = useState('');
  const [selectedModelSlug, setSelectedModelSlug] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const [checkResult, setCheckResult] = useState<CompatibilityCheckResult | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const storedSelection = initialSelection ?? readStorefrontVehicleSelection();

    setSelectedMakeSlug(storedSelection?.makeSlug ?? '');
    setSelectedModelSlug(storedSelection?.modelSlug ?? '');
    setSelectedVariantId(storedSelection?.variantId ?? '');

    setModels([]);
    setVariants([]);
    setCheckResult(null);
    setLoadError(null);
  }, [initialSelection?.makeSlug, initialSelection?.modelSlug, initialSelection?.variantId, open]);

  useEffect(() => {
    let isCurrent = true;

    if (!open) {
      return;
    }

    async function loadMakes() {
      setIsLoadingMakes(true);

      try {
        const response = await storefrontVehiclesApi.listMakes();

        if (!isCurrent) {
          return;
        }

        setMakes(response.data);
      } catch {
        if (isCurrent) {
          setLoadError('دریافت برندهای خودرو با خطا مواجه شد');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingMakes(false);
        }
      }
    }

    void loadMakes();

    return () => {
      isCurrent = false;
    };
  }, [open]);

  useEffect(() => {
    let isCurrent = true;

    if (!open || !selectedMakeSlug) {
      setModels([]);
      setVariants([]);
      setIsLoadingModels(false);

      return;
    }

    async function loadModels() {
      setIsLoadingModels(true);

      try {
        const response = await storefrontVehiclesApi.listModelsByMakeSlug(selectedMakeSlug);

        if (!isCurrent) {
          return;
        }

        setModels(response.data.models);

        setSelectedModelSlug((currentModelSlug) => {
          const isValid =
            !currentModelSlug ||
            response.data.models.some((model) => model.slug === currentModelSlug);

          if (isValid) {
            return currentModelSlug;
          }

          setSelectedVariantId('');
          setVariants([]);

          return '';
        });
      } catch {
        if (isCurrent) {
          setModels([]);
          setSelectedModelSlug('');
          setSelectedVariantId('');
          setVariants([]);
          setLoadError('دریافت مدل‌های خودرو با خطا مواجه شد');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingModels(false);
        }
      }
    }

    void loadModels();

    return () => {
      isCurrent = false;
    };
  }, [open, selectedMakeSlug]);

  useEffect(() => {
    let isCurrent = true;

    if (!open || !selectedModelSlug) {
      setVariants([]);
      setIsLoadingVariants(false);

      return;
    }

    async function loadVariants() {
      setIsLoadingVariants(true);

      try {
        const response = await storefrontVehiclesApi.listVariantsByModelSlug(selectedModelSlug);

        if (!isCurrent) {
          return;
        }

        setVariants(response.data.variants);

        setSelectedVariantId((currentVariantId) => {
          const isValid =
            !currentVariantId ||
            response.data.variants.some((variant) => variant.id === currentVariantId);

          return isValid ? currentVariantId : '';
        });
      } catch {
        if (isCurrent) {
          setVariants([]);
          setSelectedVariantId('');
          setLoadError('دریافت تیپ‌های خودرو با خطا مواجه شد');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingVariants(false);
        }
      }
    }

    void loadVariants();

    return () => {
      isCurrent = false;
    };
  }, [open, selectedModelSlug]);

  const selectedMake = useMemo(
    () => makes.find((make) => make.slug === selectedMakeSlug) ?? null,
    [makes, selectedMakeSlug],
  );

  const selectedModel = useMemo(
    () => models.find((model) => model.slug === selectedModelSlug) ?? null,
    [models, selectedModelSlug],
  );

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [selectedVariantId, variants],
  );

  const selectedVehicle = useMemo<StorefrontVehicleSelection | null>(() => {
    if (!selectedMake || !selectedModel || !selectedVariant) {
      return null;
    }

    return {
      make: selectedMake,
      model: selectedModel,
      variant: selectedVariant,
    };
  }, [selectedMake, selectedModel, selectedVariant]);

  const currentCheckResult =
    checkResult?.vehicleVariantId === selectedVariantId ? checkResult : null;

  const makeOptions = useMemo<ComboboxOption[]>(
    () =>
      makes.map((make) => ({
        value: make.slug,
        label: make.name,
        icon: <CarFront />,
      })),
    [makes],
  );

  const modelOptions = useMemo<ComboboxOption[]>(
    () =>
      models.map((model) => ({
        value: model.slug,
        label: model.name,
        icon: <CarFront />,
      })),
    [models],
  );

  const variantOptions = useMemo<ComboboxOption[]>(
    () =>
      variants.map((variant) => ({
        value: variant.id,
        label: variant.name,
        description: getVariantDetails(variant),
        icon: <CarFront />,
        keywords: [
          variant.engineName ?? '',
          variant.engineCode ?? '',
          String(variant.yearFrom ?? ''),
          String(variant.yearTo ?? ''),
        ],
      })),
    [variants],
  );

  function handleMakeChange(nextMakeSlug: string) {
    setSelectedMakeSlug(nextMakeSlug);
    setSelectedModelSlug('');
    setSelectedVariantId('');
    setModels([]);
    setVariants([]);
    setCheckResult(null);
    setLoadError(null);
  }

  function handleModelChange(nextModelSlug: string) {
    setSelectedModelSlug(nextModelSlug);
    setSelectedVariantId('');
    setVariants([]);
    setCheckResult(null);
    setLoadError(null);
  }

  function handleVariantChange(nextVariantId: string) {
    setSelectedVariantId(nextVariantId);
    setCheckResult(null);
  }

  function handleCheckCompatibility() {
    if (!selectedVehicle) {
      return;
    }

    const matchedCompatibility =
      compatibilities.find(
        (compatibility) => compatibility.vehicleVariant.id === selectedVehicle.variant.id,
      ) ?? null;

    setCheckResult({
      vehicleVariantId: selectedVehicle.variant.id,
      compatibility: matchedCompatibility,
    });
  }

  function handleConfirmVehicle() {
    if (!selectedVehicle || !currentCheckResult) {
      return;
    }

    onVehicleConfirmed(selectedVehicle);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='!max-w-3xl'>
        <DialogHeader>
          <DialogTitle>بررسی سازگاری قطعه با خودرو</DialogTitle>

          <DialogDescription>
            خودرو و تیپ دقیق را انتخاب کنید تا تطابق قطعه «{productName}» بررسی شود
          </DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-5'>
          {loadError ? (
            <div
              role='alert'
              className='flex gap-3 rounded-control border border-danger/30 bg-danger-soft p-4'
            >
              <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

              <p className='text-sm leading-6 text-danger'>{loadError}</p>
            </div>
          ) : null}

          <div className='grid gap-4 md:grid-cols-3'>
            <Combobox
              value={selectedMakeSlug}
              onValueChange={handleMakeChange}
              options={makeOptions}
              label='برند خودرو'
              placeholder='برند خودرو را انتخاب کنید'
              searchPlaceholder='جستجو در برندهای خودرو'
              emptyMessage='برند خودرویی پیدا نشد'
              loading={isLoadingMakes}
              clearable
              startIcon={<CarFront />}
            />

            <Combobox
              value={selectedModelSlug}
              onValueChange={handleModelChange}
              options={modelOptions}
              label='مدل خودرو'
              placeholder={
                selectedMakeSlug ? 'مدل خودرو را انتخاب کنید' : 'ابتدا برند خودرو را انتخاب کنید'
              }
              searchPlaceholder='جستجو در مدل‌ها'
              emptyMessage='مدلی برای این برند پیدا نشد'
              loading={isLoadingModels}
              disabled={!selectedMakeSlug || isLoadingModels || Boolean(loadError)}
              clearable
              startIcon={<CarFront />}
            />

            <Combobox
              value={selectedVariantId}
              onValueChange={handleVariantChange}
              options={variantOptions}
              label='تیپ یا موتور خودرو'
              placeholder={
                selectedModelSlug ? 'تیپ یا موتور را انتخاب کنید' : 'ابتدا مدل خودرو را انتخاب کنید'
              }
              searchPlaceholder='جستجو در تیپ‌ها و موتورهای خودرو'
              emptyMessage='تیپی برای این مدل پیدا نشد'
              loading={isLoadingVariants}
              disabled={!selectedModelSlug || isLoadingVariants || Boolean(loadError)}
              clearable
              startIcon={<CarFront />}
            />
          </div>

          {selectedVehicle ? (
            <div className='rounded-control border border-border bg-surface-muted p-4'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <p className='text-xs font-bold text-foreground-muted'>خودروی انتخاب‌شده</p>

                  <p className='mt-1 text-sm font-extrabold text-foreground'>
                    {selectedVehicle.make.name} · {selectedVehicle.model.name} ·{' '}
                    {selectedVehicle.variant.name}
                  </p>

                  <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                    {getVariantDetails(selectedVehicle.variant)}
                  </p>
                </div>

                <Badge variant='brand' size='sm'>
                  آماده بررسی
                </Badge>
              </div>
            </div>
          ) : null}

          {currentCheckResult ? <CompatibilityResult result={currentCheckResult} /> : null}
        </DialogBody>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            بستن
          </Button>

          {currentCheckResult ? (
            <Button type='button' iconStart={<CarFront />} onClick={handleConfirmVehicle}>
              ثبت خودرو و ادامه
            </Button>
          ) : (
            <Button
              type='button'
              iconStart={<ShieldCheck />}
              disabled={!selectedVehicle}
              onClick={handleCheckCompatibility}
            >
              بررسی تطابق قطعه
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
