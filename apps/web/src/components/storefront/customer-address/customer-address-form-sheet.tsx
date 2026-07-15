'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type {
  CustomerAddressBaseInput,
  StorefrontCustomerAddress,
} from '@/lib/storefront/customer-address/customer-address.types';
import { toLatinDigits } from '@/lib/utils/digits';
import { MapPinned, Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

type AddressFormValues = CustomerAddressBaseInput & {
  isDefault: boolean;
};

type AddressField = keyof AddressFormValues;

type AddressFieldErrors = Partial<Record<AddressField, string>>;

export type CustomerAddressFormSubmitValue = CustomerAddressBaseInput & {
  isDefault: boolean;
};

type CustomerAddressFormSheetProps = {
  open: boolean;
  address: StorefrontCustomerAddress | null;
  initialDefault?: boolean;
  loading?: boolean;

  onOpenChange: (open: boolean) => void;
  onSubmit: (value: CustomerAddressFormSubmitValue) => Promise<boolean>;
};

function createEmptyForm(initialDefault: boolean): AddressFormValues {
  return {
    label: '',
    recipientFirstName: '',
    recipientLastName: '',
    recipientMobile: '',
    province: '',
    city: '',
    district: '',
    addressLine: '',
    postalCode: '',
    plaque: '',
    floor: '',
    unit: '',
    deliveryNotes: '',
    isDefault: initialDefault,
  };
}

function getInitialForm(
  address: StorefrontCustomerAddress | null,
  initialDefault: boolean,
): AddressFormValues {
  if (!address) {
    return createEmptyForm(initialDefault);
  }

  return {
    label: address.label,
    recipientFirstName: address.recipientFirstName,
    recipientLastName: address.recipientLastName,
    recipientMobile: address.recipientMobile,
    province: address.province,
    city: address.city,
    district: address.district ?? '',
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    plaque: address.plaque ?? '',
    floor: address.floor ?? '',
    unit: address.unit ?? '',
    deliveryNotes: address.deliveryNotes ?? '',
    isDefault: address.isDefault,
  };
}

function normalizeOptionalText(value?: string | null): string | undefined {
  return value?.trim() || undefined;
}

function normalizeMobile(value: string): string | null {
  const digits = toLatinDigits(value).replace(/\D/g, '');

  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^989\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }

  if (/^00989\d{9}$/.test(digits)) {
    return `0${digits.slice(4)}`;
  }

  return null;
}

function normalizePostalCode(value: string): string {
  return toLatinDigits(value).replace(/\D/g, '');
}

function validateForm(form: AddressFormValues): AddressFieldErrors {
  const errors: AddressFieldErrors = {};

  if (!form.label.trim()) {
    errors.label = 'عنوان نشانی را وارد کنید';
  }

  if (!form.recipientFirstName.trim()) {
    errors.recipientFirstName = 'نام گیرنده را وارد کنید';
  }

  if (!form.recipientLastName.trim()) {
    errors.recipientLastName = 'نام خانوادگی گیرنده را وارد کنید';
  }

  if (!normalizeMobile(form.recipientMobile)) {
    errors.recipientMobile = 'شماره موبایل معتبر وارد کنید';
  }

  if (!form.province.trim()) {
    errors.province = 'استان را وارد کنید';
  }

  if (!form.city.trim()) {
    errors.city = 'شهر را وارد کنید';
  }

  if (!form.addressLine.trim()) {
    errors.addressLine = 'نشانی کامل را وارد کنید';
  }

  if (!/^\d{10}$/.test(normalizePostalCode(form.postalCode))) {
    errors.postalCode = 'کد پستی باید ۱۰ رقم باشد';
  }

  return errors;
}

