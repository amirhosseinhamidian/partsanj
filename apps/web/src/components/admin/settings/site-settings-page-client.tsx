'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Globe2,
  ImageIcon,
  Phone,
  Save,
  SearchCheck,
  Settings2,
  Share2,
  ShoppingCart,
  MessagesSquare,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type {
  SiteSettings,
  SiteSettingsResponse,
  UpdateSiteSettingsPayload,
} from '@/lib/admin/settings/site-settings.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { AdminSingleImageUploadField } from '../uploads/admin-single-image-upload-field';

type SiteSettingsPageClientProps = {
  initialSettings: SiteSettings;
};

type SiteSettingsFormValues = {
  siteName: string;
  siteTagline: string;
  siteBaseUrl: string;

  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;

  supportPhone: string;
  supportMobile: string;

  supportDisplayName: string;
  supportAvatarUrl: string;
  supportBadgeLabel: string;

  whatsappUrl: string;
  telegramUrl: string;
  baleUrl: string;
  instagramUrl: string;

  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImageUrl: string;
  noIndexSite: boolean;

  storeEnabled: boolean;
  orderingEnabled: boolean;
  showPrices: boolean;

  productReviewsEnabled: boolean;
  productQuestionsEnabled: boolean;
  blogCommentsEnabled: boolean;

  defaultShippingCostToman: string;
  freeShippingThresholdToman: string;
  orderExpirationMinutes: string;
};

type SiteSettingsFormErrors = Partial<Record<keyof SiteSettingsFormValues | 'root', string>>;

