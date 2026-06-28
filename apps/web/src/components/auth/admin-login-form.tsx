'use client';

import { ClientApiError, webApi } from '@/lib/api/web-client';
import { normalizeIranianMobile, normalizeOtp } from '@/lib/auth/phone';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type AdminLoginFormProps = {
  nextPath: string;
  initialMessage?: string;
};

export function AdminLoginForm({ nextPath, initialMessage }: AdminLoginFormProps) {
  const router = useRouter();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingAction, setPendingAction] = useState<'request' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(initialMessage ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const isPending = pendingAction !== null;

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldown > 0]);

  function getErrorMessage(error: unknown): string {
    if (error instanceof ClientApiError) {
      return error.message;
    }

    return 'خطای غیرمنتظره رخ داد';
  }

  async function requestOtp() {
    const phone = normalizeIranianMobile(phoneInput);

    if (!phone) {
      setError('شماره موبایل را به‌صورت ۰۹xxxxxxxxx وارد کن');
      return;
    }

    setError(null);
    setNotice(null);
    setPendingAction('request');

    try {
      const result = await webApi.requestOtp(phone);

      setVerifiedPhone(phone);
      setStep('otp');
      setOtp('');
      setCooldown(result.retryAfterSeconds ?? 120);
      setNotice('کد تأیید ارسال شد');
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function verifyOtp() {
    const code = normalizeOtp(otp);

    if (!/^\d{4,8}$/.test(code)) {
      setError('کد تأیید را کامل وارد کن');
      return;
    }

    setError(null);
    setNotice(null);
    setPendingAction('verify');

    try {
      await webApi.verifyOtp(verifiedPhone, code, 'admin');

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === 'phone') {
      await requestOtp();
      return;
    }

    await verifyOtp();
  }

  return (
    <form
      dir='rtl'
      onSubmit={handleSubmit}
      className='w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm'
    >
      <div className='mb-7'>
        <p className='text-sm font-medium text-zinc-500'>PartSanj Admin</p>
        <h1 className='mt-2 text-2xl font-bold text-zinc-950'>ورود به پنل مدیریت</h1>
        <p className='mt-2 text-sm leading-6 text-zinc-600'>
          ورود فقط برای کاربران دارای نقش ADMIN فعال است
        </p>
      </div>

      {error ? (
        <div
          role='alert'
          className='mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className='mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>
          {notice}
        </div>
      ) : null}

      {step === 'phone' ? (
        <label className='block'>
          <span className='mb-2 block text-sm font-medium text-zinc-800'>شماره موبایل</span>
          <input
            autoFocus
            dir='ltr'
            inputMode='tel'
            autoComplete='tel'
            value={phoneInput}
            onChange={(event) => setPhoneInput(event.target.value)}
            placeholder='09123456789'
            className='w-full rounded-xl border border-zinc-300 px-4 py-3 text-left text-zinc-950 transition outline-none focus:border-zinc-950'
          />
        </label>
      ) : (
        <>
          <div className='mb-5 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700'>
            کد ارسال‌شده به شماره{' '}
            <span dir='ltr' className='font-semibold'>
              {verifiedPhone}
            </span>{' '}
            را وارد کن
          </div>

          <label className='block'>
            <span className='mb-2 block text-sm font-medium text-zinc-800'>کد تأیید</span>
            <input
              autoFocus
              dir='ltr'
              inputMode='numeric'
              autoComplete='one-time-code'
              value={otp}
              maxLength={8}
              onChange={(event) => setOtp(normalizeOtp(event.target.value))}
              placeholder='123456'
              className='w-full rounded-xl border border-zinc-300 px-4 py-3 text-center text-xl tracking-[0.45em] text-zinc-950 transition outline-none focus:border-zinc-950'
            />
          </label>

          <div className='mt-4 flex items-center justify-between gap-3 text-sm'>
            <button
              type='button'
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError(null);
                setNotice(null);
              }}
              disabled={isPending}
              className='text-zinc-600 transition hover:text-zinc-950 disabled:opacity-50'
            >
              تغییر شماره
            </button>

            {cooldown > 0 ? (
              <span className='text-zinc-500'>ارسال مجدد تا {cooldown} ثانیه</span>
            ) : (
              <button
                type='button'
                onClick={() => void requestOtp()}
                disabled={isPending}
                className='font-medium text-zinc-950 underline disabled:opacity-50'
              >
                ارسال مجدد کد
              </button>
            )}
          </div>
        </>
      )}

      <button
        type='submit'
        disabled={isPending}
        className='mt-6 w-full rounded-xl bg-zinc-950 px-4 py-3 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {pendingAction === 'request'
          ? 'در حال ارسال کد...'
          : pendingAction === 'verify'
            ? 'در حال ورود...'
            : step === 'phone'
              ? 'ارسال کد تأیید'
              : 'تأیید و ورود'}
      </button>
    </form>
  );
}
