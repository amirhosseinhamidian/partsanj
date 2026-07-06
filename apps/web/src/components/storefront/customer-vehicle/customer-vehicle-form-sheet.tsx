'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { CarFront, ChevronLeft, Pencil, Plus } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { StorefrontVehicleSelection } from '@/lib/storefront/vehicles/vehicle.types';
import type {
  CreateCustomerVehicleInput,
  CustomerVehicle,
  UpdateCustomerVehicleInput,
} from '@/lib/storefront/customer-vehicle/customer-vehicle.types';
import { CustomerVehicleSelector } from './customer-vehicle-selector';
import type { StorefrontVehicleSelectionInput } from '@/lib/storefront/vehicles/vehicle.types';

type CustomerVehicleFormMode = 'create' | 'edit';

type CustomerVehicleFormSheetProps = {
  open: boolean;
  mode: CustomerVehicleFormMode;
  vehicle?: CustomerVehicle;
  isSubmitting: boolean;

  onClose: () => void;

  onCreate: (input: CreateCustomerVehicleInput) => Promise<boolean>;

  onUpdate: (customerVehicleId: string, input: UpdateCustomerVehicleInput) => Promise<boolean>;
};

function getVehicleTitle(vehicle: CustomerVehicle) {
  const { vehicleVariant } = vehicle;

  return [vehicleVariant.model.make.name, vehicleVariant.model.name, vehicleVariant.name]
    .filter(Boolean)
    .join(' ');
}

function getSelectionTitle(selection: StorefrontVehicleSelection) {
  return [selection.make.name, selection.model.name, selection.variant.name]
    .filter(Boolean)
    .join(' ');
}

