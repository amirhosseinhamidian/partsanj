'use client';

import type {
  AdminBrand,
  CreateBrandPayload,
  UpdateBrandPayload,
} from '@/lib/admin/catalog/brand.types';
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
import { useEffect, useState } from 'react';

type FormValues = {
  name: string;
  slug: string;
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

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(brand));
    setErrors({});
    setSubmitError(null);
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
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);

    if (!name) {
      nextErrors.name = 'نام برند الزامی است';
    }

    if (!slug) {
      nextErrors.slug = 'Slug الزامی است';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: CreateBrandPayload | UpdateBrandPayload = {
      name: values.name.trim(),
      slug: normalizeSlug(values.slug),
      isActive: values.isActive,
    };

    setSubmitError(null);
    setIsSaving(true);

    try {
      await onSubmit(payload);
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
      <SheetContent side='left' className='w-full max-w-xl'>
        <form className='flex h-full flex-col' onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{isEditing ? 'ویرایش برند' : 'افزودن برند'}</SheetTitle>

            <SheetDescription>
              نام برند، آدرس یکتا و وضعیت فعال بودن آن را مدیریت کنید
            </SheetDescription>
          </SheetHeader>

          <SheetBody className='space-y-5'>
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
                  value={values.slug}
                  onChange={(event) => setField('slug', event.target.value)}
                  onBlur={() => setField('slug', normalizeSlug(values.slug))}
                  placeholder='bosch'
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
                  checked={values.isActive}
                  onCheckedChange={(checked) => setField('isActive', checked)}
                />
              )}
            </FormField>
          </SheetBody>

          <SheetFooter>
            <SheetClose asChild>
              <Button type='button' variant='outline' disabled={isSaving}>
                انصراف
              </Button>
            </SheetClose>

            <Button type='submit' isLoading={isSaving}>
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد برند'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
