'use client';

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
import { Textarea } from '@/components/ui/textarea';
import {
  AdminBlogCategoryApiError,
  createAdminBlogCategory,
  updateAdminBlogCategory,
} from '@/lib/admin/blog/categories/admin-blog-category.client';
import type {
  AdminBlogCategoryListItem,
  CreateAdminBlogCategoryInput,
} from '@/lib/admin/blog/categories/admin-blog-category.types';
import { cn } from '@/lib/utils/cn';
import { toLatinDigits } from '@/lib/utils/digits';
import {
  ChevronDown,
  CircleAlert,
  Globe2,
  ImageIcon,
  Save,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

type BlogCategoryFormMode = 'create' | 'edit';

type BlogCategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: string;

  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noIndex: boolean;

  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  openGraphImageAlt: string;
};

type BlogCategoryFormErrors = Partial<
  Record<
    | 'name'
    | 'slug'
    | 'description'
    | 'sortOrder'
    | 'seoTitle'
    | 'seoDescription'
    | 'canonicalUrl'
    | 'openGraphTitle'
    | 'openGraphDescription'
    | 'openGraphImageUrl'
    | 'openGraphImageAlt'
    | 'state',
    string
  >
>;

type AdminBlogCategoryFormSheetProps = {
  open: boolean;
  category: AdminBlogCategoryListItem | null;

  onClose: () => void;

  onSaved: (category: AdminBlogCategoryListItem, mode: BlogCategoryFormMode) => void;
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function toNullableText(value: string): string | null {
  const normalized = value.trim();

  return normalized || null;
}

function parseSortOrder(value: string): number | null {
  const normalized = toLatinDigits(value).trim();

  if (!normalized) {
    return 0;
  }

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 1_000_000) {
    return null;
  }

  return parsed;
}

function isValidHttpUrl(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) {
    return true;
  }

  try {
    const url = new URL(normalized);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function createInitialValues(category: AdminBlogCategoryListItem | null): BlogCategoryFormValues {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    isActive: category?.isActive ?? true,
    sortOrder: String(category?.sortOrder ?? 0),

    seoTitle: category?.seoTitle ?? '',
    seoDescription: category?.seoDescription ?? '',
    canonicalUrl: category?.canonicalUrl ?? '',
    noIndex: category?.noIndex ?? false,

    openGraphTitle: category?.openGraphTitle ?? '',
    openGraphDescription: category?.openGraphDescription ?? '',
    openGraphImageUrl: category?.openGraphImageUrl ?? '',
    openGraphImageAlt: category?.openGraphImageAlt ?? '',
  };
}

function createPayload(values: BlogCategoryFormValues): CreateAdminBlogCategoryInput {
  return {
    name: values.name.trim(),
    slug: normalizeSlug(values.slug),

    description: toNullableText(values.description),
    isActive: values.isActive,
    sortOrder: parseSortOrder(values.sortOrder) ?? 0,

    seoTitle: toNullableText(values.seoTitle),
    seoDescription: toNullableText(values.seoDescription),
    canonicalUrl: toNullableText(values.canonicalUrl),
    noIndex: values.noIndex,

    openGraphTitle: toNullableText(values.openGraphTitle),
    openGraphDescription: toNullableText(values.openGraphDescription),
    openGraphImageUrl: toNullableText(values.openGraphImageUrl),
    openGraphImageAlt: toNullableText(values.openGraphImageAlt),
  };
}

