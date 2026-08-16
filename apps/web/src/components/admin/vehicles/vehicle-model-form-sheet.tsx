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

import { isValidRemoteImageUrl, normalizeImageUrl } from '@/lib/utils/image-url';
import { AdminSingleImageUploadField } from '../uploads/admin-single-image-upload-field';
import { DropdownOptionImage } from '@/components/ui/dropdown-option-image';

type VehicleModelSeoFields = {
  imageAlt?: string | null;
  description?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;
};

type VehicleModelWithSeo = AdminVehicleModelListItem & VehicleModelSeoFields;

type VehicleModelMutationSeoPayload = {
  imageAlt?: string | null;
  description?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImageUrl?: string | null;
  openGraphImageAlt?: string | null;
};

type VehicleModelFormValues = {
  makeId: string;
  name: string;
  slug: string;

  imageUrl: string;
  imageAlt: string;

  description: string;

  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noIndex: boolean;

  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  openGraphImageAlt: string;

  sortOrder: string;
  isActive: boolean;
};

type VehicleModelFormErrorKey = keyof VehicleModelFormValues | 'form';

type VehicleModelFormErrors = Partial<Record<VehicleModelFormErrorKey, string>>;

type VehicleModelFormSheetProps = {
  open: boolean;
  model: AdminVehicleModelListItem | null;
  makes: AdminVehicleMakeListItem[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
};

function getInitialValues(model: AdminVehicleModelListItem | null): VehicleModelFormValues {
  const seoModel = model as VehicleModelWithSeo | null;

  return {
    makeId: model?.makeId ?? '',
    name: model?.name ?? '',
    slug: model?.slug ?? '',

    imageUrl: model?.imageUrl ?? '',
    imageAlt: seoModel?.imageAlt ?? '',

    description: seoModel?.description ?? '',

    seoTitle: seoModel?.seoTitle ?? '',
    seoDescription: seoModel?.seoDescription ?? '',
    canonicalUrl: seoModel?.canonicalUrl ?? '',
    noIndex: seoModel?.noIndex ?? false,

    openGraphTitle: seoModel?.openGraphTitle ?? '',
    openGraphDescription: seoModel?.openGraphDescription ?? '',
    openGraphImageUrl: seoModel?.openGraphImageUrl ?? '',
    openGraphImageAlt: seoModel?.openGraphImageAlt ?? '',

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

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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
  const [isUploadingVehicleModelImage, setIsUploadingVehicleModelImage] = useState(false);
  const [isUploadingOpenGraphImage, setIsUploadingOpenGraphImage] = useState(false);

  const hasVariants = (model?._count.variants ?? 0) > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(model));
    setErrors({});
    setIsSaving(false);
    setIsUploadingVehicleModelImage(false);
    setIsUploadingOpenGraphImage(false);
  }, [model, open]);

  const makeOptions = useMemo(
    () =>
      makes.map((make) => ({
        value: make.id,
        label: make.name,
        description: [make.slug, make.isActive ? 'فعال' : 'غیرفعال'].filter(Boolean).join(' · '),
        icon: <DropdownOptionImage src={make.logoUrl} alt={make.name} />,
      })),
    [makes],
  );

  const selectedMake = useMemo(
    () => makes.find((make) => make.id === values.makeId) ?? null,
    [makes, values.makeId],
  );

  const vehicleDisplayName = useMemo(
    () => [selectedMake?.name?.trim(), values.name.trim()].filter(Boolean).join(' '),
    [selectedMake?.name, values.name],
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

  function validate(): VehicleModelFormErrors {
    const nextErrors: VehicleModelFormErrors = {};

    const makeId = values.makeId.trim();
    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);

    const imageUrl = normalizeImageUrl(values.imageUrl);
    const imageAlt = values.imageAlt.trim();

    const description = values.description.trim();

    const seoTitle = values.seoTitle.trim();
    const seoDescription = values.seoDescription.trim();
    const canonicalUrl = values.canonicalUrl.trim();

    const openGraphTitle = values.openGraphTitle.trim();
    const openGraphDescription = values.openGraphDescription.trim();
    const openGraphImageUrl = normalizeImageUrl(values.openGraphImageUrl);
    const openGraphImageAlt = values.openGraphImageAlt.trim();

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

    if (imageUrl && !isValidRemoteImageUrl(imageUrl)) {
      nextErrors.imageUrl = 'آدرس تصویر باید با http:// یا https:// شروع شود';
    }

    if (imageUrl && !imageAlt) {
      nextErrors.imageAlt = 'متن جایگزین تصویر خودرو الزامی است';
    }

    if (!imageUrl && imageAlt) {
      nextErrors.imageAlt = 'برای ثبت متن جایگزین، ابتدا تصویر خودرو را وارد کنید';
    }

    if (imageAlt.length > 255) {
      nextErrors.imageAlt = 'متن جایگزین تصویر حداکثر ۲۵۵ کاراکتر است';
    }

    if (description.length > 20_000) {
      nextErrors.description = 'توضیحات صفحه خودرو حداکثر ۲۰۰۰۰ کاراکتر است';
    }

    if (seoTitle.length > 120) {
      nextErrors.seoTitle = 'عنوان SEO حداکثر ۱۲۰ کاراکتر است';
    }

    if (seoDescription.length > 320) {
      nextErrors.seoDescription = 'توضیحات SEO حداکثر ۳۲۰ کاراکتر است';
    }

    if (canonicalUrl.length > 2048) {
      nextErrors.canonicalUrl = 'Canonical URL حداکثر ۲۰۴۸ کاراکتر است';
    } else if (canonicalUrl && !isValidHttpUrl(canonicalUrl)) {
      nextErrors.canonicalUrl = 'Canonical URL باید یک آدرس معتبر با http یا https باشد';
    }

    if (openGraphTitle.length > 160) {
      nextErrors.openGraphTitle = 'عنوان Open Graph حداکثر ۱۶۰ کاراکتر است';
    }

    if (openGraphDescription.length > 500) {
      nextErrors.openGraphDescription = 'توضیحات Open Graph حداکثر ۵۰۰ کاراکتر است';
    }

    if (openGraphImageUrl && !isValidRemoteImageUrl(openGraphImageUrl)) {
      nextErrors.openGraphImageUrl = 'آدرس تصویر Open Graph باید با http:// یا https:// شروع شود';
    }

    if (openGraphImageAlt.length > 255) {
      nextErrors.openGraphImageAlt = 'متن جایگزین Open Graph حداکثر ۲۵۵ کاراکتر است';
    }

    if (openGraphImageUrl && !openGraphImageAlt) {
      nextErrors.openGraphImageAlt = 'برای تصویر Open Graph یک متن جایگزین وارد کنید';
    }

    if (!openGraphImageUrl && openGraphImageAlt) {
      nextErrors.openGraphImageAlt = 'برای ثبت متن جایگزین Open Graph ابتدا تصویر را وارد کنید';
    }

    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
      nextErrors.sortOrder = 'ترتیب نمایش باید یک عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const makeId = values.makeId.trim();
    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);

    const imageUrl = normalizeImageUrl(values.imageUrl);
    const imageAlt = values.imageAlt.trim();

    const description = values.description.trim();

    const seoTitle = values.seoTitle.trim();
    const seoDescription = values.seoDescription.trim();
    const canonicalUrl = values.canonicalUrl.trim();

    const openGraphTitle = values.openGraphTitle.trim();
    const openGraphDescription = values.openGraphDescription.trim();
    const openGraphImageUrl = normalizeImageUrl(values.openGraphImageUrl);
    const openGraphImageAlt = values.openGraphImageAlt.trim();

    const normalizedSortOrder = toEnglishDigits(values.sortOrder).trim();
    const sortOrder = normalizedSortOrder ? Number(normalizedSortOrder) : 0;

    const basePayload = {
      makeId,
      name,
      slug,
      sortOrder,
      isActive: values.isActive,
      noIndex: values.noIndex,
    };

    setIsSaving(true);
    setErrors({});

    try {
      if (model) {
        const payload: UpdateVehicleModelPayload & VehicleModelMutationSeoPayload = {
          ...basePayload,

          imageUrl: imageUrl || null,
          imageAlt: imageUrl ? imageAlt : null,

          description: description || null,

          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          canonicalUrl: canonicalUrl || null,

          openGraphTitle: openGraphTitle || null,
          openGraphDescription: openGraphDescription || null,
          openGraphImageUrl: openGraphImageUrl || null,
          openGraphImageAlt: openGraphImageUrl ? openGraphImageAlt : null,
        };

        await adminVehiclesApi.updateModel(model.id, payload);
      } else {
        const payload: CreateVehicleModelPayload & VehicleModelMutationSeoPayload = {
          ...basePayload,

          ...(imageUrl
            ? {
                imageUrl,
                imageAlt,
              }
            : {}),

          ...(description
            ? {
                description,
              }
            : {}),

          ...(seoTitle
            ? {
                seoTitle,
              }
            : {}),

          ...(seoDescription
            ? {
                seoDescription,
              }
            : {}),

          ...(canonicalUrl
            ? {
                canonicalUrl,
              }
            : {}),

          ...(openGraphTitle
            ? {
                openGraphTitle,
              }
            : {}),

          ...(openGraphDescription
            ? {
                openGraphDescription,
              }
            : {}),

          ...(openGraphImageUrl
            ? {
                openGraphImageUrl,
                openGraphImageAlt,
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

  const isUploading = isUploadingVehicleModelImage || isUploadingOpenGraphImage;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSaving) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <SheetContent className='w-full sm:max-w-2xl'>
        <SheetHeader>
          <SheetTitle>{isEditing ? 'ویرایش مدل خودرو' : 'افزودن مدل خودرو'}</SheetTitle>

          <SheetDescription>
            اطلاعات مدل خودرو، محتوای صفحه عمومی و تنظیمات SEO را مدیریت کنید
          </SheetDescription>
        </SheetHeader>

        <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
          <SheetBody className='space-y-6'>
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

            <section className='space-y-5'>
              <div>
                <h3 className='text-sm font-extrabold text-foreground'>اطلاعات پایه</h3>
                <p className='mt-1 text-xs leading-5 text-foreground-muted'>
                  نام، برند، آدرس صفحه و وضعیت مدل خودرو
                </p>
              </div>

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
                    placeholder='مثلاً 405'
                  />
                )}
              </FormField>

              <FormField
                label='Slug'
                required
                helperText='این مقدار آدرس صفحه عمومی خودرو را می‌سازد؛ مثال: /vehicles/peugeot-405'
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
                    placeholder='peugeot-405'
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
                helperText='مدل غیرفعال در انتخاب سازگاری و صفحه عمومی خودرو نمایش داده نمی‌شود'
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
            </section>

            <section className='space-y-5 rounded-card border border-border bg-surface-muted/30 p-4'>
              <div>
                <h3 className='text-sm font-extrabold text-foreground'>
                  تصویر و محتوای صفحه خودرو
                </h3>
                <p className='mt-1 text-xs leading-5 text-foreground-muted'>
                  تصویر خودرو در Hero صفحه با گرادیانت به سمت شفاف نمایش داده می‌شود
                </p>
              </div>

              <FormField
                label='تصویر مدل خودرو'
                helperText='ترجیحاً تصویر تمیز و باکیفیت؛ همین تصویر در Hero صفحه خودرو استفاده می‌شود'
                error={errors.imageUrl}
              >
                {({ id }) => (
                  <AdminSingleImageUploadField
                    inputId={id}
                    purpose='vehicles'
                    value={values.imageUrl}
                    onChange={(url) => {
                      setField('imageUrl', url);
                    }}
                    onUploaded={() => {
                      if (!values.imageAlt.trim()) {
                        setField(
                          'imageAlt',
                          vehicleDisplayName ? `تصویر ${vehicleDisplayName}` : 'تصویر مدل خودرو',
                        );
                      }
                    }}
                    alt={
                      values.imageAlt.trim() ||
                      (vehicleDisplayName ? `تصویر ${vehicleDisplayName}` : 'پیش‌نمایش مدل خودرو')
                    }
                    disabled={isSaving}
                    onUploadingChange={setIsUploadingVehicleModelImage}
                    previewClassName='aspect-video w-full'
                    uploadTitle='آپلود تصویر مدل خودرو'
                    inputPlaceholder='https://partsanj.ir/uploads/vehicles/...'
                  />
                )}
              </FormField>

              <FormField
                label='متن جایگزین تصویر خودرو'
                helperText='برای دسترس‌پذیری و SEO؛ مثال: تصویر پژو 405'
                error={errors.imageAlt}
                required={Boolean(values.imageUrl.trim())}
              >
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    required={required}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={255}
                    value={values.imageAlt}
                    onChange={(event) => setField('imageAlt', event.target.value)}
                    onBlur={() => setField('imageAlt', values.imageAlt.trim())}
                    placeholder='مثلاً تصویر پژو 405'
                  />
                )}
              </FormField>

              <FormField
                label='توضیحات صفحه خودرو'
                helperText='معرفی کوتاه و مفید خودرو و قطعات قابل استفاده روی آن؛ این متن در Landing Page خودرو نمایش داده می‌شود'
                error={errors.description}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <textarea
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={20_000}
                    rows={6}
                    value={values.description}
                    onChange={(event) => setField('description', event.target.value)}
                    placeholder='مثلاً پژو 405 یکی از خودروهای پرکاربرد بازار ایران است. در این صفحه می‌توانید قطعات سازگار با تیپ‌ها و موتورهای مختلف این خودرو را مشاهده کنید.'
                    className='min-h-32 w-full resize-y rounded-control border border-border bg-surface px-3 py-2 text-sm leading-7 text-foreground transition outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60'
                  />
                )}
              </FormField>
            </section>

            <section className='space-y-5 rounded-card border border-border p-4'>
              <div>
                <h3 className='text-sm font-extrabold text-foreground'>تنظیمات SEO</h3>
                <p className='mt-1 text-xs leading-5 text-foreground-muted'>
                  اگر عنوان یا توضیحات SEO خالی باشد، صفحه از نام خودرو و اطلاعات پیش‌فرض استفاده
                  می‌کند
                </p>
              </div>

              <FormField
                label='SEO Title'
                helperText='پیشنهاد: لوازم یدکی پژو 405 | خرید قطعات سازگار'
                error={errors.seoTitle}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={120}
                    value={values.seoTitle}
                    onChange={(event) => setField('seoTitle', event.target.value)}
                    onBlur={() => setField('seoTitle', values.seoTitle.trim())}
                    placeholder={
                      vehicleDisplayName ? `لوازم یدکی ${vehicleDisplayName}` : 'لوازم یدکی خودرو'
                    }
                  />
                )}
              </FormField>

              <FormField
                label='SEO Description'
                helperText='خلاصه طبیعی صفحه برای نتایج جستجو؛ بدون تکرار مصنوعی کلمات کلیدی'
                error={errors.seoDescription}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <textarea
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={320}
                    rows={4}
                    value={values.seoDescription}
                    onChange={(event) => setField('seoDescription', event.target.value)}
                    className='min-h-24 w-full resize-y rounded-control border border-border bg-surface px-3 py-2 text-sm leading-7 text-foreground transition outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60'
                    placeholder={
                      vehicleDisplayName
                        ? `مشاهده و خرید قطعات و لوازم یدکی سازگار با ${vehicleDisplayName} بر اساس اطلاعات سازگاری ثبت‌شده در پارت‌سنج.`
                        : 'توضیحات SEO صفحه خودرو'
                    }
                  />
                )}
              </FormField>

              <FormField
                label='Canonical URL'
                helperText='معمولاً خالی بگذارید تا صفحه از آدرس /vehicles/[slug] به‌صورت خودکار استفاده کند'
                error={errors.canonicalUrl}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={2048}
                    value={values.canonicalUrl}
                    onChange={(event) => setField('canonicalUrl', event.target.value)}
                    onBlur={() => setField('canonicalUrl', values.canonicalUrl.trim())}
                    placeholder='https://partsanj.ir/vehicles/peugeot-405'
                  />
                )}
              </FormField>

              <FormField
                label='عدم ایندکس این صفحه'
                helperText='فقط برای مدل‌هایی فعال کنید که نمی‌خواهید صفحه آن‌ها در نتایج موتورهای جستجو نمایش داده شود'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    checked={values.noIndex}
                    onCheckedChange={(checked) => setField('noIndex', checked)}
                  />
                )}
              </FormField>
            </section>

            <section className='space-y-5 rounded-card border border-border p-4'>
              <div>
                <h3 className='text-sm font-extrabold text-foreground'>Open Graph</h3>
                <p className='mt-1 text-xs leading-5 text-foreground-muted'>
                  نحوه نمایش صفحه هنگام اشتراک‌گذاری در شبکه‌های اجتماعی و پیام‌رسان‌ها
                </p>
              </div>

              <FormField
                label='Open Graph Title'
                helperText='اگر خالی باشد از SEO Title یا عنوان پیش‌فرض صفحه استفاده می‌شود'
                error={errors.openGraphTitle}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={160}
                    value={values.openGraphTitle}
                    onChange={(event) => setField('openGraphTitle', event.target.value)}
                    placeholder={
                      vehicleDisplayName
                        ? `قطعات و لوازم یدکی ${vehicleDisplayName}`
                        : 'عنوان Open Graph'
                    }
                  />
                )}
              </FormField>

              <FormField
                label='Open Graph Description'
                helperText='اگر خالی باشد از SEO Description یا توضیحات پیش‌فرض استفاده می‌شود'
                error={errors.openGraphDescription}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <textarea
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={500}
                    rows={4}
                    value={values.openGraphDescription}
                    onChange={(event) => setField('openGraphDescription', event.target.value)}
                    className='min-h-24 w-full resize-y rounded-control border border-border bg-surface px-3 py-2 text-sm leading-7 text-foreground transition outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60'
                    placeholder='توضیح کوتاه برای اشتراک‌گذاری صفحه خودرو'
                  />
                )}
              </FormField>

              <FormField
                label='تصویر Open Graph'
                helperText='اختیاری؛ اگر خالی باشد تصویر اصلی مدل خودرو به‌عنوان fallback استفاده می‌شود'
                error={errors.openGraphImageUrl}
              >
                {({ id }) => (
                  <AdminSingleImageUploadField
                    inputId={id}
                    purpose='vehicles'
                    value={values.openGraphImageUrl}
                    onChange={(url) => {
                      setField('openGraphImageUrl', url);
                    }}
                    onUploaded={() => {
                      if (!values.openGraphImageAlt.trim()) {
                        setField(
                          'openGraphImageAlt',
                          vehicleDisplayName
                            ? `تصویر ${vehicleDisplayName}`
                            : 'تصویر اشتراک‌گذاری مدل خودرو',
                        );
                      }
                    }}
                    alt={
                      values.openGraphImageAlt.trim() ||
                      (vehicleDisplayName ? `تصویر ${vehicleDisplayName}` : 'پیش‌نمایش Open Graph')
                    }
                    disabled={isSaving}
                    onUploadingChange={setIsUploadingOpenGraphImage}
                    previewClassName='aspect-[1.91/1] w-full'
                    uploadTitle='آپلود تصویر Open Graph'
                    inputPlaceholder='https://partsanj.ir/uploads/vehicles/...'
                  />
                )}
              </FormField>

              <FormField
                label='متن جایگزین تصویر Open Graph'
                helperText='توضیح کوتاه و دقیق تصویر اشتراک‌گذاری'
                error={errors.openGraphImageAlt}
                required={Boolean(values.openGraphImageUrl.trim())}
              >
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    required={required}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={255}
                    value={values.openGraphImageAlt}
                    onChange={(event) => setField('openGraphImageAlt', event.target.value)}
                    onBlur={() => setField('openGraphImageAlt', values.openGraphImageAlt.trim())}
                    placeholder={
                      vehicleDisplayName
                        ? `تصویر ${vehicleDisplayName}`
                        : 'متن جایگزین تصویر Open Graph'
                    }
                  />
                )}
              </FormField>
            </section>
          </SheetBody>

          <SheetFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isSaving || isUploading}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button
              type='submit'
              iconStart={<Save />}
              isLoading={isSaving}
              disabled={isSaving || isUploading}
            >
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد مدل خودرو'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