export function CustomerVehicleFormSheet({
  open,
  mode,
  vehicle,
  isSubmitting,
  onClose,
  onCreate,
  onUpdate,
}: CustomerVehicleFormSheetProps) {
  const [label, setLabel] = useState('');

  const [selectedVehicle, setSelectedVehicle] = useState<StorefrontVehicleSelection | null>(null);

  const [isSelectingVehicle, setIsSelectingVehicle] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLabel(vehicle?.label ?? '');
    setSelectedVehicle(null);
    setIsSelectingVehicle(false);
  }, [open, vehicle?.id]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSubmitting) {
      onClose();
    }
  }

  function handleVariantSelected(selection: StorefrontVehicleSelection) {
    setSelectedVehicle(selection);
    setIsSelectingVehicle(false);
  }

  function openVehicleSelector() {
    if (isSubmitting) {
      return;
    }

    setIsSelectingVehicle(true);
  }

  function closeVehicleSelector() {
    if (isSubmitting) {
      return;
    }

    setIsSelectingVehicle(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedLabel = label.trim() || null;

    if (mode === 'create') {
      if (!selectedVehicle) {
        return;
      }

      const created = await onCreate({
        vehicleVariantId: selectedVehicle.variant.id,
        label: normalizedLabel,
      });

      if (created) {
        onClose();
      }

      return;
    }

    if (!vehicle) {
      return;
    }

    const payload: UpdateCustomerVehicleInput = {};

    if (normalizedLabel !== (vehicle.label ?? null)) {
      payload.label = normalizedLabel;
    }

    if (selectedVehicle && selectedVehicle.variant.id !== vehicle.vehicleVariant.id) {
      payload.vehicleVariantId = selectedVehicle.variant.id;
    }

    if (Object.keys(payload).length === 0) {
      onClose();

      return;
    }

    const updated = await onUpdate(vehicle.id, payload);

    if (updated) {
      onClose();
    }
  }

  function getVehicleInitialSelection(
    vehicle?: CustomerVehicle,
  ): StorefrontVehicleSelectionInput | undefined {
    if (!vehicle) {
      return undefined;
    }

    return {
      makeSlug: vehicle.vehicleVariant.model.make.slug,
      modelSlug: vehicle.vehicleVariant.model.slug,
      variantId: vehicle.vehicleVariant.id,
    };
  }

  const currentVehicleTitle = vehicle ? getVehicleTitle(vehicle) : null;

  const displayedVehicleTitle = selectedVehicle
    ? getSelectionTitle(selectedVehicle)
    : currentVehicleTitle;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side='right'
        showCloseButton={!isSubmitting}
        className='max-w-xl'
        onEscapeKeyDown={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isSubmitting) {
            event.preventDefault();
          }
        }}
      >
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'افزودن خودرو' : 'ویرایش خودرو'}</SheetTitle>

          <SheetDescription>
            خودرو را دقیق انتخاب کنید تا سازگاری قطعات درست بررسی شود
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='flex min-h-0 flex-1 flex-col'>
          <SheetBody>
            <div className='space-y-6'>
              <div>
                <div className='mb-2 flex items-center justify-between gap-3'>
                  <label className='text-sm font-semibold text-foreground'>خودرو</label>

                  {!isSelectingVehicle ? (
                    <button
                      type='button'
                      onClick={openVehicleSelector}
                      disabled={isSubmitting}
                      className='inline-flex items-center gap-1 text-sm font-semibold text-brand transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      {displayedVehicleTitle ? 'تغییر خودرو' : 'انتخاب خودرو'}

                      <ChevronLeft className='size-4' />
                    </button>
                  ) : null}
                </div>

                {isSelectingVehicle ? (
                  <div className='bg-card rounded-xl border border-border p-3 sm:p-4'>
                    <div className='mb-4 flex items-center justify-between gap-3'>
                      <p className='text-sm font-semibold text-foreground'>
                        انتخاب برند، مدل و تیپ خودرو
                      </p>

                      <button
                        type='button'
                        onClick={closeVehicleSelector}
                        disabled={isSubmitting}
                        className='text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        بازگشت
                      </button>
                    </div>

                    <CustomerVehicleSelector
                      initialSelection={getVehicleInitialSelection(vehicle)}
                      resetKey={`${mode}:${vehicle?.id ?? 'new'}`}
                      onVehicleSelected={handleVariantSelected}
                    />
                  </div>
                ) : displayedVehicleTitle ? (
                  <button
                    type='button'
                    onClick={openVehicleSelector}
                    disabled={isSubmitting}
                    className='bg-card flex w-full items-center justify-between gap-4 rounded-xl border border-border px-4 py-3 text-right transition-colors hover:border-brand/50 disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    <span className='flex min-w-0 items-center gap-3'>
                      <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand'>
                        <CarFront className='size-5' />
                      </span>

                      <span className='min-w-0'>
                        <span className='block truncate text-sm font-bold text-foreground'>
                          {displayedVehicleTitle}
                        </span>

                        <span className='mt-1 block text-xs text-foreground-secondary'>
                          {selectedVehicle ? 'انتخاب جدید' : 'برای تغییر، این بخش را انتخاب کنید'}
                        </span>
                      </span>
                    </span>

                    <ChevronLeft className='size-5 shrink-0 text-foreground-secondary' />
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={openVehicleSelector}
                    disabled={isSubmitting}
                    className='bg-card flex min-h-28 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-5 text-center transition-colors hover:border-brand/60 hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    <CarFront className='size-6 text-brand' />

                    <span className='mt-2 text-sm font-bold text-foreground'>انتخاب خودرو</span>

                    <span className='mt-1 text-xs text-foreground-secondary'>
                      برند، مدل و تیپ خودرو را مشخص کنید
                    </span>
                  </button>
                )}
              </div>

              <label className='block'>
                <span className='mb-2 block text-sm font-semibold text-foreground'>
                  عنوان خودرو شما
                  <span className='mr-1 text-xs font-normal text-foreground-secondary'>
                    اختیاری
                  </span>
                </span>

                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  maxLength={60}
                  placeholder='مثلاً: ماشین خودم یا سمند پدر'
                  disabled={isSubmitting}
                  className='h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors outline-none placeholder:text-foreground-secondary focus:border-brand disabled:cursor-not-allowed disabled:opacity-60'
                />
              </label>
            </div>
          </SheetBody>

          <SheetFooter>
            <button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className='hover:bg-muted inline-flex h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60'
            >
              انصراف
            </button>

            <button
              type='submit'
              disabled={isSubmitting || (mode === 'create' && !selectedVehicle)}
              className='inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {mode === 'create' ? <Plus className='size-4' /> : <Pencil className='size-4' />}

              {isSubmitting ? 'در حال ذخیره...' : mode === 'create' ? 'ثبت خودرو' : 'ذخیره تغییرات'}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
