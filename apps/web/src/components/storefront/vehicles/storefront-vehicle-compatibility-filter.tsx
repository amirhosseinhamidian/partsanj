'use client';

import Link from 'next/link';
import { Check, CarFront, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  StorefrontVehicleSelection,
  StorefrontVehicleSelectionInput,
} from '@/lib/storefront/vehicles/vehicle.types';
import {
  clearStorefrontVehicleSelection,
  readStorefrontVehicleSelection,
  saveStorefrontVehicleSelection,
} from '@/lib/storefront/vehicles/vehicle-selection-storage';
import type { CustomerVehicle } from '@/lib/storefront/customer-vehicle/customer-vehicle.types';
import { cn } from '@/lib/utils/cn';
import { VehicleVariantPicker } from './vehicle-variant-picker';
import { useEffect, useState } from 'react';

type StorefrontVehicleCompatibilityFilterProps = {
  initialSelection?: StorefrontVehicleSelectionInput;
  hasExternalVehicleFilter?: boolean;
  resetKey?: number;

  savedVehicles?: CustomerVehicle[];
  savedVehiclesLoading?: boolean;
  savedVehiclesError?: string | null;

  isAuthenticated?: boolean;
  isSavingSelectedVehicle?: boolean;
  saveSelectedVehicleError?: string | null;

  onSaveSelectedVehicle?: (selection: StorefrontVehicleSelection) => Promise<boolean>;

  onVehicleChange: (selection: StorefrontVehicleSelection | null) => void;

  className?: string;
};

function getVehicleTitle(vehicle: CustomerVehicle) {
  return [
    vehicle.vehicleVariant.model.make.name,
    vehicle.vehicleVariant.model.name,
    vehicle.vehicleVariant.name,
  ]
    .filter(Boolean)
    .join(' ');
}

function getVehicleInput(vehicle: CustomerVehicle): StorefrontVehicleSelectionInput {
  return {
    makeSlug: vehicle.vehicleVariant.model.make.slug,
    modelSlug: vehicle.vehicleVariant.model.slug,
    variantId: vehicle.vehicleVariant.id,
  };
}

function getSelectionKey(selection?: StorefrontVehicleSelectionInput) {
  if (!selection?.makeSlug || !selection.modelSlug || !selection.variantId) {
    return null;
  }

  return `${selection.makeSlug}:${selection.modelSlug}:${selection.variantId}`;
}

function isCompleteVehicleSelectionInput(selection?: StorefrontVehicleSelectionInput | null) {
  return Boolean(selection?.makeSlug && selection.modelSlug && selection.variantId);
}

function resolveInitialSelection({
  initialSelection,
  storedSelection,
  hasExternalVehicleFilter,
}: {
  initialSelection?: StorefrontVehicleSelectionInput;
  storedSelection?: StorefrontVehicleSelectionInput;
  hasExternalVehicleFilter: boolean;
}) {
  if (isCompleteVehicleSelectionInput(initialSelection)) {
    return initialSelection;
  }

  if (initialSelection?.variantId) {
    if (
      isCompleteVehicleSelectionInput(storedSelection) &&
      storedSelection.variantId === initialSelection.variantId
    ) {
      return storedSelection;
    }

    return initialSelection;
  }

  if (!hasExternalVehicleFilter) {
    return storedSelection;
  }

  return undefined;
}