export function CustomerAddressFormSheet({
  open,
  address,
  initialDefault = false,
  loading = false,
  onOpenChange,
  onSubmit,
}: CustomerAddressFormSheetProps) {
  const [form, setForm] = useState<AddressFormValues>(createEmptyForm(initialDefault));

  const [errors, setErrors] = useState<AddressFieldErrors>({});

  const isExistingDefault = Boolean(address?.isDefault);
  const isFirstAddress = !address && initialDefault;
  const isDefaultLocked = isExistingDefault || isFirstAddress;

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(getInitialForm(address, initialDefault));
    setErrors({});
  }, [address, initialDefault, open]);

  function updateField<K extends AddressField>(field: K, value: AddressFormValues[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const recipientMobile = normalizeMobile(form.recipientMobile);

    if (!recipientMobile) {
      return;
    }

    const completed = await onSubmit({
      label: form.label.trim(),
      recipientFirstName: form.recipientFirstName.trim(),
      recipientLastName: form.recipientLastName.trim(),
      recipientMobile,
      province: form.province.trim(),
      city: form.city.trim(),
      district: normalizeOptionalText(form.district),
      addressLine: form.addressLine.trim(),
      postalCode: normalizePostalCode(form.postalCode),
      plaque: normalizeOptionalText(form.plaque),
      floor: normalizeOptionalText(form.floor),
      unit: normalizeOptionalText(form.unit),
      deliveryNotes: normalizeOptionalText(form.deliveryNotes),
      isDefault: form.isDefault,
    });

    if (completed) {
      onOpenChange(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <SheetContent className='w-full sm:max-w-2xl'>
        <SheetHeader>
          <div className='flex items-start gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <MapPinned className='size-5' />
            </span>

            <div>
              <h2 className='text-lg font-extrabold text-foreground'>
                {address ? 'ویرایش نشانی' : 'افزودن نشانی جدید'}
              </h2>

              <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                اطلاعات گیرنده و نشانی ارسال را با دقت وارد کنید
              </p>
            </div>
          </div>
        </SheetHeader>

        <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
          <SheetBody className='space-y-6'>
            <section className='space-y-4'>
              <div>
                <h3 className='font-extrabold text-foreground'>مشخصات نشانی</h3>

                <p className='mt-1 text-sm text-foreground-secondary'>
                  برای شناسایی سریع این نشانی یک عنوان انتخاب کنید
                </p>
              </div>

              <FormField label='عنوان نشانی' required error={errors.label}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={form.label}
                    required={required}
                    placeholder='مثلاً منزل، محل کار یا تعمیرگاه'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => {
                      updateField('label', event.target.value);
                    }}
                  />
                )}
              </FormField>
            </section>

            <section className='space-y-4 border-t border-border pt-6'>
              <div>
                <h3 className='font-extrabold text-foreground'>اطلاعات گیرنده</h3>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField label='نام گیرنده' required error={errors.recipientFirstName}>
                  {({ id, labelId, describedBy, invalid, required }) => (
                    <Input
                      id={id}
                      value={form.recipientFirstName}
                      required={required}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      onChange={(event) => {
                        updateField('recipientFirstName', event.target.value);
                      }}
                    />
                  )}
                </FormField>

                <FormField label='نام خانوادگی گیرنده' required error={errors.recipientLastName}>
                  {({ id, labelId, describedBy, invalid, required }) => (
                    <Input
                      id={id}
                      value={form.recipientLastName}
                      required={required}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      onChange={(event) => {
                        updateField('recipientLastName', event.target.value);
                      }}
                    />
                  )}
                </FormField>
              </div>

              <FormField label='شماره موبایل گیرنده' required error={errors.recipientMobile}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    type='tel'
                    inputMode='numeric'
                    autoComplete='tel'
                    value={form.recipientMobile}
                    required={required}
                    placeholder='09123456789'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => {
                      updateField('recipientMobile', event.target.value);
                    }}
                  />
                )}
              </FormField>
            </section>

            <section className='space-y-4 border-t border-border pt-6'>
              <div>
                <h3 className='font-extrabold text-foreground'>نشانی ارسال</h3>
              </div>

              <div className='grid gap-4 sm:grid-cols-3'>
                <FormField label='استان' required error={errors.province}>
                  {({ id, labelId, describedBy, invalid, required }) => (
                    <Input
                      id={id}
                      value={form.province}
                      required={required}
                      placeholder='تهران'
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      onChange={(event) => {
                        updateField('province', event.target.value);
                      }}
                    />
                  )}
                </FormField>

                <FormField label='شهر' required error={errors.city}>
                  {({ id, labelId, describedBy, invalid, required }) => (
                    <Input
                      id={id}
                      value={form.city}
                      required={required}
                      placeholder='تهران'
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      onChange={(event) => {
                        updateField('city', event.target.value);
                      }}
                    />
                  )}
                </FormField>

                <FormField label='منطقه یا محله'>
                  {({ id, labelId, describedBy }) => (
                    <Input
                      id={id}
                      value={form.district ?? ''}
                      placeholder='مثلاً تهرانپارس'
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      onChange={(event) => {
                        updateField('district', event.target.value);
                      }}
                    />
                  )}
                </FormField>
              </div>

              <FormField label='نشانی کامل' required error={errors.addressLine}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Textarea
                    id={id}
                    rows={4}
                    value={form.addressLine}
                    required={required}
                    placeholder='خیابان، کوچه، مجتمع یا جزئیات کامل نشانی'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => {
                      updateField('addressLine', event.target.value);
                    }}
                  />
                )}
              </FormField>

              <div className='grid gap-4 sm:grid-cols-4'>
                <FormField label='کد پستی' required error={errors.postalCode}>
                  {({ id, labelId, describedBy, invalid, required }) => (
                    <Input
                      id={id}
                      dir='ltr'
                      inputMode='numeric'
                      value={form.postalCode}
                      required={required}
                      placeholder='1234567890'
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      onChange={(event) => {
                        updateField('postalCode', event.target.value);
                      }}
                    />
                  )}
                </FormField>

                <FormField label='پلاک'>
                  {({ id, labelId, describedBy }) => (
                    <Input
                      id={id}
                      value={form.plaque ?? ''}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      onChange={(event) => {
                        updateField('plaque', event.target.value);
                      }}
                    />
                  )}
                </FormField>

                <FormField label='طبقه'>
                  {({ id, labelId, describedBy }) => (
                    <Input
                      id={id}
                      value={form.floor ?? ''}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      onChange={(event) => {
                        updateField('floor', event.target.value);
                      }}
                    />
                  )}
                </FormField>

                <FormField label='واحد'>
                  {({ id, labelId, describedBy }) => (
                    <Input
                      id={id}
                      value={form.unit ?? ''}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      onChange={(event) => {
                        updateField('unit', event.target.value);
                      }}
                    />
                  )}
                </FormField>
              </div>

              <FormField label='توضیحات برای ارسال'>
                {({ id, labelId, describedBy }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={form.deliveryNotes ?? ''}
                    placeholder='مثلاً ساعت مناسب تحویل یا توضیحات تکمیلی'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    onChange={(event) => {
                      updateField('deliveryNotes', event.target.value);
                    }}
                  />
                )}
              </FormField>
            </section>

            <label className='flex cursor-pointer items-start gap-3 rounded-control border border-border bg-surface-muted p-4'>
              <input
                type='checkbox'
                checked={form.isDefault}
                disabled={loading || isDefaultLocked}
                className='mt-0.5 size-4 accent-brand'
                onChange={(event) => {
                  updateField('isDefault', event.target.checked);
                }}
              />

              <span>
                <span className='block text-sm font-extrabold text-foreground'>
                  ثبت به‌عنوان نشانی پیش‌فرض
                </span>

                <span className='mt-1 block text-xs leading-6 text-foreground-secondary'>
                  {isExistingDefault
                    ? 'این نشانی هم‌اکنون پیش‌فرض حساب شما است'
                    : isFirstAddress
                      ? 'اولین نشانی حساب شما به‌صورت پیش‌فرض ثبت می‌شود'
                      : 'در مرحله ثبت سفارش، این نشانی ابتدا انتخاب خواهد شد'}
                </span>
              </span>
            </label>
          </SheetBody>

          <SheetFooter>
            <Button
              type='button'
              variant='outline'
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button
              type='submit'
              isLoading={loading}
              loadingLabel='در حال ذخیره'
              iconStart={<Save className='size-4' />}
            >
              {address ? 'ذخیره تغییرات' : 'ثبت نشانی'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
