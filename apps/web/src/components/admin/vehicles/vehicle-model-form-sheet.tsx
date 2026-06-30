'use client';

import type {
  AdminVehicleMakeListItem,
  AdminVehicleModelListItem,
  CreateVehicleModelPayload,
  UpdateVehicleModelPayload,
} from '@/lib/admin/vehicles/vehicle-management.types';
import { adminVehiclesApi } from '@/lib/api/admin-vehicles-client';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { ImageUrlPreview } from '@/components/ui/image-url-preview';

import { isValidRemoteImageUrl, normalizeImageUrl } from '@/lib/utils/image-url';

type VehicleModelFormValues = {
  makeId: string;
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

type VehicleModelFormErrors = Partial<
  Record<'makeId' | 'name' | 'slug' | 'sortOrder' | 'form' | 'imageUrl', string>
>;

type VehicleModelFormSheetProps = {
  open: boolean;
  model: AdminVehicleModelListItem | null;
  makes: AdminVehicleMakeListItem[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
};

function getInitialValues(model: AdminVehicleModelListItem | null): VehicleModelFormValues {
  return {
    makeId: model?.makeId ?? '',
    name: model?.name ?? '',
    slug: model?.slug ?? '',
    imageUrl: model?.imageUrl ?? '',
    sortOrder: String(model?.sortOrder ?? 0),
    isActive: model?.isActive ?? true,
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

  return 'ذخیره مدل خودرو با خطا مواجه شد';
}

export function VehicleModelFormSheet({
  open,
  model,
  makes,
  onOpenChange,
  onSaved,
}: VehicleModelFormSheetProps) {
  const isEditing = Boolean(model);

  const [values, setValues] = useState<VehicleModelFormValues>(() => getInitialValues(model));

  const [errors, setErrors] = useState<VehicleModelFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const hasVariants = (model?._count.variants ?? 0) > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(model));
    setErrors({});
    setIsSaving(false);
  }, [model, open]);

  const makeOptions = useMemo(
    () =>
      makes.map((make) => ({
        value: make.id,
        label: make.name,
        description: [make.slug, make.isActive ? 'فعال' : 'غیرفعال'].filter(Boolean).join(' · '),
      })),
    [makes],
  );

  function setField<TKey extends keyof VehicleModelFormValues>(
    key: TKey,
    value: VehicleModelFormValues[TKey],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: VehicleModelFormErrors = {};

    const makeId = values.makeId.trim();
    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);
    const imageUrl = normalizeImageUrl(values.imageUrl);

    const normalizedSortOrder = toEnglishDigits(values.sortOrder).trim();

    const sortOrder = normalizedSortOrder ? Number(normalizedSortOrder) : 0;

    if (!makeId) {
      nextErrors.makeId = 'انتخاب برند خودرو الزامی است';
    }

    if (!name) {
      nextErrors.name = 'نام مدل خودرو الزامی است';
    }

    if (!slug) {
      nextErrors.slug = 'Slug الزامی است';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
    }

    if (!isValidRemoteImageUrl(imageUrl)) {
      nextErrors.imageUrl = 'آدرس تصویر باید با http:// یا https:// شروع شود';
    }

    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
      nextErrors.sortOrder = 'ترتیب نمایش باید یک عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const basePayload = {
      makeId,
      name,
      slug,
      sortOrder,
      isActive: values.isActive,
    };

    setIsSaving(true);
    setErrors({});

    try {
      if (model) {
        const payload: UpdateVehicleModelPayload = {
          ...basePayload,
          imageUrl: imageUrl || null,
        };

        await adminVehiclesApi.updateModel(model.id, payload);
      } else {
        const payload: CreateVehicleModelPayload = {
          ...basePayload,
          ...(imageUrl
            ? {
                imageUrl,
              }
            : {}),
        };

        await adminVehiclesApi.createModel(payload);
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
          <SheetTitle>{isEditing ? 'ویرایش مدل خودرو' : 'افزودن مدل خودرو'}</SheetTitle>

          <SheetDescription>هر مدل باید به یک برند خودرو متصل باشد</SheetDescription>
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

            {hasVariants ? (
              <div className='rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm leading-6 text-warning'>
                این مدل دارای Variant است؛ بنابراین برند خودرو قابل تغییر نیست
              </div>
            ) : null}

            <FormField label='برند خودرو' required error={errors.makeId}>
              {({ id, labelId, describedBy, invalid, required }) => (
                <Combobox
                  id={id}
                  value={values.makeId}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  aria-required={required}
                  options={makeOptions}
                  clearable={!hasVariants}
                  disabled={isSaving || hasVariants}
                  onValueChange={(value) => setField('makeId', value)}
                  placeholder='انتخاب برند خودرو'
                  searchPlaceholder='جستجو در برندهای خودرو'
                  emptyMessage='برند خودرویی پیدا نشد'
                />
              )}
            </FormField>

            <FormField label='نام مدل خودرو' required error={errors.name}>
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
                  placeholder='مثلاً 206'
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
                  placeholder='peugeot-206'
                />
              )}
            </FormField>

            <FormField
              label='آدرس تصویر خودرو'
              helperText='یک تصویر استاندارد از مدل خودرو وارد کنید؛ Variantها از همین تصویر استفاده می‌کنند'
              error={errors.imageUrl}
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
                    value={values.imageUrl}
                    onChange={(event) => setField('imageUrl', event.target.value)}
                    onBlur={() => setField('imageUrl', normalizeImageUrl(values.imageUrl))}
                    placeholder='https://cdn.example.com/peugeot-206.webp'
                  />

                  <ImageUrlPreview
                    src={values.imageUrl}
                    alt={values.name ? `تصویر ${values.name}` : 'پیش‌نمایش مدل خودرو'}
                    className='aspect-video w-full'
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
              helperText='مدل غیرفعال در انتخاب سازگاری محصولات نمایش داده نمی‌شود'
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
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد مدل خودرو'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
