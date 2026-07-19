'use client';

import type {
  AdminBrand,
  CreateBrandPayload,
  UpdateBrandPayload,
} from '@/lib/admin/catalog/brand.types';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { isValidRemoteImageUrl, normalizeImageUrl } from '@/lib/utils/image-url';
import { useEffect, useState, type FormEvent } from 'react';
import { AdminSingleImageUploadField } from '@/components/admin/uploads/admin-single-image-upload-field';

type FormValues = {
  name: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type BrandFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: AdminBrand | null;
  onSubmit: (payload: CreateBrandPayload | UpdateBrandPayload) => Promise<void>;
};

function getInitialValues(brand: AdminBrand | null): FormValues {
  return {
    name: brand?.name ?? '',
    slug: brand?.slug ?? '',
    logoUrl: brand?.logoUrl ?? '',
    isActive: brand?.isActive ?? true,
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره برند با خطا مواجه شد';
}

export function BrandFormSheet({ open, onOpenChange, brand, onSubmit }: BrandFormSheetProps) {
  const isEditing = Boolean(brand);

  const [values, setValues] = useState<FormValues>(() => getInitialValues(brand));

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(brand));
    setErrors({});
    setSubmitError(null);
    setIsSaving(false);
    setIsUploadingLogo(false);
  }, [brand, open]);

  function setField<TKey extends keyof FormValues>(key: TKey, value: FormValues[TKey]) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    setSubmitError(null);
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);
    const logoUrl = normalizeImageUrl(values.logoUrl);

    if (!name) {
      nextErrors.name = 'نام برند الزامی است';
    }

    if (!slug) {
      nextErrors.slug = 'Slug الزامی است';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
    }

    if (!isValidRemoteImageUrl(logoUrl)) {
      nextErrors.logoUrl = 'آدرس لوگو باید با http:// یا https:// شروع شود';
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

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);
    const logoUrl = normalizeImageUrl(values.logoUrl);

    const basePayload = {
      name,
      slug,
      isActive: values.isActive,
    };

    setSubmitError(null);
    setIsSaving(true);

    try {
      if (brand) {
        const payload: UpdateBrandPayload = {
          ...basePayload,
          logoUrl: logoUrl || null,
        };

        await onSubmit(payload);
      } else {
        const payload: CreateBrandPayload = {
          ...basePayload,
          ...(logoUrl
            ? {
                logoUrl,
              }
            : {}),
        };

        await onSubmit(payload);
      }

      onOpenChange(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
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
      <SheetContent side='left' className='h-[100dvh] w-full max-w-xl overflow-hidden p-0'>
        <form
          className='grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]'
          onSubmit={handleSubmit}
        >
          <SheetHeader className='shrink-0 border-b border-border px-6 py-6'>
            <SheetTitle>{isEditing ? 'ویرایش برند' : 'افزودن برند'}</SheetTitle>

            <SheetDescription>
              نام برند، آدرس یکتا، لوگو و وضعیت فعال بودن آن را مدیریت کنید
            </SheetDescription>
          </SheetHeader>

          <SheetBody className='min-h-0 overflow-y-auto overscroll-contain px-6 py-5'>
            <div className='space-y-5'>
              {submitError ? (
                <div
                  role='alert'
                  className='rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger'
                >
                  {submitError}
                </div>
              ) : null}

              <FormField label='نام برند' required error={errors.name}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    required={required}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder='مثلاً Bosch'
                  />
                )}
              </FormField>

              <FormField
                label='Slug'
                required
                helperText='فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است'
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
                    value={values.slug}
                    onChange={(event) => setField('slug', event.target.value)}
                    onBlur={() => setField('slug', normalizeSlug(values.slug))}
                    placeholder='bosch'
                  />
                )}
              </FormField>

              <FormField
                label='لوگوی برند'
                helperText='تصویر را آپلود کنید یا URL کامل آن را وارد کنید'
                error={errors.logoUrl}
              >
                {({ id }) => (
                  <AdminSingleImageUploadField
                    inputId={id}
                    purpose='brands'
                    value={values.logoUrl}
                    onChange={(url) => {
                      setField('logoUrl', url);
                    }}
                    alt={values.name ? `لوگوی ${values.name}` : 'پیش‌نمایش لوگوی برند'}
                    disabled={isSaving}
                    onUploadingChange={setIsUploadingLogo}
                    previewClassName='h-36 w-full'
                    inputPlaceholder='https://partsanj.ir/uploads/brands/...'
                    uploadTitle='آپلود لوگوی برند'
                  />
                )}
              </FormField>

              <FormField
                label='وضعیت برند'
                helperText='برند غیرفعال برای محصولات منتشرشده و ترب نباید استفاده شود'
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
            </div>
          </SheetBody>

          <SheetFooter className='z-10 shrink-0 border-t border-border bg-surface px-6 py-4'>
            <SheetClose asChild>
              <Button type='button' variant='outline' disabled={isSaving || isUploadingLogo}>
                انصراف
              </Button>
            </SheetClose>

            <Button type='submit' isLoading={isSaving} disabled={isSaving || isUploadingLogo}>
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد برند'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
