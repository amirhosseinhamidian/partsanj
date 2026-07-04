'use client';

import { useToast } from '@/components/providers/toast-provider';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { storefrontCustomerProfileApi } from '@/lib/api/storefront-customer-profile-client';
import { ClientApiError } from '@/lib/api/web-client';
import type { StorefrontCustomerProfile } from '@/lib/storefront/customer-profile/customer-profile.types';

// این Import را از فایل Dashboard یا Addresses فعلی پروژه کپی کن
import { useStorefrontCustomerAuth } from '@/components/storefront/customer-auth/storefront-customer-auth-provider';

import {
  CalendarDays,
  CircleAlert,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';

type ProfileFormValues = {
  firstName: string;
  lastName: string;
};

type ProfileFieldErrors = Partial<Record<keyof ProfileFormValues, string>>;

const jalaliDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Tehran',
});

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function formatAccountDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return jalaliDateFormatter.format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره اطلاعات حساب با خطا مواجه شد';
}

function validateForm(values: ProfileFormValues): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  const firstName = normalizeName(values.firstName);
  const lastName = normalizeName(values.lastName);

  if (!firstName) {
    errors.firstName = 'نام را وارد کنید';
  } else if (firstName.length > 80) {
    errors.firstName = 'نام نمی‌تواند بیشتر از ۸۰ کاراکتر باشد';
  }

  if (!lastName) {
    errors.lastName = 'نام خانوادگی را وارد کنید';
  } else if (lastName.length > 80) {
    errors.lastName = 'نام خانوادگی نمی‌تواند بیشتر از ۸۰ کاراکتر باشد';
  }

  return errors;
}

function ProfileLoadingState() {
  return (
    <div className='space-y-6'>
      <div className='h-36 animate-pulse rounded-card bg-surface-muted' />

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]'>
        <div className='h-96 animate-pulse rounded-card bg-surface-muted' />
        <div className='h-64 animate-pulse rounded-card bg-surface-muted' />
      </div>
    </div>
  );
}

