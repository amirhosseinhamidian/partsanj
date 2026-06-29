'use client';

import type {
  AdminCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/lib/admin/catalog/category.types';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import { useEffect, useMemo, useState } from 'react';
import { FormField } from '@/components/ui/form-field';

type FormValues = {
  name: string;
  slug: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type CategoryFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  category: AdminCategory | null;
  categories: AdminCategory[];

  onSubmit: (payload: CreateCategoryPayload | UpdateCategoryPayload) => Promise<void>;
};

function getInitialValues(category: AdminCategory | null): FormValues {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    parentId: category?.parentId ?? '',
    sortOrder: String(category?.sortOrder ?? 0),
    isActive: category?.isActive ?? true,
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

function getDescendantIds(categories: AdminCategory[], categoryId: string): Set<string> {
  const excludedIds = new Set<string>([categoryId]);
  let foundNewChild = true;

  while (foundNewChild) {
    foundNewChild = false;

    for (const category of categories) {
      if (
        category.parentId &&
        excludedIds.has(category.parentId) &&
        !excludedIds.has(category.id)
      ) {
        excludedIds.add(category.id);
        foundNewChild = true;
      }
    }
  }

  return excludedIds;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره دسته‌بندی با خطا مواجه شد';
}

export function CategoryFormSheet({
  open,
  onOpenChange,
  category,
  categories,
  onSubmit,
}: CategoryFormSheetProps) {
  const isEditing = Boolean(category);

  const [values, setValues] = useState<FormValues>(() => getInitialValues(category));

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(category));
    setErrors({});
    setSubmitError(null);
  }, [category, open]);

  const parentOptions = useMemo(() => {
    const excludedIds = category ? getDescendantIds(categories, category.id) : new Set<string>();

    return categories
      .filter((item) => !excludedIds.has(item.id))
      .map((item) => ({
        value: item.id,
        label: item.name,
        description: item.slug,
        disabled: !item.isActive,
      }));
  }, [categories, category]);

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
    const sortOrder = Number(values.sortOrder);

    if (!name) {
      nextErrors.name = 'نام دسته‌بندی الزامی است';
    }

    if (!slug) {
      nextErrors.slug = 'Slug الزامی است';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
    }

    if (!values.sortOrder.trim() || !Number.isInteger(sortOrder) || sortOrder < 0) {
      nextErrors.sortOrder = 'ترتیب نمایش باید یک عدد صحیح صفر یا بزرگ‌تر باشد';
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

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);
    const sortOrder = Number(values.sortOrder);
    const parentId = values.parentId || null;

    const payload: CreateCategoryPayload | UpdateCategoryPayload = isEditing
      ? {
          name,
          slug,
          parentId,
          sortOrder,
          isActive: values.isActive,
        }
      : {
          name,
          slug,
          ...(parentId ? { parentId } : {}),
          sortOrder,
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
            <SheetTitle>{isEditing ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}</SheetTitle>

            <SheetDescription>اطلاعات پایه دسته‌بندی کاتالوگ را وارد کنید</SheetDescription>
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

            <FormField label='نام دسته‌بندی' required error={errors.name}>
              {({ id, labelId, describedBy, invalid, required }) => (
                <Input
                  id={id}
                  required={required}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={values.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder='مثلاً قطعات برقی خودرو'
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
                  placeholder='electrical-parts'
                />
              )}
            </FormField>

            <FormField
              label='دسته والد'
              helperText='خالی گذاشتن این فیلد، دسته را در سطح اصلی قرار می‌دهد'
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Combobox
                  id={id}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={values.parentId}
                  onValueChange={(value) => setField('parentId', value)}
                  options={parentOptions}
                  clearable
                  placeholder='دسته اصلی'
                  searchPlaceholder='جستجو در دسته‌بندی‌ها'
                  emptyMessage='دسته‌بندی قابل انتخابی وجود ندارد'
                />
              )}
            </FormField>

            <FormField
              label='ترتیب نمایش'
              required
              helperText='عدد کوچک‌تر زودتر نمایش داده می‌شود'
              error={errors.sortOrder}
            >
              {({ id, labelId, describedBy, invalid, required }) => (
                <Input
                  id={id}
                  required={required}
                  dir='ltr'
                  inputMode='numeric'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={values.sortOrder}
                  onChange={(event) =>
                    setField('sortOrder', event.target.value.replace(/[^\d۰-۹٠-٩]/g, ''))
                  }
                  placeholder='0'
                />
              )}
            </FormField>

            <FormField
              label='وضعیت دسته‌بندی'
              helperText='دسته غیرفعال در بخش‌های عملیاتی قابل انتخاب نیست'
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
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
