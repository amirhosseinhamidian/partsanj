'use client';

import { useEffect, useRef } from 'react';
import type {
  StorefrontVehicleSelection,
  StorefrontVehicleSelectionInput,
} from '@/lib/storefront/vehicles/vehicle.types';
import { VehicleVariantPicker } from '../vehicles/vehicle-variant-picker';

type CustomerVehicleSelectorProps = {
  initialSelection?: StorefrontVehicleSelectionInput;
  resetKey?: string | number;

  onVehicleSelected: (selection: StorefrontVehicleSelection) => void;

  className?: string;
};

function getSelectionKey(selection?: StorefrontVehicleSelectionInput) {
  if (!selection?.makeSlug || !selection.modelSlug || !selection.variantId) {
    return null;
  }

  return `${selection.makeSlug}:${selection.modelSlug}:${selection.variantId}`;
}

export function CustomerVehicleSelector({
  initialSelection,
  resetKey,
  onVehicleSelected,
  className,
}: CustomerVehicleSelectorProps) {
  const initialSelectionKey = getSelectionKey(initialSelection);

  /**
   * در Edit Mode، Picker انتخاب فعلی خودرو را بعد از Load شدن
   * Make / Model / Variant دوباره Emit می‌کند
   *
   * این Ref جلوی بسته‌شدن فوری Selector را می‌گیرد
   */
  const initialVariantIdRef = useRef<string | null>(initialSelection?.variantId ?? null);

  const hasSelectedDifferentVariantRef = useRef(false);

  useEffect(() => {
    initialVariantIdRef.current = initialSelection?.variantId ?? null;

    hasSelectedDifferentVariantRef.current = false;
  }, [initialSelection?.variantId, initialSelectionKey, resetKey]);

  function handleSelectionChange(selection: StorefrontVehicleSelection | null) {
    if (!selection) {
      return;
    }

    const initialVariantId = initialVariantIdRef.current;

    /**
     * انتخاب اولیه‌ی خودرو در حالت Edit فقط برای پرشدن
     * Comboboxها است و نباید Sheet را ببندد
     */
    if (
      !hasSelectedDifferentVariantRef.current &&
      initialVariantId &&
      selection.variant.id === initialVariantId
    ) {
      return;
    }

    /**
     * از اینجا به بعد کاربر واقعاً Variant جدیدی انتخاب کرده است
     */
    hasSelectedDifferentVariantRef.current = true;

    onVehicleSelected(selection);
  }

  return (
    <section className={className}>
      <p className='text-sm font-semibold text-brand'>انتخاب خودرو</p>

      <h3 className='mt-1 text-base font-bold text-foreground'>برند، مدل و تیپ خودرو</h3>

      <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
        مشخصات خودرو را دقیق انتخاب کنید تا در فهرست خودروهای شما ذخیره شود
      </p>

      <VehicleVariantPicker
        initialSelection={initialSelection}
        resetKey={resetKey}
        layout='stacked'
        onSelectionChange={handleSelectionChange}
        className='mt-5'
      />
    </section>
  );
}