export function StorefrontVehicleCompatibilityFilter({
  initialSelection,
  hasExternalVehicleFilter = false,
  resetKey,
  savedVehicles = [],
  savedVehiclesLoading = false,
  savedVehiclesError = null,
  isAuthenticated = false,
  isSavingSelectedVehicle = false,
  saveSelectedVehicleError = null,
  onSaveSelectedVehicle,
  onVehicleChange,
  className,
}: StorefrontVehicleCompatibilityFilterProps) {
  const [storedSelection, setStoredSelection] = useState<StorefrontVehicleSelectionInput>();

  const [isStorageReady, setIsStorageReady] = useState(false);

  const [selectionOverride, setSelectionOverride] = useState<StorefrontVehicleSelectionInput>();

  const [localResetKey, setLocalResetKey] = useState(0);

  const [selectedVehicle, setSelectedVehicle] = useState<StorefrontVehicleSelection | null>(null);

  const externalSelectionKey = getSelectionKey(initialSelection);

  useEffect(() => {
    const nextStoredSelection = readStorefrontVehicleSelection() ?? undefined;

    if (!initialSelection && !hasExternalVehicleFilter) {
      setStoredSelection(nextStoredSelection);
      setIsStorageReady(true);

      return;
    }

    if (
      initialSelection?.variantId &&
      nextStoredSelection?.variantId === initialSelection.variantId
    ) {
      setStoredSelection(nextStoredSelection);
      setIsStorageReady(true);

      return;
    }

    setStoredSelection(undefined);
    setIsStorageReady(true);
  }, [
    hasExternalVehicleFilter,
    initialSelection?.makeSlug,
    initialSelection?.modelSlug,
    initialSelection?.variantId,
  ]);

  useEffect(() => {
    setSelectionOverride(undefined);
  }, [externalSelectionKey]);

  const resolvedInitialSelection = resolveInitialSelection({
    initialSelection,
    storedSelection,
    hasExternalVehicleFilter,
  });

  const effectiveInitialSelection = selectionOverride ?? resolvedInitialSelection;

  const activeVariantId =
    selectedVehicle?.variant.id ?? effectiveInitialSelection?.variantId ?? null;

  const isSelectedVehicleSaved =
    Boolean(activeVariantId) &&
    savedVehicles.some((vehicle) => vehicle.vehicleVariant.id === activeVariantId);

  function handleSelectionChange(selection: StorefrontVehicleSelection | null) {
    setSelectedVehicle(selection);

    if (!selection) {
      clearStorefrontVehicleSelection();
      setStoredSelection(undefined);
      onVehicleChange(null);

      return;
    }

    const nextSelection: StorefrontVehicleSelectionInput = {
      makeSlug: selection.make.slug,
      modelSlug: selection.model.slug,
      variantId: selection.variant.id,
    };

    saveStorefrontVehicleSelection(nextSelection);
    setStoredSelection(nextSelection);

    onVehicleChange(selection);
  }

  function handleSavedVehicleSelect(vehicle: CustomerVehicle) {
    setSelectedVehicle(null);
    setSelectionOverride(getVehicleInput(vehicle));
  }

  function handleClearSelection() {
    setSelectedVehicle(null);
    setSelectionOverride(undefined);
    setStoredSelection(undefined);

    clearStorefrontVehicleSelection();

    onVehicleChange(null);

    setLocalResetKey((current) => current + 1);
  }

  async function handleSaveSelectedVehicle() {
    if (!selectedVehicle || !onSaveSelectedVehicle || isSavingSelectedVehicle) {
      return;
    }

    await onSaveSelectedVehicle(selectedVehicle);
  }

  const shouldShowManualVehicleHeader = isAuthenticated;

  const manualVehicleSectionClassName = cn(
    savedVehicles.length > 0
      ? 'mt-6 border-t border-border pt-5'
      : shouldShowManualVehicleHeader
        ? 'mt-5'
        : 'mt-0',
  );

  const manualVehiclePickerClassName = shouldShowManualVehicleHeader ? 'mt-4' : undefined;

  return (
    <section
      className={cn('rounded-card border border-border bg-surface p-4 shadow sm:p-5', className)}
      aria-label='فیلتر سازگاری خودرو'
    >
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold text-brand'>انتخاب خودرو</p>

          <h2 className='mt-1 text-lg font-bold text-foreground'>فیلتر سازگاری خودرو</h2>

          <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
            قطعات سازگار را بر اساس خودرو انتخابی خود مشاهده کنید
          </p>
        </div>

        {activeVariantId ? (
          <Button
            type='button'
            size='sm'
            variant='danger'
            iconStart={<RotateCcw />}
            onClick={handleClearSelection}
          >
            پاک‌کردن انتخاب
          </Button>
        ) : null}
      </div>

      {savedVehiclesError ? (
        <div
          role='alert'
          className='mt-4 rounded-control border border-warning/30 bg-warning-soft p-3 text-sm text-warning'
        >
          خودروهای ذخیره‌شده بارگذاری نشدند، اما انتخاب دستی خودرو همچنان فعال است
        </div>
      ) : null}

      {savedVehiclesLoading ? (
        <div className='mt-5 grid gap-3 sm:grid-cols-2'>
          {[1, 2].map((item) => (
            <div key={item} className='bg-muted h-20 animate-pulse rounded-control' />
          ))}
        </div>
      ) : savedVehicles.length > 0 ? (
        <section className='mt-5'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-sm font-bold text-foreground'>خودروهای من</p>

              <p className='mt-1 text-xs text-foreground-secondary'>
                برای بررسی سازگاری، یکی از خودروهای ذخیره‌شده را انتخاب کنید
              </p>
            </div>

            <Link
              href='/account/vehicles'
              className='text-xs font-semibold text-brand transition-opacity hover:opacity-80'
            >
              مدیریت خودروها
            </Link>
          </div>

          <div className='mt-3 grid gap-3 sm:grid-cols-2'>
            {savedVehicles.map((vehicle) => {
              const isActive = vehicle.vehicleVariant.id === activeVariantId;

              return (
                <button
                  key={vehicle.id}
                  type='button'
                  onClick={() => handleSavedVehicleSelect(vehicle)}
                  className={cn(
                    'rounded-control border p-3 text-right transition-colors',
                    isActive
                      ? 'border-brand bg-brand-soft'
                      : 'bg-card border-border hover:border-brand/50',
                  )}
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-bold text-foreground'>
                        {vehicle.label || getVehicleTitle(vehicle)}
                      </p>

                      {vehicle.label ? (
                        <p className='mt-1 truncate text-xs text-foreground-secondary'>
                          {getVehicleTitle(vehicle)}
                        </p>
                      ) : null}
                    </div>

                    {vehicle.isDefault ? (
                      <span className='inline-flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-[11px] font-bold text-brand'>
                        <Check className='size-3' />
                        پیش‌فرض
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className={manualVehicleSectionClassName}>
        {shouldShowManualVehicleHeader ? (
          <>
            <p className='text-sm font-bold text-foreground'>
              {savedVehicles.length > 0 ? 'یا انتخاب دستی خودرو' : 'انتخاب دستی خودرو'}
            </p>

            <p className='mt-1 text-xs text-foreground-secondary'>
              برای بررسی خودروی دیگر، برند، مدل و تیپ را دستی انتخاب کنید
            </p>
          </>
        ) : null}

        {isStorageReady ? (
          <VehicleVariantPicker
            initialSelection={effectiveInitialSelection}
            resetKey={`${resetKey ?? 0}:${localResetKey}`}
            onSelectionChange={handleSelectionChange}
            className={manualVehiclePickerClassName}
          />
        ) : (
          <div
            className={cn(
              'bg-muted h-28 animate-pulse rounded-control',
              manualVehiclePickerClassName,
            )}
          />
        )}
      </div>

      {selectedVehicle && isAuthenticated && !isSelectedVehicleSaved && onSaveSelectedVehicle ? (
        <div className='mt-5 flex flex-wrap items-center justify-between gap-3 rounded-control border border-success/30 bg-success-soft p-4'>
          <div className='flex min-w-0 items-start gap-3'>
            <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success'>
              <CarFront className='size-4' />
            </span>

            <div>
              <p className='text-sm font-bold text-foreground'>
                {selectedVehicle.make.name} · {selectedVehicle.model.name} ·{' '}
                {selectedVehicle.variant.name}
              </p>

              <p className='mt-1 text-xs text-foreground-secondary'>
                این خودرو هنوز در خودروهای من ذخیره نشده است
              </p>
            </div>
          </div>

          <Button
            type='button'
            size='sm'
            variant='outline'
            isLoading={isSavingSelectedVehicle}
            onClick={() => {
              void handleSaveSelectedVehicle();
            }}
          >
            ذخیره در خودروهای من
          </Button>
        </div>
      ) : null}

      {saveSelectedVehicleError ? (
        <p className='mt-3 text-sm font-semibold text-danger'>{saveSelectedVehicleError}</p>
      ) : null}
    </section>
  );
}