function toFormValues(settings: SiteSettings): SiteSettingsFormValues {
  return {
    siteName: settings.siteName,
    siteTagline: settings.siteTagline ?? '',
    siteBaseUrl: settings.siteBaseUrl,

    logoLightUrl: settings.logoLightUrl ?? '',
    logoDarkUrl: settings.logoDarkUrl ?? '',
    faviconUrl: settings.faviconUrl ?? '',

    supportPhone: settings.supportPhone ?? '',
    supportMobile: settings.supportMobile ?? '',

    supportDisplayName: settings.supportDisplayName,
    supportAvatarUrl: settings.supportAvatarUrl ?? '',
    supportBadgeLabel: settings.supportBadgeLabel,

    whatsappUrl: settings.whatsappUrl ?? '',
    telegramUrl: settings.telegramUrl ?? '',
    baleUrl: settings.baleUrl ?? '',
    instagramUrl: settings.instagramUrl ?? '',

    defaultSeoTitle: settings.defaultSeoTitle ?? '',
    defaultSeoDescription: settings.defaultSeoDescription ?? '',
    defaultOgImageUrl: settings.defaultOgImageUrl ?? '',
    noIndexSite: settings.noIndexSite,

    storeEnabled: settings.storeEnabled,
    orderingEnabled: settings.orderingEnabled,
    showPrices: settings.showPrices,

    productReviewsEnabled: settings.productReviewsEnabled,
    productQuestionsEnabled: settings.productQuestionsEnabled,
    blogCommentsEnabled: settings.blogCommentsEnabled,

    defaultShippingCostToman:
      settings.defaultShippingCostToman !== null ? String(settings.defaultShippingCostToman) : '',
    freeShippingThresholdToman:
      settings.freeShippingThresholdToman !== null
        ? String(settings.freeShippingThresholdToman)
        : '',
    orderExpirationMinutes: String(settings.orderExpirationMinutes),
  };
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function nullablePositiveInteger(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره تنظیمات با خطا مواجه شد';
}

function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className='rounded-2xl border border-border bg-surface p-5 shadow-sm'>
      <div className='mb-5 flex items-start gap-3'>
        <span className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand'>
          {icon}
        </span>

        <div>
          <h2 className='text-lg font-extrabold text-foreground'>{title}</h2>

          {description ? (
            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}

export function SiteSettingsPageClient({ initialSettings }: SiteSettingsPageClientProps) {
  const [values, setValues] = useState<SiteSettingsFormValues>(() => toFormValues(initialSettings));
  const [errors, setErrors] = useState<SiteSettingsFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSettings() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/admin/settings', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as SiteSettingsResponse;

        if (!ignore) {
          setValues(toFormValues(result.data));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      ignore = true;
    };
  }, []);

  function setField<TKey extends keyof SiteSettingsFormValues>(
    key: TKey,
    value: SiteSettingsFormValues[TKey],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
      root: undefined,
    }));

    setSuccessMessage(null);
  }

  function validateAndBuildPayload(): UpdateSiteSettingsPayload | null {
    const nextErrors: SiteSettingsFormErrors = {};

    const siteName = values.siteName.trim();
    const siteBaseUrl = values.siteBaseUrl.trim();

    const supportDisplayName = values.supportDisplayName.trim();
    const supportBadgeLabel = values.supportBadgeLabel.trim();

    if (!siteName) {
      nextErrors.siteName = 'نام سایت الزامی است';
    }

    if (!supportDisplayName) {
      nextErrors.supportDisplayName = 'نام رسمی پاسخ‌دهنده الزامی است';
    } else if (supportDisplayName.length > 100) {
      nextErrors.supportDisplayName = 'نام رسمی حداکثر ۱۰۰ کاراکتر باشد';
    }

    if (!supportBadgeLabel) {
      nextErrors.supportBadgeLabel = 'عنوان پاسخ رسمی الزامی است';
    } else if (supportBadgeLabel.length > 120) {
      nextErrors.supportBadgeLabel = 'عنوان پاسخ رسمی حداکثر ۱۲۰ کاراکتر باشد';
    }

    if (!siteBaseUrl) {
      nextErrors.siteBaseUrl = 'آدرس اصلی سایت الزامی است';
    } else if (!isValidHttpUrl(siteBaseUrl)) {
      nextErrors.siteBaseUrl = 'آدرس اصلی سایت باید با http یا https شروع شود';
    }

    const urlFields: Array<keyof SiteSettingsFormValues> = [
      'logoLightUrl',
      'logoDarkUrl',
      'faviconUrl',
      'whatsappUrl',
      'telegramUrl',
      'baleUrl',
      'supportAvatarUrl',
      'instagramUrl',
      'defaultOgImageUrl',
    ];

    for (const field of urlFields) {
      if (!isValidHttpUrl(String(values[field]))) {
        nextErrors[field] = 'آدرس باید یک URL معتبر با http یا https باشد';
      }
    }

    if (values.defaultSeoTitle.trim().length > 120) {
      nextErrors.defaultSeoTitle = 'عنوان سئو حداکثر ۱۲۰ کاراکتر باشد';
    }

    if (values.defaultSeoDescription.trim().length > 320) {
      nextErrors.defaultSeoDescription = 'توضیحات سئو حداکثر ۳۲۰ کاراکتر باشد';
    }

    const defaultShippingCostToman = nullablePositiveInteger(values.defaultShippingCostToman);
    const freeShippingThresholdToman = nullablePositiveInteger(values.freeShippingThresholdToman);
    const orderExpirationMinutes = Number(values.orderExpirationMinutes);

    if (Number.isNaN(defaultShippingCostToman)) {
      nextErrors.defaultShippingCostToman = 'هزینه ارسال باید عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (Number.isNaN(freeShippingThresholdToman)) {
      nextErrors.freeShippingThresholdToman = 'حد ارسال رایگان باید عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (
      !Number.isSafeInteger(orderExpirationMinutes) ||
      orderExpirationMinutes < 5 ||
      orderExpirationMinutes > 1440
    ) {
      nextErrors.orderExpirationMinutes = 'مهلت پرداخت باید بین ۵ تا ۱۴۴۰ دقیقه باشد';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return null;
    }

    return {
      siteName,
      siteTagline: nullableText(values.siteTagline),
      siteBaseUrl,

      logoLightUrl: nullableText(values.logoLightUrl),
      logoDarkUrl: nullableText(values.logoDarkUrl),
      faviconUrl: nullableText(values.faviconUrl),

      supportPhone: nullableText(values.supportPhone),
      supportMobile: nullableText(values.supportMobile),

      supportDisplayName,
      supportAvatarUrl: nullableText(values.supportAvatarUrl),
      supportBadgeLabel,

      whatsappUrl: nullableText(values.whatsappUrl),
      telegramUrl: nullableText(values.telegramUrl),
      baleUrl: nullableText(values.baleUrl),
      instagramUrl: nullableText(values.instagramUrl),

      defaultSeoTitle: nullableText(values.defaultSeoTitle),
      defaultSeoDescription: nullableText(values.defaultSeoDescription),
      defaultOgImageUrl: nullableText(values.defaultOgImageUrl),
      noIndexSite: values.noIndexSite,

      storeEnabled: values.storeEnabled,
      orderingEnabled: values.orderingEnabled,
      showPrices: values.showPrices,

      productReviewsEnabled: values.productReviewsEnabled,
      productQuestionsEnabled: values.productQuestionsEnabled,
      blogCommentsEnabled: values.blogCommentsEnabled,

      defaultShippingCostToman,
      freeShippingThresholdToman,
      orderExpirationMinutes,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = validateAndBuildPayload();

    if (!payload) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { message?: string } | null;

        throw new Error(result?.message ?? 'ذخیره تنظیمات با خطا مواجه شد');
      }

      const result = (await response.json()) as SiteSettingsResponse;

      setValues(toFormValues(result.data));
      setSuccessMessage('تنظیمات سایت با موفقیت ذخیره شد');
    } catch (error) {
      setErrors((current) => ({
        ...current,
        root: getErrorMessage(error),
      }));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form id='site-settings-form' className='space-y-6' onSubmit={handleSubmit}>
      <PageHeader
        title='تنظیمات سایت'
        description='تنظیمات عمومی، اطلاعات تماس، سئو و وضعیت فروشگاه را از این بخش مدیریت کنید'
        icon={<Settings2 className='size-5 lg:size-8' />}
        addButtonLabel={isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        onAddClick={() => {
          const form = document.getElementById('site-settings-form') as HTMLFormElement | null;

          form?.requestSubmit();
        }}
      />

      {errors.root ? (
        <div
          role='alert'
          className='rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger'
        >
          {errors.root}
        </div>
      ) : null}

      {successMessage ? (
        <div className='rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-medium text-success'>
          {successMessage}
        </div>
      ) : null}

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]'>
        <div className='space-y-6'>
          <SettingsSection
            title='اطلاعات عمومی'
            description='نام سایت، شعار کوتاه و آدرس اصلی دامنه'
            icon={<Globe2 className='size-5' />}
          >
            <div className='grid gap-5 md:grid-cols-2'>
              <FormField label='نام سایت' required error={errors.siteName}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.siteName}
                    onChange={(event) => setField('siteName', event.target.value)}
                    placeholder='پارت‌سنج'
                  />
                )}
              </FormField>

              <FormField label='آدرس اصلی سایت' required error={errors.siteBaseUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.siteBaseUrl}
                    onChange={(event) => setField('siteBaseUrl', event.target.value)}
                    placeholder='https://partsanj.ir'
                  />
                )}
              </FormField>

              <FormField
                label='شعار کوتاه سایت'
                helperText='در بخش‌های عمومی سایت و بعضی fallbackهای سئو استفاده می‌شود'
                className='md:col-span-2'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.siteTagline}
                    onChange={(event) => setField('siteTagline', event.target.value)}
                    placeholder='انتخاب مطمئن قطعات خودرو'
                  />
                )}
              </FormField>
            </div>
          </SettingsSection>

          <SettingsSection
            title='برند و فایل‌ها'
            description='آدرس لوگوها و favicon سایت'
            icon={<ImageIcon className='size-5' />}
          >
            <div className='grid gap-5 md:grid-cols-2'>
              <FormField label='لوگوی حالت روشن' error={errors.logoLightUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <AdminSingleImageUploadField
                    purpose='general'
                    value={values.logoLightUrl}
                    onChange={(url) => {
                      setField('logoLightUrl', url);
                    }}
                    alt='لوگوی روشن پارت‌سنج'
                    disabled={isSaving}
                    previewClassName='size-32'
                    uploadTitle='آپلود لوگوی روشن'
                  />
                )}
              </FormField>

              <FormField label='لوگوی حالت تیره' error={errors.logoDarkUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <AdminSingleImageUploadField
                    purpose='general'
                    value={values.logoDarkUrl}
                    onChange={(url) => {
                      setField('logoDarkUrl', url);
                    }}
                    alt='لوگوی تیره پارت‌سنج'
                    disabled={isSaving}
                    previewClassName='size-32'
                    uploadTitle='آپلود لوگوی تیره'
                  />
                )}
              </FormField>

              <FormField label='Favicon' error={errors.faviconUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <AdminSingleImageUploadField
                    purpose='general'
                    value={values.faviconUrl}
                    onChange={(url) => {
                      setField('faviconUrl', url);
                    }}
                    alt='لوگوی favicon پارت‌سنج'
                    disabled={isSaving}
                    previewClassName='size-32'
                    uploadTitle='آپلود لوگوی favicon'
                  />
                )}
              </FormField>
            </div>
          </SettingsSection>

          <SettingsSection
            title='سئو عمومی'
            description='مقادیر fallback برای صفحه‌هایی که سئوی اختصاصی ندارند'
            icon={<SearchCheck className='size-5' />}
          >
            <div className='grid gap-5'>
              <FormField
                label='عنوان پیش‌فرض سئو'
                helperText={`حداکثر ۱۲۰ کاراکتر. مقدار فعلی: ${toPersianDigits(values.defaultSeoTitle.length)}`}
                error={errors.defaultSeoTitle}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    maxLength={120}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.defaultSeoTitle}
                    onChange={(event) => setField('defaultSeoTitle', event.target.value)}
                    placeholder='پارت‌سنج | فروشگاه قطعات یدکی خودرو'
                  />
                )}
              </FormField>

              <FormField label='توضیحات پیش‌فرض سئو' error={errors.defaultSeoDescription}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    maxLength={320}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    helperText={`حداکثر ۳۲۰ کاراکتر. مقدار فعلی`}
                    value={values.defaultSeoDescription}
                    onChange={(event) => setField('defaultSeoDescription', event.target.value)}
                    placeholder='توضیح پیش‌فرض سایت برای موتورهای جستجو'
                  />
                )}
              </FormField>

              <FormField label='تصویر پیش‌فرض Open Graph' error={errors.defaultOgImageUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <AdminSingleImageUploadField
                    purpose='general'
                    value={values.defaultOgImageUrl}
                    onChange={(url) => {
                      setField('defaultOgImageUrl', url);
                    }}
                    alt='تصویر پیش‌فرض Open Graph'
                    disabled={isSaving}
                    previewClassName='h-28 w-full'
                    uploadTitle='آپلود تصویر پیش فرض Open Graph'
                  />
                )}
              </FormField>

              <FormField
                label='عدم ایندکس کل سایت'
                helperText='فقط برای حالت تست یا قبل از انتشار عمومی فعال شود'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    checked={values.noIndexSite}
                    onCheckedChange={(checked) => setField('noIndexSite', checked)}
                  />
                )}
              </FormField>
            </div>
          </SettingsSection>
        </div>

        <div className='space-y-6'>
          <SettingsSection
            title='تماس و شبکه‌های اجتماعی'
            description='اطلاعات تماس و لینک پیام‌رسان‌ها'
            icon={<Phone className='size-5' />}
          >
            <div className='grid gap-5'>
              <FormField label='شماره تماس ثابت'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.supportPhone}
                    onChange={(event) => setField('supportPhone', event.target.value)}
                    placeholder='0219130100'
                  />
                )}
              </FormField>

              <FormField label='شماره موبایل پشتیبانی'>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.supportMobile}
                    onChange={(event) => setField('supportMobile', event.target.value)}
                    placeholder='09120000000'
                  />
                )}
              </FormField>

              <FormField label='واتساپ' error={errors.whatsappUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.whatsappUrl}
                    onChange={(event) => setField('whatsappUrl', event.target.value)}
                    placeholder='https://wa.me/989120000000'
                  />
                )}
              </FormField>

              <FormField label='تلگرام' error={errors.telegramUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.telegramUrl}
                    onChange={(event) => setField('telegramUrl', event.target.value)}
                    placeholder='https://t.me/partsanj'
                  />
                )}
              </FormField>

              <FormField label='بله' error={errors.baleUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.baleUrl}
                    onChange={(event) => setField('baleUrl', event.target.value)}
                    placeholder='https://ble.ir/partsanj'
                  />
                )}
              </FormField>

              <FormField label='اینستاگرام' error={errors.instagramUrl}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.instagramUrl}
                    onChange={(event) => setField('instagramUrl', event.target.value)}
                    placeholder='https://instagram.com/partsanj'
                  />
                )}
              </FormField>
            </div>
          </SettingsSection>

          <SettingsSection
            title='تعاملات کاربران'
            description='هویت رسمی پارت‌سنج و فعال بودن نظرات، پرسش‌ها و دیدگاه‌ها'
            icon={<MessagesSquare className='size-5' />}
          >
            <div className='grid gap-5'>
              <FormField
                label='نام رسمی پاسخ‌دهنده'
                required
                helperText='این نام کنار پاسخ‌های رسمی پارت‌سنج نمایش داده می‌شود'
                error={errors.supportDisplayName}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    maxLength={100}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.supportDisplayName}
                    onChange={(event) => setField('supportDisplayName', event.target.value)}
                    placeholder='پارت‌سنج'
                  />
                )}
              </FormField>

              <FormField
                label='آواتار پاسخ رسمی'
                helperText='URL تصویر رسمی؛ در صورت خالی بودن از آیکن پیش‌فرض استفاده می‌شود'
                error={errors.supportAvatarUrl}
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
                    value={values.supportAvatarUrl}
                    onChange={(event) => setField('supportAvatarUrl', event.target.value)}
                    placeholder='https://cdn.partsanj.com/support-avatar.png'
                  />
                )}
              </FormField>

              <FormField
                label='عنوان پاسخ رسمی'
                required
                helperText='Badge نمایش‌داده‌شده کنار پاسخ تیم پارت‌سنج'
                error={errors.supportBadgeLabel}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    maxLength={120}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.supportBadgeLabel}
                    onChange={(event) => setField('supportBadgeLabel', event.target.value)}
                    placeholder='پاسخ رسمی پارت‌سنج'
                  />
                )}
              </FormField>

              <div className='rounded-2xl border border-border bg-surface-muted p-4'>
                <div className='flex items-start gap-3'>
                  <span className='grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand'>
                    <ShieldCheck className='size-5' />
                  </span>

                  <div>
                    <p className='font-extrabold text-foreground'>پیش‌نمایش هویت رسمی</p>

                    <div className='mt-2 flex flex-wrap items-center gap-2'>
                      <span className='font-bold text-foreground'>
                        {values.supportDisplayName || 'پارت‌سنج'}
                      </span>

                      <span className='rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white'>
                        {values.supportBadgeLabel || 'پاسخ رسمی پارت‌سنج'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='border-t border-border pt-5'>
                <p className='mb-4 text-sm font-extrabold text-foreground'>بخش‌های فعال</p>

                <div className='space-y-5'>
                  <Switch
                    label='نظرات و امتیاز محصولات'
                    helperText='امکان مشاهده و ثبت Rating و Review روی محصولات'
                    disabled={isSaving}
                    checked={values.productReviewsEnabled}
                    onCheckedChange={(checked) => setField('productReviewsEnabled', checked)}
                  />

                  <Switch
                    label='پرسش و پاسخ محصولات'
                    helperText='امکان مشاهده و ثبت سؤال درباره محصولات'
                    disabled={isSaving}
                    checked={values.productQuestionsEnabled}
                    onCheckedChange={(checked) => setField('productQuestionsEnabled', checked)}
                  />

                  <Switch
                    label='دیدگاه مقالات'
                    helperText='امکان مشاهده، ثبت دیدگاه و پاسخ در صفحات بلاگ'
                    disabled={isSaving}
                    checked={values.blogCommentsEnabled}
                    onCheckedChange={(checked) => setField('blogCommentsEnabled', checked)}
                  />
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title='وضعیت فروشگاه'
            description='کنترل فعال بودن فروش، سفارش‌گیری و قیمت‌ها'
            icon={<ShoppingCart className='size-5' />}
          >
            <div className='grid gap-5'>
              <FormField
                label='فعال بودن سایت فروشگاهی'
                helperText='اگر غیرفعال شود، می‌توانی فروشگاه را در حالت نگهداری قرار بدهی'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    checked={values.storeEnabled}
                    onCheckedChange={(checked) => setField('storeEnabled', checked)}
                  />
                )}
              </FormField>

              <FormField
                label='امکان ثبت سفارش'
                helperText='با خاموش کردن این گزینه، کاربر فقط محصولات را مشاهده می‌کند'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    checked={values.orderingEnabled}
                    onCheckedChange={(checked) => setField('orderingEnabled', checked)}
                  />
                )}
              </FormField>

              <FormField
                label='نمایش قیمت‌ها'
                helperText='اگر غیرفعال شود، قیمت‌ها می‌توانند به حالت استعلامی نمایش داده شوند'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    checked={values.showPrices}
                    onCheckedChange={(checked) => setField('showPrices', checked)}
                  />
                )}
              </FormField>

              <div className='grid gap-5 sm:grid-cols-2'>
                <FormField
                  label='هزینه پیش‌فرض ارسال'
                  helperText='تومان'
                  error={errors.defaultShippingCostToman}
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
                      value={values.defaultShippingCostToman}
                      onChange={(event) => setField('defaultShippingCostToman', event.target.value)}
                      placeholder='80000'
                    />
                  )}
                </FormField>

                <FormField
                  label='حد ارسال رایگان'
                  helperText='تومان'
                  error={errors.freeShippingThresholdToman}
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
                      value={values.freeShippingThresholdToman}
                      onChange={(event) =>
                        setField('freeShippingThresholdToman', event.target.value)
                      }
                      placeholder='3000000'
                    />
                  )}
                </FormField>
              </div>

              <FormField
                label='مهلت پرداخت سفارش'
                helperText='بر حسب دقیقه؛ بین ۵ تا ۱۴۴۰'
                error={errors.orderExpirationMinutes}
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
                    value={values.orderExpirationMinutes}
                    onChange={(event) => setField('orderExpirationMinutes', event.target.value)}
                    placeholder='30'
                  />
                )}
              </FormField>
            </div>
          </SettingsSection>

          <SettingsSection
            title='پیش‌نمایش خلاصه'
            description='نمای کلی از اطلاعات اصلی تنظیمات'
            icon={<Share2 className='size-5' />}
          >
            <div className='space-y-3 rounded-2xl border border-border bg-background/60 p-4 text-sm'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-foreground-secondary'>نام سایت</span>
                <span className='font-extrabold text-foreground'>{values.siteName || '—'}</span>
              </div>

              <div className='flex items-center justify-between gap-4'>
                <span className='text-foreground-secondary'>ثبت سفارش</span>
                <span
                  className={
                    values.orderingEnabled ? 'font-bold text-success' : 'font-bold text-danger'
                  }
                >
                  {values.orderingEnabled ? 'فعال' : 'غیرفعال'}
                </span>
              </div>

              <div className='flex items-center justify-between gap-4'>
                <span className='text-foreground-secondary'>نمایش قیمت</span>
                <span
                  className={
                    values.showPrices ? 'font-bold text-success' : 'font-bold text-warning'
                  }
                >
                  {values.showPrices ? 'فعال' : 'استعلامی'}
                </span>
              </div>

              <div className='flex items-center justify-between gap-4'>
                <span className='text-foreground-secondary'>مهلت پرداخت</span>
                <span className='font-extrabold text-foreground'>
                  {toPersianDigits(values.orderExpirationMinutes || '۰')} دقیقه
                </span>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </form>
  );
}
