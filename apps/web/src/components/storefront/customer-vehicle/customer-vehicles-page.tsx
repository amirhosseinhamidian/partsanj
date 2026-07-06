'use client';

import { useState } from 'react';
import { AlertCircle, CarFront, Check, Pencil, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { toPersianDigits } from '@/lib/utils/digits';
import type { CustomerVehicle } from '@/lib/storefront/customer-vehicle/customer-vehicle.types';
import { useCustomerVehicles } from '@/lib/storefront/customer-vehicle/use-customer-vehicles';
import { CustomerVehicleFormSheet } from './customer-vehicle-form-sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type VehicleFormState =
  | {
      mode: 'create';
    }
  | {
      mode: 'edit';
      vehicle: CustomerVehicle;
    }
  | null;

function getVehicleTitle(vehicle: CustomerVehicle) {
  const { vehicleVariant } = vehicle;

  return [vehicleVariant.model.make.name, vehicleVariant.model.name, vehicleVariant.name]
    .filter(Boolean)
    .join(' ');
}

function formatYear(year: number | null) {
  if (year === null) {
    return null;
  }

  return toPersianDigits(String(year));
}

function getVehicleYearRange(vehicle: CustomerVehicle) {
  const { yearFrom, yearTo } = vehicle.vehicleVariant;

  const from = formatYear(yearFrom);
  const to = formatYear(yearTo);

  if (from && to) {
    return `${from} تا ${to}`;
  }

  return from ?? to;
}

function getEngineText(vehicle: CustomerVehicle) {
  const { engineCode, engineName } = vehicle.vehicleVariant;

  if (engineName && engineCode) {
    return `${engineName} (${engineCode})`;
  }

  return engineName ?? engineCode ?? null;
}

export function CustomerVehiclesPage() {
  const {
    vehicles,
    error,
    isLoading,
    pendingAction,
    pendingVehicleId,
    refresh,
    create,
    update,
    setDefault,
    remove,
    clearError,
  } = useCustomerVehicles();

  const [formState, setFormState] = useState<VehicleFormState>(null);

  const isMutating = pendingAction !== null;

  const isFormSubmitting = pendingAction === 'create' || pendingAction === 'update';

  function openCreateForm() {
    setFormState({
      mode: 'create',
    });
  }

  function openEditForm(vehicle: CustomerVehicle) {
    setFormState({
      mode: 'edit',
      vehicle,
    });
  }

  function closeForm() {
    if (isFormSubmitting) {
      return;
    }

    setFormState(null);
  }

  async function handleSetDefault(vehicle: CustomerVehicle) {
    if (vehicle.isDefault) {
      return;
    }

    await setDefault(vehicle.id);
  }

  async function handleDelete(vehicle: CustomerVehicle) {
    const vehicleTitle = vehicle.label || getVehicleTitle(vehicle);

    const confirmed = window.confirm(`آیا از حذف «${vehicleTitle}» مطمئن هستید؟`);

    if (!confirmed) {
      return;
    }

    await remove(vehicle.id);
  }

  return (
    <>
      <section className='mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
        <header className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <div className='flex items-center gap-3'>
              <div className='flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand'>
                <CarFront className='size-5' />
              </div>

              <div>
                <h1 className='text-xl font-bold text-foreground sm:text-2xl'>خودروهای من</h1>

                <p className='mt-1 text-sm text-foreground-secondary'>
                  خودروهای خود را ذخیره کنید تا قطعات سازگار سریع‌تر نمایش داده شوند
                </p>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={openCreateForm}
              disabled={isMutating}
              iconStart={<Plus className='size-4' />}
            >
              افزودن خودرو
            </Button>

            <Button
              onClick={() => {
                void refresh();
              }}
              disabled={isLoading || isMutating}
              variant='outline'
              iconStart={<RefreshCw className={isLoading ? 'size-4 animate-spin' : 'size-4'} />}
            >
              بروزرسانی
            </Button>
          </div>
        </header>

        {error ? (
          <div
            role='alert'
            className='border-destructive/30 bg-destructive/10 text-destructive mt-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm'
          >
            <div className='flex items-start gap-2'>
              <AlertCircle className='mt-0.5 size-4 shrink-0' />
              <p>{error}</p>
            </div>

            <button
              type='button'
              onClick={clearError}
              className='shrink-0 text-xs font-semibold hover:opacity-70'
            >
              بستن
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <CustomerVehiclesLoadingState />
        ) : vehicles.length === 0 ? (
          <CustomerVehiclesEmptyState onCreate={openCreateForm} />
        ) : (
          <div className='mt-6 grid gap-4'>
            {vehicles.map((vehicle) => (
              <CustomerVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isMutating={isMutating}
                pendingAction={pendingAction}
                pendingVehicleId={pendingVehicleId}
                onSetDefault={handleSetDefault}
                onEdit={openEditForm}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {formState ? (
        <CustomerVehicleFormSheet
          open
          mode={formState.mode}
          vehicle={formState.mode === 'edit' ? formState.vehicle : undefined}
          isSubmitting={isFormSubmitting}
          onClose={closeForm}
          onCreate={create}
          onUpdate={update}
        />
      ) : null}
    </>
  );
}

function CustomerVehiclesLoadingState() {
  return (
    <div className='mt-6 grid gap-4'>
      {[1, 2].map((item) => (
        <div key={item} className='bg-card animate-pulse rounded-xl border border-border p-5'>
          <div className='bg-muted h-5 w-48 rounded' />
          <div className='bg-muted mt-4 h-4 w-72 max-w-full rounded' />
          <div className='bg-muted mt-5 h-9 w-40 rounded' />
        </div>
      ))}
    </div>
  );
}

type CustomerVehiclesEmptyStateProps = {
  onCreate: () => void;
};

function CustomerVehiclesEmptyState({ onCreate }: CustomerVehiclesEmptyStateProps) {
  return (
    <div className='bg-card mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center'>
      <div className='bg-muted mx-auto flex size-14 items-center justify-center rounded-2xl text-foreground-secondary'>
        <CarFront className='size-9' />
      </div>

      <h2 className='text-lg font-bold text-foreground'>هنوز خودرویی ذخیره نکرده‌اید</h2>

      <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary'>
        بعد از افزودن خودرو، نمایش قطعات سازگار و بررسی دقیق‌تر مشخصات فنی سریع‌تر انجام می‌شود
      </p>

      <button
        type='button'
        onClick={onCreate}
        className='mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90'
      >
        <Plus className='size-4' />
        افزودن اولین خودرو
      </button>
    </div>
  );
}

type CustomerVehicleCardProps = {
  vehicle: CustomerVehicle;
  isMutating: boolean;
  pendingAction: 'create' | 'update' | 'set-default' | 'delete' | null;
  pendingVehicleId: string | null;

  onSetDefault: (vehicle: CustomerVehicle) => Promise<void>;

  onEdit: (vehicle: CustomerVehicle) => void;

  onDelete: (vehicle: CustomerVehicle) => Promise<void>;
};

function CustomerVehicleCard({
  vehicle,
  isMutating,
  pendingAction,
  pendingVehicleId,
  onSetDefault,
  onEdit,
  onDelete,
}: CustomerVehicleCardProps) {
  const vehicleTitle = getVehicleTitle(vehicle);
  const yearRange = getVehicleYearRange(vehicle);
  const engineText = getEngineText(vehicle);

  const isCurrentVehiclePending = pendingVehicleId === vehicle.id;

  const isDeleting = isCurrentVehiclePending && pendingAction === 'delete';

  const isSettingDefault = isCurrentVehiclePending && pendingAction === 'set-default';

  return (
    <article className='rounded-card border border-border bg-surface p-5 shadow-panel'>
      <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='truncate text-base font-bold text-foreground sm:text-lg'>
              {vehicle.label || vehicleTitle}
            </h2>

            {vehicle.isDefault ? (
              <Badge variant='success' dot>
                خودروی پیش‌فرض
              </Badge>
            ) : null}
          </div>

          {vehicle.label ? (
            <p className='mt-2 text-sm text-foreground-secondary'>{vehicleTitle}</p>
          ) : null}

          <div className='mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground-secondary'>
            {yearRange ? <span>سال ساخت: {yearRange}</span> : null}

            {engineText ? <span>موتور: {engineText}</span> : null}
          </div>
        </div>

        <div className='flex shrink-0 flex-wrap gap-2 sm:justify-end'>
          {!vehicle.isDefault ? (
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={isMutating}
              isLoading={isSettingDefault}
              loadingLabel='در حال انتخاب'
              iconStart={<Star className='size-4' />}
              onClick={() => onSetDefault(vehicle)}
            >
              انتخاب پیش‌فرض
            </Button>
          ) : null}

          <Button
            onClick={() => onEdit(vehicle)}
            disabled={isMutating}
            iconStart={<Pencil className='size-4' />}
            variant='secondary'
            size='sm'
          >
            ویرایش
          </Button>

          <Button
            type='button'
            size='sm'
            variant='outline'
            disabled={isMutating}
            className='border-danger/40 text-danger hover:bg-danger-soft'
            iconStart={<Trash2 className='size-4' />}
            onClick={() => void onDelete(vehicle)}
          >
            حذف
          </Button>
        </div>
      </div>
    </article>
  );
}
