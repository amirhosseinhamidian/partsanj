'use client';

import { useToast } from '@/components/providers/toast-provider';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { storefrontCustomerAddressApi } from '@/lib/api/storefront-customer-address-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  CreateCustomerAddressInput,
  StorefrontCustomerAddress,
  UpdateCustomerAddressInput,
} from '@/lib/storefront/customer-address/customer-address.types';
import { cn } from '@/lib/utils/cn';
import { toLatinDigits, toPersianDigits } from '@/lib/utils/digits';
import { Check, CircleAlert, Edit3, MapPin, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

type AddressFormValues = {
  label: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientMobile: string;
  province: string;
  city: string;
  district: string;
  addressLine: string;
  postalCode: string;
  plaque: string;
  floor: string;
  unit: string;
  deliveryNotes: string;
  isDefault: boolean;
};

type AddressFormErrors = Partial<Record<keyof AddressFormValues, string>>;

type AddressSheetState =
  | {
      mode: 'create';
      address: null;
    }
  | {
      mode: 'edit';
      address: StorefrontCustomerAddress;
    }
  | null;

type AddressManagerProps = {
  selectedAddressId?: string | null;
  onSelectedAddressChange?: (address: StorefrontCustomerAddress | null) => void;
  onAuthRequired?: () => void;
  selectionMode?: boolean;
  title?: string;
  description?: string;
  className?: string;
};

const EMPTY_FORM_VALUES: AddressFormValues = {
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
  isDefault: false,
};

function getAddressFormValues(address: StorefrontCustomerAddress | null): AddressFormValues {
  if (!address) {
    return EMPTY_FORM_VALUES;
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

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'عملیات آدرس با خطا مواجه شد';
}

function toOptionalText(value: string): string | null {
  const normalized = value.trim();

  return normalized || null;
}

function getMobileDigits(value: string): string {
  return toLatinDigits(value).replace(/\D/g, '');
}

function isIranianMobile(value: string): boolean {
  const digits = getMobileDigits(value);

  return /^09\d{9}$/.test(digits) || /^989\d{9}$/.test(digits) || /^00989\d{9}$/.test(digits);
}

function getPostalCodeDigits(value: string): string {
  return toLatinDigits(value).replace(/\D/g, '');
}

function validateForm(values: AddressFormValues): AddressFormErrors {
  const errors: AddressFormErrors = {};

  if (!values.label.trim()) {
    errors.label = 'برای این آدرس یک عنوان وارد کنید';
  }

  if (!values.recipientFirstName.trim()) {
    errors.recipientFirstName = 'نام گیرنده الزامی است';
  }

  if (!values.recipientLastName.trim()) {
    errors.recipientLastName = 'نام خانوادگی گیرنده الزامی است';
  }

  if (!isIranianMobile(values.recipientMobile)) {
    errors.recipientMobile = 'شماره موبایل را با فرمت معتبر وارد کنید';
  }

  if (!values.province.trim()) {
    errors.province = 'استان الزامی است';
  }

  if (!values.city.trim()) {
    errors.city = 'شهر الزامی است';
  }

  if (values.addressLine.trim().length < 5) {
    errors.addressLine = 'نشانی کامل را وارد کنید';
  }

  if (!/^\d{10}$/.test(getPostalCodeDigits(values.postalCode))) {
    errors.postalCode = 'کدپستی باید دقیقاً ۱۰ رقم باشد';
  }

  return errors;
}

function toCreateInput(values: AddressFormValues): CreateCustomerAddressInput {
  return {
    label: values.label.trim(),
    recipientFirstName: values.recipientFirstName.trim(),
    recipientLastName: values.recipientLastName.trim(),
    recipientMobile: getMobileDigits(values.recipientMobile),
    province: values.province.trim(),
    city: values.city.trim(),
    district: toOptionalText(values.district),
    addressLine: values.addressLine.trim(),
    postalCode: getPostalCodeDigits(values.postalCode),
    plaque: toOptionalText(values.plaque),
    floor: toOptionalText(values.floor),
    unit: toOptionalText(values.unit),
    deliveryNotes: toOptionalText(values.deliveryNotes),
    isDefault: values.isDefault,
  };
}

function toUpdateInput(values: AddressFormValues): UpdateCustomerAddressInput {
  return {
    label: values.label.trim(),
    recipientFirstName: values.recipientFirstName.trim(),
    recipientLastName: values.recipientLastName.trim(),
    recipientMobile: getMobileDigits(values.recipientMobile),
    province: values.province.trim(),
    city: values.city.trim(),
    district: toOptionalText(values.district),
    addressLine: values.addressLine.trim(),
    postalCode: getPostalCodeDigits(values.postalCode),
    plaque: toOptionalText(values.plaque),
    floor: toOptionalText(values.floor),
    unit: toOptionalText(values.unit),
    deliveryNotes: toOptionalText(values.deliveryNotes),
  };
}

function formatAddressLocation(address: StorefrontCustomerAddress): string {
  return [address.province, address.city, address.district].filter(Boolean).join(' · ');
}

function formatAddressDetails(address: StorefrontCustomerAddress): string | null {
  const values = [
    address.plaque ? `پلاک ${toPersianDigits(address.plaque)}` : null,
    address.floor ? `طبقه ${toPersianDigits(address.floor)}` : null,
    address.unit ? `واحد ${toPersianDigits(address.unit)}` : null,
  ].filter(Boolean);

  return values.length ? values.join(' · ') : null;
}

type AddressFormSheetProps = {
  state: AddressSheetState;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: AddressFormValues, address: StorefrontCustomerAddress | null) => Promise<void>;
};

function AddressFormSheet({ state, isSubmitting, onClose, onSubmit }: AddressFormSheetProps) {
  const editingAddress = state?.address ?? null;
  const [values, setValues] = useState<AddressFormValues>(EMPTY_FORM_VALUES);
  const [errors, setErrors] = useState<AddressFormErrors>({});

  useEffect(() => {
    setValues(getAddressFormValues(editingAddress));
    setErrors({});
  }, [editingAddress, state?.mode]);

  const isOpen = state !== null;
  const isEditing = state?.mode === 'edit';

  function updateValue<Key extends keyof AddressFormValues>(
    key: Key,
    value: AddressFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[key];

      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(values, editingAddress);
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent className='w-full sm:max-w-2xl'>
        <SheetHeader>
          <div>
            <h2 className='text-lg font-extrabold text-foreground'>
              {isEditing ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
            </h2>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
              اطلاعات گیرنده و محل تحویل سفارش را وارد کنید
            </p>
          </div>
        </SheetHeader>

        <form
          className='flex min-h-0 flex-1 flex-col'
          onSubmit={(event) => void handleSubmit(event)}
        >
          <SheetBody className='space-y-5'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField label='عنوان آدرس' required error={errors.label}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={values.label}
                    required={required}
                    placeholder='مثلاً منزل، محل کار یا تعمیرگاه'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('label', event.target.value)}
                  />
                )}
              </FormField>

              <FormField label='شماره موبایل گیرنده' required error={errors.recipientMobile}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    inputMode='numeric'
                    value={values.recipientMobile}
                    required={required}
                    placeholder='09123456789'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('recipientMobile', event.target.value)}
                  />
                )}
              </FormField>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField label='نام گیرنده' required error={errors.recipientFirstName}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={values.recipientFirstName}
                    required={required}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('recipientFirstName', event.target.value)}
                  />
                )}
              </FormField>

              <FormField label='نام خانوادگی گیرنده' required error={errors.recipientLastName}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={values.recipientLastName}
                    required={required}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('recipientLastName', event.target.value)}
                  />
                )}
              </FormField>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField label='استان' required error={errors.province}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={values.province}
                    required={required}
                    placeholder='مثلاً تهران'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('province', event.target.value)}
                  />
                )}
              </FormField>

              <FormField label='شهر' required error={errors.city}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={values.city}
                    required={required}
                    placeholder='مثلاً تهران'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('city', event.target.value)}
                  />
                )}
              </FormField>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField label='منطقه / محله' error={errors.district}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    value={values.district}
                    placeholder='اختیاری'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('district', event.target.value)}
                  />
                )}
              </FormField>

              <FormField label='کدپستی' required error={errors.postalCode}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    inputMode='numeric'
                    value={values.postalCode}
                    required={required}
                    placeholder='1234567890'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('postalCode', event.target.value)}
                  />
                )}
              </FormField>
            </div>

            <FormField label='نشانی کامل' required error={errors.addressLine}>
              {({ id, labelId, describedBy, invalid, required }) => (
                <Textarea
                  id={id}
                  rows={4}
                  value={values.addressLine}
                  required={required}
                  placeholder='خیابان، کوچه، شماره ساختمان و سایر اطلاعات لازم'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  onChange={(event) => updateValue('addressLine', event.target.value)}
                />
              )}
            </FormField>

            <div className='grid gap-4 sm:grid-cols-3'>
              <FormField label='پلاک'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    inputMode='numeric'
                    value={values.plaque}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('plaque', event.target.value)}
                  />
                )}
              </FormField>

              <FormField label='طبقه'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    inputMode='numeric'
                    value={values.floor}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('floor', event.target.value)}
                  />
                )}
              </FormField>

              <FormField label='واحد'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    inputMode='numeric'
                    value={values.unit}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => updateValue('unit', event.target.value)}
                  />
                )}
              </FormField>
            </div>

            <FormField label='توضیحات تحویل'>
              {({ id, labelId, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  rows={3}
                  value={values.deliveryNotes}
                  placeholder='اختیاری؛ مثلاً ساعت مناسب تحویل یا توضیحات ورود'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  onChange={(event) => updateValue('deliveryNotes', event.target.value)}
                />
              )}
            </FormField>

            {!isEditing ? (
              <label className='flex cursor-pointer items-start gap-3 rounded-control border border-border bg-surface-muted p-4'>
                <input
                  type='checkbox'
                  checked={values.isDefault}
                  onChange={(event) => updateValue('isDefault', event.target.checked)}
                  className='mt-1 size-4 accent-brand'
                />

                <span>
                  <span className='block text-sm font-bold text-foreground'>
                    آدرس پیش‌فرض من باشد
                  </span>

                  <span className='mt-1 block text-xs leading-5 text-foreground-secondary'>
                    برای سفارش‌های بعدی این آدرس به‌صورت پیش‌فرض انتخاب می‌شود
                  </span>
                </span>
              </label>
            ) : null}
          </SheetBody>

          <SheetFooter className='gap-3'>
            <Button type='button' variant='outline' disabled={isSubmitting} onClick={onClose}>
              انصراف
            </Button>

            <Button
              type='submit'
              isLoading={isSubmitting}
              loadingLabel={isEditing ? 'در حال ذخیره تغییرات' : 'در حال ثبت آدرس'}
            >
              {isEditing ? 'ذخیره تغییرات' : 'ثبت آدرس'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function AddressManager({
  selectedAddressId,
  onSelectedAddressChange,
  onAuthRequired,
  selectionMode,
  title = 'آدرس‌های ارسال',
  description = 'آدرس موردنظر برای تحویل سفارش را مدیریت یا انتخاب کنید',
  className,
}: AddressManagerProps) {
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<StorefrontCustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [defaultingAddressId, setDefaultingAddressId] = useState<string | null>(null);
  const [archivingAddressId, setArchivingAddressId] = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<AddressSheetState>(null);
  const [internalSelectedAddressId, setInternalSelectedAddressId] = useState<string | null>(null);

  const isSelectionControlled = selectedAddressId !== undefined;

  const effectiveSelectedAddressId = isSelectionControlled
    ? selectedAddressId
    : internalSelectedAddressId;

  const isSelectionEnabled = selectionMode ?? Boolean(onSelectedAddressChange);

  const loadAddresses = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setIsLoading(true);
      }

      setLoadError(null);

      try {
        const response = await storefrontCustomerAddressApi.list();

        setAddresses(response.data);

        return response.data;
      } catch (error) {
        if (error instanceof ClientApiError && error.status === 401) {
          onAuthRequired?.();
        }
        setLoadError(getErrorMessage(error));

        return null;
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [onAuthRequired],
  );

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === effectiveSelectedAddressId) ?? null,
    [addresses, effectiveSelectedAddressId],
  );

  const selectAddress = useCallback(
    (address: StorefrontCustomerAddress | null) => {
      if (!isSelectionControlled) {
        setInternalSelectedAddressId(address?.id ?? null);
      }

      onSelectedAddressChange?.(address);
    },
    [isSelectionControlled, onSelectedAddressChange],
  );

  useEffect(() => {
    if (!isSelectionEnabled || selectedAddress || addresses.length === 0) {
      return;
    }

    const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];

    selectAddress(defaultAddress);
  }, [addresses, isSelectionEnabled, selectAddress, selectedAddress]);

  async function handleSubmitAddress(
    values: AddressFormValues,
    editingAddress: StorefrontCustomerAddress | null,
  ) {
    setIsSubmitting(true);

    try {
      const savedAddress = editingAddress
        ? (await storefrontCustomerAddressApi.update(editingAddress.id, toUpdateInput(values))).data
        : (await storefrontCustomerAddressApi.create(toCreateInput(values))).data;

      setAddresses((current) => {
        const withoutSavedAddress = current.filter((address) => address.id !== savedAddress.id);

        const nextAddresses = savedAddress.isDefault
          ? withoutSavedAddress.map((address) => ({
              ...address,
              isDefault: false,
            }))
          : withoutSavedAddress;

        return [savedAddress, ...nextAddresses].sort((first, second) => {
          if (first.isDefault !== second.isDefault) {
            return first.isDefault ? -1 : 1;
          }

          return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
        });
      });

      if (selectedAddress?.id === savedAddress.id || !selectedAddress) {
        selectAddress(savedAddress);
      }

      setSheetState(null);

      toast({
        position: 'top-left',
        variant: 'success',
        title: editingAddress ? 'آدرس با موفقیت ویرایش شد' : 'آدرس جدید ثبت شد',
      });
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: editingAddress ? 'ویرایش آدرس انجام نشد' : 'ثبت آدرس انجام نشد',
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSetDefaultAddress(address: StorefrontCustomerAddress) {
    setDefaultingAddressId(address.id);

    try {
      const response = await storefrontCustomerAddressApi.setDefault(address.id);

      const defaultAddress = response.data;

      setAddresses((current) =>
        current.map((item) => ({
          ...item,
          isDefault: item.id === defaultAddress.id,
        })),
      );

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'آدرس پیش‌فرض به‌روزرسانی شد',
      });
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: 'تغییر آدرس پیش‌فرض انجام نشد',
        description: getErrorMessage(error),
      });
    } finally {
      setDefaultingAddressId(null);
    }
  }

  async function handleArchiveAddress(address: StorefrontCustomerAddress) {
    const confirmed = window.confirm(`آدرس «${address.label}» از فهرست شما حذف شود؟`);

    if (!confirmed) {
      return;
    }

    setArchivingAddressId(address.id);

    try {
      await storefrontCustomerAddressApi.archive(address.id);

      const nextAddresses = (await loadAddresses(false)) ?? [];

      if (effectiveSelectedAddressId === address.id) {
        const fallbackAddress =
          nextAddresses.find((item) => item.isDefault) ?? nextAddresses[0] ?? null;

        selectAddress(fallbackAddress);
      }

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'آدرس از فهرست شما حذف شد',
      });
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: 'حذف آدرس انجام نشد',
        description: getErrorMessage(error),
      });
    } finally {
      setArchivingAddressId(null);
    }
  }

  return (
    <>
      <section className={cn('space-y-5', className)}>
        <header className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h2 className='text-xl font-extrabold text-foreground'>{title}</h2>

            <p className='mt-2 text-sm leading-6 text-foreground-secondary'>{description}</p>
          </div>

          <Button
            type='button'
            iconStart={<Plus className='size-4' />}
            onClick={() =>
              setSheetState({
                mode: 'create',
                address: null,
              })
            }
          >
            افزودن آدرس
          </Button>
        </header>

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-2'>
            {[1, 2].map((item) => (
              <div key={item} className='h-52 animate-pulse rounded-card bg-surface-muted' />
            ))}
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <div className='rounded-card border border-danger/30 bg-danger-soft p-6 text-center'>
            <CircleAlert className='mx-auto size-8 text-danger' />

            <h3 className='mt-4 text-lg font-extrabold text-foreground'>
              دریافت آدرس‌ها انجام نشد
            </h3>

            <p className='mx-auto mt-2 max-w-lg text-sm leading-7 text-foreground-secondary'>
              {loadError}
            </p>

            <Button
              type='button'
              variant='outline'
              className='mt-5'
              iconStart={<RefreshCw className='size-4' />}
              onClick={() => void loadAddresses()}
            >
              تلاش مجدد
            </Button>
          </div>
        ) : null}

        {!isLoading && !loadError && addresses.length === 0 ? (
          <div className='rounded-card border border-dashed border-border bg-surface p-8 text-center sm:p-10'>
            <span className='mx-auto grid size-14 place-items-center rounded-full bg-brand-soft text-brand'>
              <MapPin className='size-7' />
            </span>

            <h3 className='mt-4 text-lg font-extrabold text-foreground'>هنوز آدرسی ثبت نشده است</h3>

            <p className='mx-auto mt-2 max-w-md text-sm leading-7 text-foreground-secondary'>
              برای ثبت سفارش، ابتدا آدرس تحویل را ثبت کنید
            </p>

            <Button
              type='button'
              className='mt-5'
              iconStart={<Plus className='size-4' />}
              onClick={() =>
                setSheetState({
                  mode: 'create',
                  address: null,
                })
              }
            >
              ثبت اولین آدرس
            </Button>
          </div>
        ) : null}

        {!isLoading && !loadError && addresses.length > 0 ? (
          <div className='grid gap-4 lg:grid-cols-2'>
            {addresses.map((address) => {
              const isSelected = effectiveSelectedAddressId === address.id;

              const addressDetails = formatAddressDetails(address);

              return (
                <article
                  key={address.id}
                  className={cn(
                    'rounded-card border bg-surface p-5 shadow-panel transition-colors',
                    isSelected ? 'border-brand ring-2 ring-brand/20' : 'border-border',
                  )}
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex min-w-0 items-start gap-3'>
                      <span
                        className={cn(
                          'grid size-10 shrink-0 place-items-center rounded-control',
                          isSelected
                            ? 'bg-brand text-brand-foreground'
                            : 'bg-brand-soft text-brand',
                        )}
                      >
                        <MapPin className='size-5' />
                      </span>

                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h3 className='truncate text-base font-extrabold text-foreground'>
                            {address.label}
                          </h3>

                          {address.isDefault ? (
                            <span className='inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-1 text-[11px] font-bold text-warning'>
                              <Star className='size-3 fill-current' />
                              پیش‌فرض
                            </span>
                          ) : null}

                          {isSelectionEnabled && isSelected ? (
                            <span className='inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-[11px] font-bold text-success'>
                              <Check className='size-3' />
                              انتخاب‌شده
                            </span>
                          ) : null}
                        </div>

                        <p className='mt-1 text-xs text-foreground-secondary'>
                          {address.recipientFirstName} {address.recipientLastName} ·{' '}
                          <span dir='ltr'>{toPersianDigits(address.recipientMobile)}</span>
                        </p>
                      </div>
                    </div>

                    <div className='flex shrink-0 items-center gap-2'>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        aria-label={`ویرایش ${address.label}`}
                        title='ویرایش آدرس'
                        iconStart={<Edit3 className='size-4' />}
                        onClick={() =>
                          setSheetState({
                            mode: 'edit',
                            address,
                          })
                        }
                      >
                        ویرایش
                      </Button>
                    </div>
                  </div>

                  <div className='mt-5 border-t border-border pt-4'>
                    <p className='text-sm font-bold text-foreground'>
                      {formatAddressLocation(address)}
                    </p>

                    <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
                      {address.addressLine}
                    </p>

                    {addressDetails ? (
                      <p className='mt-2 text-xs text-foreground-muted'>{addressDetails}</p>
                    ) : null}

                    <p className='mt-2 text-xs text-foreground-muted'>
                      کدپستی:{' '}
                      <span dir='ltr' className='numeric'>
                        {toPersianDigits(address.postalCode)}
                      </span>
                    </p>

                    {address.deliveryNotes ? (
                      <p className='mt-3 rounded-control bg-surface-muted p-3 text-xs leading-6 text-foreground-secondary'>
                        {address.deliveryNotes}
                      </p>
                    ) : null}
                  </div>

                  <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4'>
                    <div className='flex flex-wrap gap-2'>
                      {isSelectionEnabled ? (
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          className={cn(isSelected && 'border-brand bg-brand-soft text-brand')}
                          iconStart={
                            isSelected ? (
                              <Check className='size-4' />
                            ) : (
                              <MapPin className='size-4' />
                            )
                          }
                          onClick={() => selectAddress(address)}
                        >
                          {isSelected ? 'آدرس انتخاب‌شده' : 'انتخاب برای ارسال'}
                        </Button>
                      ) : null}

                      {!address.isDefault ? (
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          isLoading={defaultingAddressId === address.id}
                          loadingLabel='در حال تغییر'
                          iconStart={<Star className='size-4' />}
                          onClick={() => void handleSetDefaultAddress(address)}
                        >
                          پیش‌فرض کردن
                        </Button>
                      ) : null}
                    </div>

                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      isLoading={archivingAddressId === address.id}
                      loadingLabel='در حال حذف'
                      className='text-danger hover:border-danger/40 hover:bg-danger-soft hover:text-danger'
                      iconStart={<Trash2 className='size-4' />}
                      onClick={() => void handleArchiveAddress(address)}
                    >
                      حذف
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <AddressFormSheet
        state={sheetState}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setSheetState(null);
          }
        }}
        onSubmit={handleSubmitAddress}
      />
    </>
  );
}
