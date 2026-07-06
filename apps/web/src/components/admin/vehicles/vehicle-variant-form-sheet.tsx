'use client';

import type { VehicleYearCalendar } from '@/lib/admin/catalog/vehicle-catalog.types';
import type {
  AdminVehicleMakeListItem,
  AdminVehicleModelListItem,
  AdminVehicleVariantListItem,
  CreateVehicleVariantPayload,
  UpdateVehicleVariantPayload,
} from '@/lib/admin/vehicles/vehicle-management.types';
import { adminVehiclesApi } from '@/lib/api/admin-vehicles-client';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

type VehicleVariantFormValues = {
  makeId: string;
  modelId: string;
  name: string;
  slug: string;
  engineCode: string;
  engineName: string;
  yearFrom: string;
  yearTo: string;
  yearCalendar: VehicleYearCalendar;
  notes: string;
  isActive: boolean;
  sortOrder: string;
};

type VehicleVariantFormErrors = Partial<
  Record<
    | 'makeId'
    | 'modelId'
    | 'name'
    | 'slug'
    | 'engineCode'
    | 'engineName'
    | 'yearFrom'
    | 'yearTo'
    | 'notes'
    | 'sortOrder'
    | 'form',
    string
  >
>;

type VehicleVariantFormSheetProps = {
  open: boolean;
  variant: AdminVehicleVariantListItem | null;
  makes: AdminVehicleMakeListItem[];
  models: AdminVehicleModelListItem[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
};

function getInitialValues(variant: AdminVehicleVariantListItem | null): VehicleVariantFormValues {
  return {
    makeId: variant?.model.make.id ?? '',
    modelId: variant?.modelId ?? '',
    name: variant?.name ?? '',
    slug: variant?.slug ?? '',
    engineCode: variant?.engineCode ?? '',
    engineName: variant?.engineName ?? '',
    yearFrom:
      variant?.yearFrom !== null && variant?.yearFrom !== undefined ? String(variant.yearFrom) : '',
    yearTo: variant?.yearTo !== null && variant?.yearTo !== undefined ? String(variant.yearTo) : '',
    yearCalendar: variant?.yearCalendar ?? 'SHAMSI',
    notes: variant?.notes ?? '',
    isActive: variant?.isActive ?? true,
    sortOrder: String(variant?.sortOrder ?? 0),
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

function parseOptionalInteger(value: string): number | null {
  const normalizedValue = toEnglishDigits(value).replace(/\D/g, '');

  return normalizedValue ? Number(normalizedValue) : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره تیپ یا موتور خودرو با خطا مواجه شد';
}

export function VehicleVariantFormSheet({
  open,
  variant,
  makes,
  models,
  onOpenChange,
  onSaved,
}: VehicleVariantFormSheetProps) {
  const isEditing = Boolean(variant);

  const [values, setValues] = useState<VehicleVariantFormValues>(() => getInitialValues(variant));

  const [errors, setErrors] = useState<VehicleVariantFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const hasCompatibilities = (variant?._count.compatibilities ?? 0) > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(variant));
    setErrors({});
    setIsSaving(false);
  }, [open, variant]);

  const makeOptions = useMemo(
    () =>
      makes.map((make) => ({
        value: make.id,
        label: make.name,
        description: [make.slug, make.isActive ? 'فعال' : 'غیرفعال'].filter(Boolean).join(' · '),
      })),
    [makes],
  );

  const modelOptions = useMemo(
    () =>
      models
        .filter((model) => model.makeId === values.makeId)
        .map((model) => ({
          value: model.id,
          label: model.name,
          description: [model.slug, model.isActive ? 'فعال' : 'غیرفعال']
            .filter(Boolean)
            .join(' · '),
        })),
    [models, values.makeId],
  );

  function setField<TKey extends keyof VehicleVariantFormValues>(
    key: TKey,
    value: VehicleVariantFormValues[TKey],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors({});
  }

  function handleMakeChange(makeId: string) {
    setValues((current) => ({
      ...current,
      makeId,
      modelId: '',
    }));

    setErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: VehicleVariantFormErrors = {};

    const makeId = values.makeId.trim();
    const modelId = values.modelId.trim();
    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);

    const engineCode = values.engineCode.trim();
    const engineName = values.engineName.trim();
    const notes = values.notes.trim();

    const yearFrom = parseOptionalInteger(values.yearFrom);
    const yearTo = parseOptionalInteger(values.yearTo);

    const sortOrderText = toEnglishDigits(values.sortOrder).replace(/\D/g, '');

    const sortOrder = sortOrderText ? Number(sortOrderText) : 0;

    if (!makeId) {
      nextErrors.makeId = 'انتخاب برند خودرو الزامی است';
    }

    if (!modelId) {
      nextErrors.modelId = 'انتخاب مدل خودرو الزامی است';
    }

    if (!name) {
      nextErrors.name = 'نام تیپ یا موتور خودرو الزامی است';
    }

    if (!slug) {
      nextErrors.slug = 'Slug الزامی است';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
    }

    if (yearFrom !== null && (!Number.isSafeInteger(yearFrom) || yearFrom < 1)) {
      nextErrors.yearFrom = 'سال شروع باید یک عدد صحیح بزرگ‌تر از صفر باشد';
    }

    if (yearTo !== null && (!Number.isSafeInteger(yearTo) || yearTo < 1)) {
      nextErrors.yearTo = 'سال پایان باید یک عدد صحیح بزرگ‌تر از صفر باشد';
    }

    if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
      nextErrors.yearTo = 'سال پایان نمی‌تواند قبل از سال شروع باشد';
    }

    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
      nextErrors.sortOrder = 'ترتیب نمایش باید یک عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (Object.keys(nextErrors).length > 0) {
      console.log(nextErrors);
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      if (variant) {
        const payload: UpdateVehicleVariantPayload = {
          modelId,
          name,
          slug,
          engineCode: engineCode || null,
          engineName: engineName || null,
          yearFrom,
          yearTo,
          yearCalendar: values.yearCalendar,
          notes: notes || null,
          isActive: values.isActive,
          sortOrder,
        };

        await adminVehiclesApi.updateVariant(variant.id, payload);
      } else {
        const payload: CreateVehicleVariantPayload = {
          modelId,
          name,
          slug,
          yearCalendar: values.yearCalendar,
          isActive: values.isActive,
          sortOrder,

          ...(engineCode
            ? {
                engineCode,
              }
            : {}),

          ...(engineName
            ? {
                engineName,
              }
            : {}),

          ...(yearFrom !== null
            ? {
                yearFrom,
              }
            : {}),

          ...(yearTo !== null
            ? {
                yearTo,
              }
            : {}),

          ...(notes
            ? {
                notes,
              }
            : {}),
        };

        await adminVehiclesApi.createVariant(payload);
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
          <SheetTitle>
            {isEditing ? 'ویرایش تیپ / موتور خودرو' : 'افزودن تیپ / موتور خودرو'}
          </SheetTitle>

          <SheetDescription>
            تیپ، موتور و بازه سال دقیق‌ترین سطح انتخاب خودرو برای تعیین سازگاری قطعه هستند
          </SheetDescription>
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

            {hasCompatibilities ? (
              <div className='rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm leading-6 text-warning'>
                این تیپ یا موتور به سازگاری محصول متصل است؛ بنابراین برند و مدل خودرو قابل تغییر
                نیستند
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
                  clearable={!hasCompatibilities}
                  disabled={isSaving || hasCompatibilities}
                  onValueChange={handleMakeChange}
                  placeholder='انتخاب برند خودرو'
                  searchPlaceholder='جستجو در برندهای خودرو'
                  emptyMessage='برند خودرویی پیدا نشد'
                />
              )}
            </FormField>

            <FormField label='مدل خودرو' required error={errors.modelId}>
              {({ id, labelId, describedBy, invalid, required }) => (
                <Combobox
                  id={id}
                  value={values.modelId}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  aria-required={required}
                  options={modelOptions}
                  clearable={!hasCompatibilities}
                  disabled={isSaving || hasCompatibilities || !values.makeId}
                  onValueChange={(value) => setField('modelId', value)}
                  placeholder='انتخاب مدل خودرو'
                  searchPlaceholder='جستجو در مدل‌های خودرو'
                  emptyMessage='مدل خودرویی پیدا نشد'
                />
              )}
            </FormField>

            <div className='grid gap-5 sm:grid-cols-2'>
              <FormField
                label='نام مدل'
                helperText='دناپلاس توربو TU5'
                error={errors.name}
                required
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={100}
                    value={values.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder='دنا پلاس توربو'
                  />
                )}
              </FormField>
              <FormField label='slug' helperText='TU5' error={errors.slug} required>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={100}
                    value={values.slug}
                    onChange={(event) => setField('slug', event.target.value)}
                    placeholder='TU5'
                  />
                )}
              </FormField>
            </div>

            <div className='grid gap-5 sm:grid-cols-2'>
              <FormField label='کد موتور' helperText='اختیاری، مثلاً TU5' error={errors.engineCode}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={100}
                    value={values.engineCode}
                    onChange={(event) => setField('engineCode', event.target.value)}
                    placeholder='TU5'
                  />
                )}
              </FormField>

              <FormField
                label='نام موتور'
                helperText='اختیاری، مثلاً TU5JP4'
                error={errors.engineName}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={160}
                    value={values.engineName}
                    onChange={(event) => setField('engineName', event.target.value)}
                    placeholder='TU5JP4'
                  />
                )}
              </FormField>
            </div>

            <div className='grid gap-5 sm:grid-cols-3'>
              <FormField label='سال شروع' helperText='اختیاری' error={errors.yearFrom}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    inputMode='numeric'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.yearFrom}
                    onChange={(event) =>
                      setField('yearFrom', toEnglishDigits(event.target.value).replace(/\D/g, ''))
                    }
                    placeholder='1380'
                  />
                )}
              </FormField>

              <FormField label='سال پایان' helperText='اختیاری' error={errors.yearTo}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    inputMode='numeric'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.yearTo}
                    onChange={(event) =>
                      setField('yearTo', toEnglishDigits(event.target.value).replace(/\D/g, ''))
                    }
                    placeholder='1391'
                  />
                )}
              </FormField>

              <FormField label='نوع تقویم'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Select
                    id={id}
                    value={values.yearCalendar}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    onValueChange={(value) =>
                      setField('yearCalendar', value as VehicleYearCalendar)
                    }
                    options={[
                      {
                        value: 'SHAMSI',
                        label: 'شمسی',
                      },
                      {
                        value: 'GREGORIAN',
                        label: 'میلادی',
                      },
                    ]}
                  />
                )}
              </FormField>
            </div>

            <FormField
              label='یادداشت فنی'
              helperText='مثلاً رنگ بدنه سنسور و نوع سوکت پیش از ارسال بررسی شود'
              error={errors.notes}
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  rows={4}
                  maxLength={2000}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving}
                  value={values.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                  placeholder='یادداشت فنی اختیاری'
                />
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
              helperText='تیپ یا موتور غیرفعال در انتخاب سازگاری محصول نمایش داده نمی‌شود'
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
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد تیپ / موتور'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