export function CustomerProfilePageClient() {
  const { toast } = useToast();

  const { status, openLogin, refreshSession } = useStorefrontCustomerAuth();

  const hasOpenedLoginRef = useRef(false);

  const [profile, setProfile] = useState<StorefrontCustomerProfile | null>(null);

  const [form, setForm] = useState<ProfileFormValues>({
    firstName: '',
    lastName: '',
  });

  const [errors, setErrors] = useState<ProfileFieldErrors>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await storefrontCustomerProfileApi.get();

      setProfile(response.data);

      setForm({
        firstName: response.data.firstName ?? '',
        lastName: response.data.lastName ?? '',
      });

      setErrors({});
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        openLogin({
          returnTo: '/account/profile',
        });

        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [openLogin]);

  useEffect(() => {
    if (status !== 'guest' || hasOpenedLoginRef.current) {
      return;
    }

    hasOpenedLoginRef.current = true;

    openLogin({
      returnTo: '/account/profile',
    });
  }, [openLogin, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void loadProfile();
  }, [loadProfile, status]);

  function updateField(field: keyof ProfileFormValues, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function resetForm() {
    if (!profile) {
      return;
    }

    setForm({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
    });

    setErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);

    try {
      const response = await storefrontCustomerProfileApi.update({
        firstName: normalizeName(form.firstName),
        lastName: normalizeName(form.lastName),
      });

      setProfile(response.data);

      setForm({
        firstName: response.data.firstName ?? '',
        lastName: response.data.lastName ?? '',
      });

      await refreshSession();

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'اطلاعات حساب با موفقیت ذخیره شد',
      });
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: 'ذخیره اطلاعات انجام نشد',
        description: getErrorMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  }

  if ((status === 'loading' && !profile) || (status === 'authenticated' && isLoading && !profile)) {
    return <ProfileLoadingState />;
  }

  if (status === 'guest') {
    return (
      <section className='rounded-card border border-border bg-surface p-8 text-center shadow-panel'>
        <UserRound className='mx-auto size-10 text-brand' />

        <h1 className='mt-4 text-2xl font-extrabold text-foreground'>ورود به حساب کاربری</h1>

        <p className='mx-auto mt-3 max-w-xl text-sm leading-7 text-foreground-secondary'>
          برای مشاهده و ویرایش اطلاعات حساب، وارد حساب کاربری خود شوید
        </p>

        <Button
          className='mt-5'
          onClick={() => {
            openLogin({
              returnTo: '/account/profile',
            });
          }}
        >
          ورود یا ثبت‌نام
        </Button>
      </section>
    );
  }

  if (!profile) {
    return (
      <section role='alert' className='rounded-card border border-danger/30 bg-danger-soft p-6'>
        <div className='flex items-start gap-3'>
          <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

          <div>
            <h1 className='font-extrabold text-danger'>دریافت اطلاعات حساب ناموفق بود</h1>

            <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
              {loadError ?? 'اطلاعات حساب در دسترس نیست'}
            </p>

            <Button
              className='mt-5'
              variant='outline'
              iconStart={<RefreshCw className='size-4' />}
              onClick={() => void loadProfile()}
            >
              تلاش مجدد
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const initialFirstName = profile.firstName ?? '';
  const initialLastName = profile.lastName ?? '';

  const isDirty =
    normalizeName(form.firstName) !== normalizeName(initialFirstName) ||
    normalizeName(form.lastName) !== normalizeName(initialLastName);

  return (
    <div className='space-y-6'>
      <section className='border-b border-border pb-6'>
        <p className='text-sm font-semibold text-brand'>حساب کاربری</p>

        <h1 className='type-page-title mt-1 text-foreground'>اطلاعات حساب</h1>

        <p className='type-body mt-2 text-foreground-secondary'>
          نام و نام خانوادگی خود را برای استفاده در سفارش‌ها به‌روزرسانی کنید
        </p>
      </section>

      {loadError ? (
        <section
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between'
        >
          <div className='flex items-start gap-3'>
            <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

            <p className='text-sm leading-7 font-semibold text-danger'>{loadError}</p>
          </div>

          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw className='size-4' />}
            onClick={() => void loadProfile()}
          >
            تلاش مجدد
          </Button>
        </section>
      ) : null}

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]'>
        <section className='rounded-card border border-border bg-surface shadow-panel'>
          <header className='flex items-center gap-3 border-b border-border px-5 py-4'>
            <span className='grid size-10 place-items-center rounded-control bg-brand-soft text-brand'>
              <UserRound className='size-5' />
            </span>

            <div>
              <h2 className='font-extrabold text-foreground'>مشخصات فردی</h2>

              <p className='mt-1 text-sm text-foreground-secondary'>
                این اطلاعات در حساب کاربری شما ثبت می‌شود
              </p>
            </div>
          </header>

          <form className='space-y-6 p-5' onSubmit={handleSubmit}>
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField label='نام' required error={errors.firstName}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={form.firstName}
                    required={required}
                    disabled={isSaving}
                    autoComplete='given-name'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    placeholder='نام'
                    onChange={(event) => {
                      updateField('firstName', event.target.value);
                    }}
                  />
                )}
              </FormField>

              <FormField label='نام خانوادگی' required error={errors.lastName}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    value={form.lastName}
                    required={required}
                    disabled={isSaving}
                    autoComplete='family-name'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    placeholder='نام خانوادگی'
                    onChange={(event) => {
                      updateField('lastName', event.target.value);
                    }}
                  />
                )}
              </FormField>
            </div>

            <div className='flex flex-wrap justify-end gap-3 border-t border-border pt-5'>
              <Button
                type='button'
                variant='secondary'
                disabled={isSaving || !isDirty}
                iconStart={<RotateCcw className='size-4' />}
                onClick={resetForm}
              >
                بازگرداندن
              </Button>

              <Button
                type='submit'
                disabled={isSaving || !isDirty}
                isLoading={isSaving}
                loadingLabel='در حال ذخیره'
                iconStart={<Save className='size-4' />}
              >
                ذخیره تغییرات
              </Button>
            </div>
          </form>
        </section>

        <aside className='space-y-6'>
          <section className='rounded-card border border-border bg-surface p-5 shadow-panel'>
            <div className='flex items-center gap-3'>
              <span className='grid size-10 place-items-center rounded-control bg-brand-soft text-brand'>
                <Smartphone className='size-5' />
              </span>

              <div>
                <h2 className='font-extrabold text-foreground'>شماره موبایل</h2>

                <p className='mt-1 text-xs text-foreground-secondary'>شماره تأییدشده حساب شما</p>
              </div>
            </div>

            <Input
              className='mt-5'
              value={profile.mobile}
              readOnly
              dir='ltr'
              aria-label='شماره موبایل'
            />

            <div className='mt-4 flex gap-2 rounded-control border border-info/30 bg-info-soft p-3'>
              <LockKeyhole className='mt-0.5 size-4 shrink-0 text-info' />

              <p className='text-xs leading-6 text-foreground-secondary'>
                تغییر شماره موبایل در این بخش امکان‌پذیر نیست و نیازمند تأیید شماره جدید با کد
                یک‌بارمصرف است
              </p>
            </div>
          </section>

          <section className='rounded-card border border-border bg-surface p-5 shadow-panel'>
            <div className='flex items-center gap-3'>
              <span className='grid size-10 place-items-center rounded-control bg-brand-soft text-brand'>
                <ShieldCheck className='size-5' />
              </span>

              <div>
                <h2 className='font-extrabold text-foreground'>وضعیت حساب</h2>

                <p className='mt-1 text-xs text-foreground-secondary'>
                  حساب شما فعال و تأییدشده است
                </p>
              </div>
            </div>

            <div className='mt-5 border-t border-border pt-4'>
              <div className='flex items-center gap-2 text-sm text-foreground-secondary'>
                <CalendarDays className='size-4 text-brand' />

                <span>عضو از {formatAccountDate(profile.createdAt)}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