function validateValues(values: BlogCategoryFormValues): BlogCategoryFormErrors {
  const errors: BlogCategoryFormErrors = {};

  const name = values.name.trim();
  const slug = normalizeSlug(values.slug);
  const sortOrder = parseSortOrder(values.sortOrder);

  if (name.length < 2) {
    errors.name = 'نام دسته‌بندی باید حداقل ۲ کاراکتر باشد';
  } else if (name.length > 100) {
    errors.name = 'نام دسته‌بندی نباید بیشتر از ۱۰۰ کاراکتر باشد';
  }

  if (!slug) {
    errors.slug = 'Slug دسته‌بندی الزامی است';
  } else if (!isValidSlug(slug)) {
    errors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
  } else if (slug.length > 180) {
    errors.slug = 'Slug نباید بیشتر از ۱۸۰ کاراکتر باشد';
  }

  if (values.description.length > 700) {
    errors.description = 'توضیح کوتاه نباید بیشتر از ۷۰۰ کاراکتر باشد';
  }

  if (sortOrder === null) {
    errors.sortOrder = 'اولویت نمایش باید عددی بین ۰ تا ۱۰۰۰۰۰۰ باشد';
  }

  if (values.seoTitle.length > 120) {
    errors.seoTitle = 'عنوان SEO نباید بیشتر از ۱۲۰ کاراکتر باشد';
  }

  if (values.seoDescription.length > 320) {
    errors.seoDescription = 'توضیحات SEO نباید بیشتر از ۳۲۰ کاراکتر باشد';
  }

  if (!isValidHttpUrl(values.canonicalUrl)) {
    errors.canonicalUrl = 'Canonical URL باید با http یا https شروع شود';
  } else if (values.canonicalUrl.length > 2048) {
    errors.canonicalUrl = 'Canonical URL بیش از حد طولانی است';
  }

  if (values.openGraphTitle.length > 160) {
    errors.openGraphTitle = 'عنوان Open Graph نباید بیشتر از ۱۶۰ کاراکتر باشد';
  }

  if (values.openGraphDescription.length > 500) {
    errors.openGraphDescription = 'توضیحات Open Graph نباید بیشتر از ۵۰۰ کاراکتر باشد';
  }

  if (!isValidHttpUrl(values.openGraphImageUrl)) {
    errors.openGraphImageUrl = 'آدرس تصویر Open Graph باید با http یا https شروع شود';
  } else if (values.openGraphImageUrl.length > 2048) {
    errors.openGraphImageUrl = 'آدرس تصویر Open Graph بیش از حد طولانی است';
  }

  if (values.openGraphImageUrl.trim() && !values.openGraphImageAlt.trim()) {
    errors.openGraphImageAlt = 'برای تصویر Open Graph متن جایگزین وارد کنید';
  } else if (values.openGraphImageAlt.length > 255) {
    errors.openGraphImageAlt = 'متن جایگزین تصویر نباید بیشتر از ۲۵۵ کاراکتر باشد';
  }

  return errors;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminBlogCategoryApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره دسته‌بندی بلاگ با خطا مواجه شد';
}

function EditorSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
      <div className='flex items-start gap-3 border-b border-border pb-4'>
        <span className='grid size-9 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
          <Icon className='size-4' />
        </span>

        <div>
          <h5 className='type-section-title text-foreground'>{title}</h5>

          <p className='mt-1 text-sm text-foreground-muted'>{description}</p>
        </div>
      </div>

      <div className='pt-5'>{children}</div>
    </section>
  );
}

