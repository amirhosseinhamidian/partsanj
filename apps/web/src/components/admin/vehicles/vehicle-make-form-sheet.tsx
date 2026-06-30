'use client';

import type {
  AdminVehicleMakeListItem,
  CreateVehicleMakePayload,
  UpdateVehicleMakePayload,
} from '@/lib/admin/vehicles/vehicle-management.types';
import { adminVehiclesApi } from '@/lib/api/admin-vehicles-client';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { ImageUrlPreview } from '@/components/ui/image-url-preview';

import { isValidRemoteImageUrl, normalizeImageUrl } from '@/lib/utils/image-url';

type VehicleMakeFormValues = {
  name: string;
  slug: string;
  sortOrder: string;
  logoUrl: string;
  isActive: boolean;
};

type VehicleMakeFormErrors = Partial<
  Record<'name' | 'slug' | 'sortOrder' | 'form' | 'logoUrl', string>
>;

type VehicleMakeFormSheetProps = {
  open: boolean;
  make: AdminVehicleMakeListItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
};

function getInitialValues(make: AdminVehicleMakeListItem | null): VehicleMakeFormValues {
  return {
    name: make?.name ?? '',
    slug: make?.slug ?? '',
    logoUrl: make?.logoUrl ?? '',
    sortOrder: String(make?.sortOrder ?? 0),
    isActive: make?.isActive ?? true,
  };
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره برند خودرو با خطا مواجه شد';
}

export function VehicleMakeFormSheet({
  open,
  make,
  onOpenChange,
  onSaved,
}: VehicleMakeFormSheetProps) {
  const isEditing = Boolean(make);

  const [values, setValues] = useState<VehicleMakeFormValues>(() => getInitialValues(make));

  const [errors, setErrors] = useState<VehicleMakeFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(make));
    setErrors({});
    setIsSaving(false);
  }, [make, open]);

  function setField<TKey extends keyof VehicleMakeFormValues>(
    key: TKey,
    value: VehicleMakeFormValues[TKey],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: VehicleMakeFormErrors = {};

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);
    const logoUrl = normalizeImageUrl(values.logoUrl);

    const normalizedSortOrder = toEnglishDigits(values.sortOrder).trim();

    const sortOrder = normalizedSortOrder ? Number(normalizedSortOrder) : 0;

    if (!name) {
      nextErrors.name = 'نام برند خودرو الزامی است';
    }

    if (!slug) {
      nextErrors.slug = 'Slug الزامی است';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
    }

    if (!isValidRemoteImageUrl(logoUrl)) {
      nextErrors.logoUrl = 'آدرس تصویر باید با http:// یا https:// شروع شود';
    }

    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
      nextErrors.sortOrder = 'ترتیب نمایش باید یک عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const basePayload = {
      name,
      slug,
      sortOrder,
      isActive: values.isActive,
    };

    setIsSaving(true);
    setErrors({});

    try {
      if (make) {
        const payload: UpdateVehicleMakePayload = {
          ...basePayload,
          logoUrl: logoUrl || null,
        };

        await adminVehiclesApi.updateMake(make.id, payload);
      } else {
        const payload: CreateVehicleMakePayload = {
          ...basePayload,
          ...(logoUrl
            ? {
                logoUrl,
              }
            : {}),
        };

        await adminVehiclesApi.createMake(payload);
      }

      await onSaved();
      onOpenChange(false);
    } catch (error) {
      setErrors({
        form: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSaving) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <SheetContent className='w-full sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'ویرایش برند خودرو' : 'افزودن برند خودرو'}</SheetTitle>

          <SheetDescription>برند خودرو، سطح اول ساختار سازگاری قطعات است</SheetDescription>
        </SheetHeader>

        <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
          <SheetBody className='space-y-5'>
            {errors.form ? (
              <div
                role='alert'
                className='rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger'
              >
                {errors.form}
              </div>
            ) : null}

            <FormField label='نام برند خودرو' required error={errors.name}>
              {({ id, labelId, describedBy, invalid, required }) => (
                <Input
                  id={id}
                  required={required}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving}
                  maxLength={120}
                  value={values.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder='مثلاً پژو'
                />
              )}
            </FormField>

            <FormField
              label='Slug'
              required
              helperText='فقط حروف انگلیسی کوچک، عدد و خط تیره'
              error={errors.slug}
            >
              {({ id, labelId, describedBy, invalid, required }) => (
                <Input
                  id={id}
                  required={required}
                  dir='ltr'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving}
                  maxLength={160}
                  value={values.slug}
                  onChange={(event) => setField('slug', event.target.value)}
                  onBlur={() => setField('slug', normalizeSlug(values.slug))}
                  placeholder='peugeot'
                />
              )}
            </FormField>

            <FormField
              label='آدرس لوگوی برند خودرو'
              helperText='فعلاً URL تصویر را وارد کنید؛ بعداً Upload فایل همین URL را پر می‌کند'
              error={errors.logoUrl}
            >
              {({ id, labelId, describedBy, invalid }) => (
                <div className='space-y-3'>
                  <Input
                    id={id}
                    type='url'
                    dir='ltr'
                    inputMode='url'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={2048}
                    value={values.logoUrl}
                    onChange={(event) => setField('logoUrl', event.target.value)}
                    onBlur={() => setField('logoUrl', normalizeImageUrl(values.logoUrl))}
                    placeholder='https://cdn.example.com/peugeot-logo.webp'
                  />

                  <ImageUrlPreview
                    src={values.logoUrl}
                    alt={values.name ? `لوگوی ${values.name}` : 'پیش‌نمایش لوگوی برند خودرو'}
                    className='h-36 w-full'
                  />
                </div>
              )}
            </FormField>

            <FormField
              label='ترتیب نمایش'
              helperText='عدد کوچک‌تر در لیست‌ها زودتر نمایش داده می‌شود'
              error={errors.sortOrder}
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Input
                  id={id}
                  dir='ltr'
                  inputMode='numeric'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving}
                  value={values.sortOrder}
                  onChange={(event) =>
                    setField('sortOrder', toEnglishDigits(event.target.value).replace(/\D/g, ''))
                  }
                  placeholder='0'
                />
              )}
            </FormField>

            <FormField
              label='وضعیت فعال'
              helperText='برند غیرفعال در انتخاب سازگاری محصولات نمایش داده نمی‌شود'
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Switch
                  id={id}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving}
                  checked={values.isActive}
                  onCheckedChange={(checked) => setField('isActive', checked)}
                />
              )}
            </FormField>
          </SheetBody>

          <SheetFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button type='submit' iconStart={<Save />} isLoading={isSaving} disabled={isSaving}>
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد برند خودرو'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
