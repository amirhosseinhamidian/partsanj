'use client';

import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { storefrontVehiclesApi } from '@/lib/api/storefront-vehicles-client';
import type {
  StorefrontVehicleMake,
  StorefrontVehicleModel,
  StorefrontVehicleSelection,
  StorefrontVehicleSelectionInput,
  StorefrontVehicleVariant,
} from '@/lib/storefront/vehicles/vehicle.types';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import { CarFront, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type VehicleVariantPickerProps = {
  initialSelection?: StorefrontVehicleSelectionInput;
  resetKey?: string | number;

  onSelectionChange?: (selection: StorefrontVehicleSelection | null) => void;

  layout?: 'responsive' | 'stacked';

  className?: string;
};

function formatYear(value: number): string {
  return toPersianDigits(String(value));
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

export function VehicleVariantPicker({
  initialSelection,
  resetKey,
  onSelectionChange,
  layout = 'responsive',
  className,
}: VehicleVariantPickerProps) {
  const [makes, setMakes] = useState<StorefrontVehicleMake[]>([]);

  const [models, setModels] = useState<StorefrontVehicleModel[]>([]);

  const [variants, setVariants] = useState<StorefrontVehicleVariant[]>([]);

  const [selectedMakeSlug, setSelectedMakeSlug] = useState('');

  const [selectedModelSlug, setSelectedModelSlug] = useState('');

  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [isLoadingMakes, setIsLoadingMakes] = useState(true);

  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const previousResetKey = useRef<string | number | undefined>(resetKey);

  const appliedInitialSelectionKey = useRef<string | null>(null);

  const emittedSelectionKey = useRef<string | null | undefined>(undefined);

  const initialMakeSlug = initialSelection?.makeSlug ?? '';

  const initialModelSlug = initialSelection?.modelSlug ?? '';

  const initialVariantId = initialSelection?.variantId ?? '';

  const initialSelectionKey =
    initialMakeSlug && initialModelSlug && initialVariantId
      ? `${initialMakeSlug}:${initialModelSlug}:${initialVariantId}`
      : null;

  const resetSelection = useCallback(() => {
    setSelectedMakeSlug('');
    setSelectedModelSlug('');
    setSelectedVariantId('');
    setModels([]);
    setVariants([]);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!initialSelectionKey) {
      return;
    }

    if (appliedInitialSelectionKey.current === initialSelectionKey) {
      return;
    }

    appliedInitialSelectionKey.current = initialSelectionKey;

    setSelectedMakeSlug(initialMakeSlug);
    setSelectedModelSlug(initialModelSlug);
    setSelectedVariantId(initialVariantId);
  }, [initialMakeSlug, initialModelSlug, initialSelectionKey, initialVariantId]);

  useEffect(() => {
    if (resetKey === undefined || previousResetKey.current === resetKey) {
      return;
    }

    previousResetKey.current = resetKey;
    appliedInitialSelectionKey.current = null;

    resetSelection();
  }, [resetKey, resetSelection]);

  useEffect(() => {
    let isCurrent = true;

    async function loadMakes() {
      setIsLoadingMakes(true);
      setLoadError(null);

      try {
        const response = await storefrontVehiclesApi.listMakes();

        if (!isCurrent) {
          return;
        }

        setMakes(response.data);
      } catch {
        if (!isCurrent) {
          return;
        }

        setLoadError('دریافت برندهای خودرو با خطا مواجه شد');
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
  }, []);

  useEffect(() => {
    if (isLoadingMakes || !selectedMakeSlug || makes.length === 0) {
      return;
    }

    const isValid = makes.some((make) => make.slug === selectedMakeSlug);

    if (!isValid) {
      resetSelection();
    }
  }, [isLoadingMakes, makes, resetSelection, selectedMakeSlug]);

  useEffect(() => {
    let isCurrent = true;

    if (!selectedMakeSlug) {
      setModels([]);
      setVariants([]);
      setIsLoadingModels(false);

      return;
    }

    async function loadModels() {
      setIsLoadingModels(true);
      setLoadError(null);

      try {
        const response = await storefrontVehiclesApi.listModelsByMakeSlug(selectedMakeSlug);

        if (!isCurrent) {
          return;
        }

        setModels(response.data.models);

        setSelectedModelSlug((current) => {
          const isValid = !current || response.data.models.some((model) => model.slug === current);

          if (isValid) {
            return current;
          }

          setSelectedVariantId('');
          setVariants([]);

          return '';
        });
      } catch {
        if (!isCurrent) {
          return;
        }

        setModels([]);
        setVariants([]);
        setSelectedModelSlug('');
        setSelectedVariantId('');

        setLoadError('دریافت مدل‌های خودرو با خطا مواجه شد');
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
  }, [selectedMakeSlug]);

  useEffect(() => {
    let isCurrent = true;

    if (!selectedModelSlug) {
      setVariants([]);
      setIsLoadingVariants(false);

      return;
    }

    async function loadVariants() {
      setIsLoadingVariants(true);
      setLoadError(null);

      try {
        const response = await storefrontVehiclesApi.listVariantsByModelSlug(selectedModelSlug);

        if (!isCurrent) {
          return;
        }

        setVariants(response.data.variants);

        setSelectedVariantId((current) => {
          const isValid =
            !current || response.data.variants.some((variant) => variant.id === current);

          return isValid ? current : '';
        });
      } catch {
        if (!isCurrent) {
          return;
        }

        setVariants([]);
        setSelectedVariantId('');

        setLoadError('دریافت تیپ‌های خودرو با خطا مواجه شد');
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
  }, [selectedModelSlug]);

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

  useEffect(() => {
    const nextSelectionKey = selectedVehicle
      ? `${selectedVehicle.make.slug}:${selectedVehicle.model.slug}:${selectedVehicle.variant.id}`
      : null;

    if (emittedSelectionKey.current === undefined && nextSelectionKey === null) {
      emittedSelectionKey.current = null;

      return;
    }

    if (emittedSelectionKey.current === nextSelectionKey) {
      return;
    }

    emittedSelectionKey.current = nextSelectionKey;

    onSelectionChange?.(selectedVehicle);
  }, [onSelectionChange, selectedVehicle]);

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
        description: selectedMake ? `مدل‌های ${selectedMake.name}` : undefined,
        icon: <CarFront />,
      })),
    [models, selectedMake],
  );

  const variantOptions = useMemo<ComboboxOption[]>(
    () =>
      variants.map((variant) => ({
        value: variant.id,
        label: variant.name,
        description: getVariantDetails(variant),
        icon: <CarFront />,
        keywords: [
          variant.engineCode ?? '',
          variant.engineName ?? '',
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
    setLoadError(null);
  }

  function handleModelChange(nextModelSlug: string) {
    setSelectedModelSlug(nextModelSlug);
    setSelectedVariantId('');
    setVariants([]);
    setLoadError(null);
  }

  function handleVariantChange(nextVariantId: string) {
    setSelectedVariantId(nextVariantId);
  }

  return (
    <div className={cn('space-y-5', className)}>
      {loadError ? (
        <div
          role='alert'
          className='flex items-start gap-2 rounded-control border border-danger/30 bg-danger-soft p-3 text-sm text-danger'
        >
          <TriangleAlert className='mt-0.5 size-4 shrink-0' />
          <p>{loadError}</p>
        </div>
      ) : null}

      <div className={cn('grid gap-4', layout === 'stacked' ? 'grid-cols-1' : 'lg:grid-cols-3')}>
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
          searchPlaceholder='جستجو در مدل‌های خودرو'
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
        <div className='rounded-control border border-success/30 bg-success-soft p-4'>
          <p className='text-xs font-bold text-success'>خودروی انتخاب‌شده</p>

          <p className='mt-1 text-sm font-bold text-foreground'>
            {selectedVehicle.make.name} · {selectedVehicle.model.name} ·{' '}
            {selectedVehicle.variant.name}
          </p>

          <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
            {getVariantDetails(selectedVehicle.variant)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