function CollapsibleEditorSection({
  id,
  title,
  description,
  icon: Icon,
  open,
  onOpenChange,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
      <button
        type='button'
        aria-expanded={open}
        aria-controls={`${id}-content`}
        onClick={() => {
          onOpenChange(!open);
        }}
        className='flex w-full items-start gap-3 p-4 text-right sm:p-5'
      >
        <span className='grid size-9 shrink-0 place-items-center rounded-control bg-surface-muted text-foreground-secondary'>
          <Icon className='size-4' />
        </span>

        <span className='min-w-0 flex-1'>
          <span className='type-section-title block text-foreground'>{title}</span>

          <span className='mt-1 block text-sm leading-6 text-foreground-muted'>{description}</span>
        </span>

        <ChevronDown
          aria-hidden='true'
          className={cn(
            'mt-1 size-5 shrink-0 text-foreground-muted transition-transform duration-300 motion-reduce:transition-none',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        id={`${id}-content`}
        aria-hidden={!open}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className='min-h-0 overflow-hidden'>
          <div className='border-t border-border p-4 sm:p-5'>{children}</div>
        </div>
      </div>
    </section>
  );
}

export function AdminBlogCategoryFormSheet({
  open,
  category,
  onClose,
  onSaved,
}: AdminBlogCategoryFormSheetProps) {
  const mode: BlogCategoryFormMode = category ? 'edit' : 'create';

  const initialValues = useMemo(() => createInitialValues(category), [category]);

  const [values, setValues] = useState<BlogCategoryFormValues>(initialValues);

  const [errors, setErrors] = useState<BlogCategoryFormErrors>({});

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [seoOpen, setSeoOpen] = useState(false);

  const [openGraphOpen, setOpenGraphOpen] = useState(false);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(category));

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(createInitialValues(category));
    setErrors({});
    setSubmitError(null);
    setSeoOpen(false);
    setOpenGraphOpen(false);
    setSlugManuallyEdited(Boolean(category));
  }, [category, open]);

  const hasChanges = useMemo(() => {
    if (mode === 'create') {
      return Boolean(values.name.trim() || values.slug.trim() || values.description.trim());
    }

    return JSON.stringify(createPayload(values)) !== JSON.stringify(createPayload(initialValues));
  }, [initialValues, mode, values]);

  function setField<TKey extends keyof BlogCategoryFormValues>(
    key: TKey,
    value: BlogCategoryFormValues[TKey],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
      state: undefined,
    }));

    setSubmitError(null);
  }

  function handleNameChange(value: string) {
    setValues((current) => {
      const next = {
        ...current,
        name: value,
      };

      if (mode === 'create' && !slugManuallyEdited) {
        const suggestedSlug = normalizeSlug(value);

        if (isValidSlug(suggestedSlug)) {
          next.slug = suggestedSlug;
        }
      }

      return next;
    });

    setErrors((current) => ({
      ...current,
      name: undefined,
      slug: undefined,
      state: undefined,
    }));

    setSubmitError(null);
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSaving) {
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateValues(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      if (nextErrors.seoTitle || nextErrors.seoDescription || nextErrors.canonicalUrl) {
        setSeoOpen(true);
      }

      if (
        nextErrors.openGraphTitle ||
        nextErrors.openGraphDescription ||
        nextErrors.openGraphImageUrl ||
        nextErrors.openGraphImageAlt
      ) {
        setOpenGraphOpen(true);
      }

      return;
    }

    if (mode === 'edit' && !hasChanges) {
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSaving(true);

    try {
      const payload = createPayload(values);

      const result = category
        ? await updateAdminBlogCategory(category.id, payload)
        : await createAdminBlogCategory(payload);

      onSaved(result.data, mode);
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side='right'
        className='max-w-3xl'
        showCloseButton={!isSaving}
        onEscapeKeyDown={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
      >
        <form
          id='admin-blog-category-form'
          onSubmit={handleSubmit}
          className='flex h-full min-h-0 flex-col'
        >
          <SheetHeader className='border-b border-border pb-5'>
            <SheetTitle>
              {mode === 'create' ? 'دسته‌بندی جدید بلاگ' : `ویرایش دسته‌بندی «${category?.name}»`}
            </SheetTitle>

            <SheetDescription>
              اطلاعات نمایش، SEO و اشتراک‌گذاری صفحه دسته‌بندی را مدیریت کنید
            </SheetDescription>
          </SheetHeader>

          <SheetBody>
            <div className='space-y-5'>
              {submitError ? (
                <div
                  role='alert'
                  className='flex items-start gap-3 rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-danger'
                >
                  <CircleAlert className='mt-0.5 size-5 shrink-0' />

                  <p className='text-sm leading-6 font-medium'>{submitError}</p>
                </div>
              ) : null}

              <EditorSection
                title='اطلاعات اصلی'
                description='این اطلاعات در ساختار بلاگ، URL صفحه و فهرست دسته‌بندی‌ها استفاده می‌شوند'
                icon={Settings2}
              >
                <div className='grid gap-5 md:grid-cols-2'>
                  <FormField
                    label='نام دسته‌بندی'
                    required
                    error={errors.name}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid, required }) => (
                      <Input
                        id={id}
                        required={required}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving}
                        maxLength={100}
                        value={values.name}
                        onChange={(event) => {
                          handleNameChange(event.target.value);
                        }}
                        placeholder='مثلاً برق و الکترونیک خودرو'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='Slug'
                    required
                    helperText='فقط حروف انگلیسی کوچک، عدد و خط تیره'
                    error={errors.slug}
                    className='md:col-span-2'
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
                        maxLength={180}
                        value={values.slug}
                        onChange={(event) => {
                          setSlugManuallyEdited(true);
                          setField('slug', event.target.value);
                        }}
                        onBlur={() => {
                          setField('slug', normalizeSlug(values.slug));
                        }}
                        placeholder='car-electrical-system'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='توضیح کوتاه'
                    error={errors.description}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Textarea
                        id={id}
                        rows={4}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving}
                        maxLength={700}
                        helperText='توضیحی کوتاه برای معرفی دسته‌بندی در صفحه عمومی بلاگ'
                        value={values.description}
                        onChange={(event) => {
                          setField('description', event.target.value);
                        }}
                        placeholder='مثلاً راهنماها و مقالات مربوط به سیستم برق و قطعات الکترونیکی خودرو'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='اولویت نمایش'
                    helperText='عدد کمتر، نمایش زودتر در فهرست دسته‌بندی‌ها'
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
                        onChange={(event) => {
                          setField(
                            'sortOrder',
                            toLatinDigits(event.target.value).replace(/\D/g, ''),
                          );
                        }}
                        placeholder='0'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='وضعیت دسته‌بندی'
                    helperText='دسته‌بندی غیرفعال در بخش عمومی بلاگ نمایش داده نمی‌شود'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Switch
                        id={id}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving}
                        checked={values.isActive}
                        onCheckedChange={(checked) => {
                          setField('isActive', checked);
                        }}
                      />
                    )}
                  </FormField>
                </div>
              </EditorSection>

              <CollapsibleEditorSection
                id='blog-category-seo'
                title='تنظیمات SEO'
                description='در صورت خالی بودن فیلدها، سیستم از نام و توضیح دسته‌بندی برای Metadata استفاده می‌کند'
                icon={Globe2}
                open={seoOpen}
                onOpenChange={setSeoOpen}
              >
                <div className='grid gap-5 md:grid-cols-2'>
                  <FormField
                    label='عنوان SEO'
                    helperText='عنوانی که در نتایج جست‌وجو نمایش داده می‌شود'
                    error={errors.seoTitle}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !seoOpen}
                        maxLength={120}
                        value={values.seoTitle}
                        onChange={(event) => {
                          setField('seoTitle', event.target.value);
                        }}
                        placeholder='عنوان SEO صفحه دسته‌بندی'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='توضیحات SEO'
                    error={errors.seoDescription}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Textarea
                        id={id}
                        rows={4}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !seoOpen}
                        maxLength={320}
                        helperText='خلاصه‌ای برای نمایش در نتایج موتورهای جست‌وجو'
                        value={values.seoDescription}
                        onChange={(event) => {
                          setField('seoDescription', event.target.value);
                        }}
                        placeholder='توضیح کوتاه و دقیق برای نتایج جست‌وجو'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='Canonical URL'
                    helperText='اختیاری؛ در حالت عادی URL استاندارد صفحه به‌صورت خودکار تولید می‌شود'
                    error={errors.canonicalUrl}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        type='url'
                        dir='ltr'
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !seoOpen}
                        maxLength={2048}
                        value={values.canonicalUrl}
                        onChange={(event) => {
                          setField('canonicalUrl', event.target.value);
                        }}
                        placeholder='https://partsanj.ir/blog/category/car-electrical-system'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='عدم ایندکس'
                    helperText='فقط برای صفحات موقت، آزمایشی یا صفحاتی که نباید وارد نتایج گوگل شوند فعال کنید'
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Switch
                        id={id}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !seoOpen}
                        checked={values.noIndex}
                        onCheckedChange={(checked) => {
                          setField('noIndex', checked);
                        }}
                      />
                    )}
                  </FormField>
                </div>
              </CollapsibleEditorSection>

              <CollapsibleEditorSection
                id='blog-category-open-graph'
                title='Open Graph و اشتراک‌گذاری'
                description='این اطلاعات برای نمایش بهتر لینک صفحه در واتساپ، تلگرام و شبکه‌های اجتماعی استفاده می‌شوند'
                icon={ImageIcon}
                open={openGraphOpen}
                onOpenChange={setOpenGraphOpen}
              >
                <div className='grid gap-5 md:grid-cols-2'>
                  <FormField
                    label='عنوان Open Graph'
                    helperText='در صورت خالی بودن، عنوان SEO یا نام دسته‌بندی استفاده می‌شود'
                    error={errors.openGraphTitle}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !openGraphOpen}
                        maxLength={160}
                        value={values.openGraphTitle}
                        onChange={(event) => {
                          setField('openGraphTitle', event.target.value);
                        }}
                        placeholder='عنوان مخصوص اشتراک‌گذاری'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='توضیحات Open Graph'
                    error={errors.openGraphDescription}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Textarea
                        id={id}
                        rows={4}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !openGraphOpen}
                        maxLength={500}
                        helperText='در صورت خالی بودن، توضیحات SEO یا توضیح کوتاه دسته‌بندی استفاده می‌شود'
                        value={values.openGraphDescription}
                        onChange={(event) => {
                          setField('openGraphDescription', event.target.value);
                        }}
                        placeholder='توضیح مخصوص اشتراک‌گذاری لینک'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='آدرس تصویر Open Graph'
                    helperText='تصویری که هنگام اشتراک‌گذاری لینک نمایش داده می‌شود'
                    error={errors.openGraphImageUrl}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        type='url'
                        dir='ltr'
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !openGraphOpen}
                        maxLength={2048}
                        value={values.openGraphImageUrl}
                        onChange={(event) => {
                          setField('openGraphImageUrl', event.target.value);
                        }}
                        placeholder='https://cdn.partsanj.ir/blog/category-cover.jpg'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='متن جایگزین تصویر Open Graph'
                    helperText='اگر تصویر Open Graph وارد شده باشد، این فیلد برای دسترس‌پذیری الزامی است'
                    error={errors.openGraphImageAlt}
                    className='md:col-span-2'
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || !openGraphOpen}
                        maxLength={255}
                        value={values.openGraphImageAlt}
                        onChange={(event) => {
                          setField('openGraphImageAlt', event.target.value);
                        }}
                        placeholder='توضیح قابل فهم از تصویر اشتراک‌گذاری'
                      />
                    )}
                  </FormField>
                </div>
              </CollapsibleEditorSection>
            </div>
          </SheetBody>

          <SheetFooter>
            <Button type='button' variant='outline' disabled={isSaving} onClick={onClose}>
              انصراف
            </Button>

            <Button
              type='submit'
              iconStart={<Save />}
              isLoading={isSaving}
              disabled={isSaving || (mode === 'edit' && !hasChanges)}
            >
              {mode === 'create' ? 'ایجاد دسته‌بندی' : 'ذخیره تغییرات'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
