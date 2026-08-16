'use client';

import type {
  AdminCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/lib/admin/catalog/category.types';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { AdminSingleImageUploadField } from '../../uploads/admin-single-image-upload-field';
import Image from 'next/image';

type FormValues = {
  name: string;
  slug: string;

  description: string;

  imageUrl: string;
  imageAlt: string;

  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noIndex: boolean;

  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  openGraphImageAlt: string;

  parentId: string;
  sortOrder: string;

  isActive: boolean;
  showOnHome: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type CategoryFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  category: AdminCategory | null;
  categories: AdminCategory[];

  onSubmit: (payload: CreateCategoryPayload | UpdateCategoryPayload) => Promise<void>;
  onSaveComplements: (categoryId: string, categoryIds: string[]) => Promise<void>;
};

function getInitialValues(category: AdminCategory | null): FormValues {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',

    description: category?.description ?? '',

    imageUrl: category?.imageUrl ?? '',
    imageAlt: category?.imageAlt ?? '',

    seoTitle: category?.seoTitle ?? '',
    seoDescription: category?.seoDescription ?? '',
    canonicalUrl: category?.canonicalUrl ?? '',
    noIndex: category?.noIndex ?? false,

    openGraphTitle: category?.openGraphTitle ?? '',
    openGraphDescription: category?.openGraphDescription ?? '',
    openGraphImageUrl: category?.openGraphImageUrl ?? '',
    openGraphImageAlt: category?.openGraphImageAlt ?? '',

    parentId: category?.parentId ?? '',

    sortOrder: String(category?.sortOrder ?? 0),

    isActive: category?.isActive ?? true,
    showOnHome: category?.showOnHome ?? false,
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

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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
  onSaveComplements,
}: CategoryFormSheetProps) {
  const isEditing = Boolean(category);

  const [values, setValues] = useState<FormValues>(() => getInitialValues(category));

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);
  const [complementaryCategoryIds, setComplementaryCategoryIds] = useState<string[]>(
    () => category?.complementaryCategories.map((item) => item.id) ?? [],
  );

  const [complementsError, setComplementsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(getInitialValues(category));
    setErrors({});
    setSubmitError(null);
    setIsUploadingCategoryImage(false);
    setIsUploadingOgImage(false);
    setComplementaryCategoryIds(category?.complementaryCategories.map((item) => item.id) ?? []);

    setComplementsError(null);
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

  const complementaryOptions = useMemo(
    () =>
      categories
        .filter((item) => item.id !== category?.id)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'fa-IR')),
    [categories, category],
  );

  function toggleComplementaryCategory(categoryId: string) {
    setComplementsError(null);

    setComplementaryCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      if (current.length >= 12) {
        setComplementsError('حداکثر ۱۲ دسته مکمل قابل انتخاب است');

        return current;
      }

      return [...current, categoryId];
    });
  }

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
    const imageUrl = values.imageUrl.trim();
    const imageAlt = values.imageAlt.trim();
    const description = values.description.trim();
    const seoTitle = values.seoTitle.trim();
    const seoDescription = values.seoDescription.trim();
    const canonicalUrl = values.canonicalUrl.trim();
    const openGraphTitle = values.openGraphTitle.trim();
    const openGraphDescription = values.openGraphDescription.trim();
    const openGraphImageUrl = values.openGraphImageUrl.trim();
    const openGraphImageAlt = values.openGraphImageAlt.trim();

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

    if (imageUrl && !isValidHttpUrl(imageUrl)) {
      nextErrors.imageUrl = 'آدرس تصویر باید یک URL معتبر با http یا https باشد';
    }

    if (imageUrl && !imageAlt) {
      nextErrors.imageAlt = 'متن جایگزین تصویر برای تصویر شاخص الزامی است';
    }

    if (!imageUrl && imageAlt) {
      nextErrors.imageAlt = 'برای ثبت متن جایگزین، ابتدا آدرس تصویر را وارد کنید';
    }

    if (description.length > 20000) {
      nextErrors.description = 'توضیحات دسته‌بندی حداکثر ۲۰۰۰۰ کاراکتر باشد';
    }

    if (seoTitle.length > 120) {
      nextErrors.seoTitle = 'عنوان سئو حداکثر ۱۲۰ کاراکتر باشد';
    }

    if (seoDescription.length > 320) {
      nextErrors.seoDescription = 'توضیحات سئو حداکثر ۳۲۰ کاراکتر باشد';
    }

    if (canonicalUrl && !isValidHttpUrl(canonicalUrl)) {
      nextErrors.canonicalUrl = 'آدرس Canonical باید یک URL معتبر با http یا https باشد';
    }

    if (openGraphTitle.length > 160) {
      nextErrors.openGraphTitle = 'عنوان Open Graph حداکثر ۱۶۰ کاراکتر باشد';
    }

    if (openGraphDescription.length > 500) {
      nextErrors.openGraphDescription = 'توضیحات Open Graph حداکثر ۵۰۰ کاراکتر باشد';
    }

    if (openGraphImageUrl && !isValidHttpUrl(openGraphImageUrl)) {
      nextErrors.openGraphImageUrl = 'آدرس تصویر Open Graph باید URL معتبر باشد';
    }

    if (openGraphImageAlt.length > 255) {
      nextErrors.openGraphImageAlt = 'Alt تصویر Open Graph حداکثر ۲۵۵ کاراکتر باشد';
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
    const imageUrl = values.imageUrl.trim();
    const imageAlt = values.imageAlt.trim();
    const sortOrder = Number(values.sortOrder);
    const parentId = values.parentId || null;
    const description = values.description.trim();
    const seoTitle = values.seoTitle.trim();
    const seoDescription = values.seoDescription.trim();
    const canonicalUrl = values.canonicalUrl.trim();
    const openGraphTitle = values.openGraphTitle.trim();
    const openGraphDescription = values.openGraphDescription.trim();
    const openGraphImageUrl = values.openGraphImageUrl.trim();
    const openGraphImageAlt = values.openGraphImageAlt.trim();

    const payload: CreateCategoryPayload | UpdateCategoryPayload = isEditing
      ? {
          name,
          slug,
          description: description || null,
          imageUrl: imageUrl || null,
          imageAlt: imageUrl ? imageAlt : null,

          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          canonicalUrl: canonicalUrl || null,
          noIndex: values.noIndex,

          openGraphTitle: openGraphTitle || null,
          openGraphDescription: openGraphDescription || null,
          openGraphImageUrl: openGraphImageUrl || null,
          openGraphImageAlt: openGraphImageAlt || null,

          parentId,
          sortOrder,
          isActive: values.isActive,
          showOnHome: values.showOnHome,
        }
      : {
          name,
          slug,

          description: description || null,

          ...(imageUrl ? { imageUrl } : {}),
          ...(imageUrl && imageAlt ? { imageAlt } : {}),

          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          canonicalUrl: canonicalUrl || null,
          noIndex: values.noIndex,

          openGraphTitle: openGraphTitle || null,
          openGraphDescription: openGraphDescription || null,
          openGraphImageUrl: openGraphImageUrl || null,
          openGraphImageAlt: openGraphImageAlt || null,

          ...(parentId ? { parentId } : {}),

          sortOrder,
          isActive: values.isActive,
          showOnHome: values.showOnHome,
        };

    setSubmitError(null);
    setIsSaving(true);

    try {
      await onSubmit(payload);

      if (isEditing && category) {
        await onSaveComplements(category.id, complementaryCategoryIds);
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
      <SheetContent side='left' className='w-full max-w-2xl'>
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
              label='توضیحات دسته‌بندی'
              helperText={`محتوای اصلی صفحه دسته‌بندی. ${values.description.length.toLocaleString('fa-IR')} / ۲۰۰۰۰`}
              error={errors.description}
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  rows={6}
                  maxLength={20000}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving}
                  value={values.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder='معرفی دسته‌بندی، کاربرد قطعات، نکات انتخاب و اطلاعات مفید برای کاربران...'
                />
              )}
            </FormField>

            <div className='bg-muted/30 rounded-card border border-border p-4'>
              <div className='grid gap-4'>
                <FormField
                  label='تصویر شاخص دسته‌بندی'
                  helperText='این تصویر در صفحه اصلی و صفحات دسته‌بندی نمایش داده می‌شود'
                  error={errors.imageUrl}
                >
                  {({ id }) => (
                    <AdminSingleImageUploadField
                      inputId={id}
                      purpose='categories'
                      value={values.imageUrl}
                      onChange={(url) => {
                        setField('imageUrl', url);
                      }}
                      onUploaded={() => {
                        if (!values.imageAlt.trim()) {
                          setField(
                            'imageAlt',
                            values.name.trim()
                              ? `تصویر دسته‌بندی ${values.name.trim()}`
                              : 'تصویر دسته‌بندی',
                          );
                        }
                      }}
                      alt={
                        values.imageAlt.trim() || values.name.trim() || 'پیش‌نمایش تصویر دسته‌بندی'
                      }
                      disabled={isSaving}
                      onUploadingChange={setIsUploadingCategoryImage}
                      previewClassName='aspect-video w-full'
                      inputPlaceholder='https://partsanj.ir/uploads/categories/...'
                      uploadTitle='آپلود تصویر دسته‌بندی'
                    />
                  )}
                </FormField>

                <FormField
                  label='متن جایگزین تصویر'
                  helperText='برای دسترس‌پذیری و SEO؛ مثال: سوکت خودرو'
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
                      value={values.imageAlt}
                      onChange={(event) => setField('imageAlt', event.target.value)}
                      onBlur={() => setField('imageAlt', values.imageAlt.trim())}
                      placeholder='مثلاً سوکت خودرو'
                    />
                  )}
                </FormField>

                {values.imageUrl.trim() && isValidHttpUrl(values.imageUrl.trim()) ? (
                  <div className='rounded-control border border-border bg-surface p-3'>
                    <p className='mb-2 text-xs font-bold text-foreground-secondary'>
                      پیش‌نمایش تصویر
                    </p>

                    <div className='bg-muted relative h-36 overflow-hidden rounded-control'>
                      <Image
                        src={values.imageUrl.trim()}
                        alt={values.imageAlt.trim() || 'پیش‌نمایش تصویر دسته‌بندی'}
                        fill
                        unoptimized
                        sizes='100%'
                        className='object-contain p-3'
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

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

            <FormField
              label='نمایش در صفحه اصلی'
              helperText='اگر فعال باشد، این دسته‌بندی در سکشن دسته‌بندی‌های اصلی صفحه خانه نمایش داده می‌شود'
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Switch
                  id={id}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  checked={values.showOnHome}
                  onCheckedChange={(checked) => setField('showOnHome', checked)}
                />
              )}
            </FormField>

            {isEditing ? (
              <div className='rounded-card border border-border bg-surface p-4'>
                <div>
                  <h3 className='text-sm font-extrabold text-foreground'>دسته‌های مکمل</h3>

                  <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                    دسته‌هایی را انتخاب کنید که محصولاتشان می‌توانند در کنار محصولات این دسته
                    پیشنهاد شوند.
                  </p>
                </div>

                {complementaryOptions.length > 0 ? (
                  <div className='mt-4 max-h-72 space-y-2 overflow-y-auto rounded-control border border-border bg-surface-muted p-2'>
                    {complementaryOptions.map((option) => {
                      const checked = complementaryCategoryIds.includes(option.id);

                      return (
                        <label
                          key={option.id}
                          className='flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 transition-colors hover:bg-surface'
                        >
                          <input
                            type='checkbox'
                            checked={checked}
                            disabled={isSaving || (!option.isActive && !checked)}
                            onChange={() => toggleComplementaryCategory(option.id)}
                            className='size-4 shrink-0'
                          />

                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-bold text-foreground'>
                              {option.name}
                            </p>

                            <p
                              dir='ltr'
                              className='mt-0.5 truncate text-left text-xs text-foreground-muted'
                            >
                              {option.slug}
                            </p>
                          </div>

                          {!option.isActive ? (
                            <span className='shrink-0 text-xs font-semibold text-foreground-muted'>
                              غیرفعال
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className='mt-4 text-sm text-foreground-muted'>
                    دسته دیگری برای انتخاب وجود ندارد.
                  </p>
                )}

                <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-xs text-foreground-muted'>
                    {complementaryCategoryIds.length} دسته انتخاب شده
                  </span>

                  {complementaryCategoryIds.length > 0 ? (
                    <button
                      type='button'
                      disabled={isSaving}
                      onClick={() => setComplementaryCategoryIds([])}
                      className='text-xs font-bold text-danger'
                    >
                      پاک کردن همه
                    </button>
                  ) : null}
                </div>

                {complementsError ? (
                  <p role='alert' className='mt-2 text-xs font-medium text-danger'>
                    {complementsError}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className='rounded-card border border-border bg-surface-muted/40 p-4'>
              <div className='mb-5'>
                <h3 className='text-base font-extrabold text-foreground'>سئو</h3>

                <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                  اطلاعات نمایش دسته‌بندی در موتورهای جستجو را مدیریت کنید
                </p>
              </div>

              <div className='space-y-5'>
                <FormField
                  label='عنوان سئو'
                  helperText={`${values.seoTitle.length.toLocaleString('fa-IR')} / ۱۲۰ کاراکتر`}
                  error={errors.seoTitle}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Input
                      id={id}
                      maxLength={120}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.seoTitle}
                      onChange={(event) => setField('seoTitle', event.target.value)}
                      placeholder='مثلاً خرید قطعات برقی خودرو'
                    />
                  )}
                </FormField>

                <FormField
                  label='توضیحات سئو'
                  helperText={`${values.seoDescription.length.toLocaleString('fa-IR')} / ۳۲۰ کاراکتر`}
                  error={errors.seoDescription}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Textarea
                      id={id}
                      rows={3}
                      maxLength={320}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.seoDescription}
                      onChange={(event) => setField('seoDescription', event.target.value)}
                      placeholder='توضیح کوتاه و جذاب برای نمایش در نتایج گوگل'
                    />
                  )}
                </FormField>

                <FormField
                  label='Canonical URL'
                  helperText='در حالت عادی خالی بگذارید؛ آدرس خود دسته‌بندی canonical خواهد بود'
                  error={errors.canonicalUrl}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Input
                      id={id}
                      dir='ltr'
                      maxLength={2048}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.canonicalUrl}
                      onChange={(event) => setField('canonicalUrl', event.target.value)}
                      placeholder='https://partsanj.ir/categories/electrical-parts'
                    />
                  )}
                </FormField>

                <FormField
                  label='عدم ایندکس توسط موتورهای جستجو'
                  helperText='فقط برای دسته‌هایی فعال کنید که نمی‌خواهید در نتایج گوگل نمایش داده شوند'
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
              </div>
            </div>
            <div className='rounded-card border border-border bg-surface-muted/40 p-4'>
              <div className='mb-5'>
                <h3 className='text-base font-extrabold text-foreground'>Open Graph</h3>

                <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                  پیش‌نمایش لینک دسته‌بندی در شبکه‌های اجتماعی و پیام‌رسان‌ها
                </p>
              </div>

              <div className='space-y-5'>
                <FormField
                  label='عنوان Open Graph'
                  helperText={`${values.openGraphTitle.length.toLocaleString('fa-IR')} / ۱۶۰ کاراکتر`}
                  error={errors.openGraphTitle}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Input
                      id={id}
                      maxLength={160}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.openGraphTitle}
                      onChange={(event) => setField('openGraphTitle', event.target.value)}
                      placeholder='عنوان مناسب برای اشتراک‌گذاری دسته‌بندی'
                    />
                  )}
                </FormField>

                <FormField
                  label='توضیحات Open Graph'
                  helperText={`${values.openGraphDescription.length.toLocaleString('fa-IR')} / ۵۰۰ کاراکتر`}
                  error={errors.openGraphDescription}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Textarea
                      id={id}
                      rows={3}
                      maxLength={500}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.openGraphDescription}
                      onChange={(event) => setField('openGraphDescription', event.target.value)}
                      placeholder='توضیح مناسب برای پیش‌نمایش لینک دسته‌بندی'
                    />
                  )}
                </FormField>

                <FormField
                  label='تصویر Open Graph'
                  helperText='نسبت پیشنهادی تصویر 1.91:1 است'
                  error={errors.openGraphImageUrl}
                >
                  {({ id }) => (
                    <AdminSingleImageUploadField
                      inputId={id}
                      purpose='categories'
                      value={values.openGraphImageUrl}
                      onChange={(url) => {
                        setField('openGraphImageUrl', url);
                      }}
                      onUploaded={() => {
                        if (!values.openGraphImageAlt.trim()) {
                          setField(
                            'openGraphImageAlt',
                            values.name.trim()
                              ? `تصویر دسته‌بندی ${values.name.trim()}`
                              : 'تصویر دسته‌بندی',
                          );
                        }
                      }}
                      alt={
                        values.openGraphImageAlt.trim() ||
                        values.name.trim() ||
                        'تصویر Open Graph دسته‌بندی'
                      }
                      disabled={isSaving}
                      onUploadingChange={setIsUploadingOgImage}
                      previewClassName='aspect-[1.91/1] w-full'
                      inputPlaceholder='https://partsanj.ir/uploads/categories/...'
                      uploadTitle='آپلود تصویر Open Graph'
                    />
                  )}
                </FormField>

                <FormField
                  label='Alt تصویر Open Graph'
                  helperText={`${values.openGraphImageAlt.length.toLocaleString('fa-IR')} / ۲۵۵ کاراکتر`}
                  error={errors.openGraphImageAlt}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Input
                      id={id}
                      maxLength={255}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.openGraphImageAlt}
                      onChange={(event) => setField('openGraphImageAlt', event.target.value)}
                      placeholder='مثلاً تصویر قطعات برقی خودرو'
                    />
                  )}
                </FormField>
              </div>
            </div>
          </SheetBody>

          <SheetFooter>
            <SheetClose asChild>
              <Button
                type='button'
                variant='outline'
                disabled={isSaving || isUploadingCategoryImage || isUploadingOgImage}
              >
                انصراف
              </Button>
            </SheetClose>

            <Button
              type='submit'
              isLoading={isSaving || isUploadingCategoryImage || isUploadingOgImage}
            >
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
