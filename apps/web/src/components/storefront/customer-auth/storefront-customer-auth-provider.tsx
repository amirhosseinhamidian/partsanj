'use client';

import { useStorefrontCart } from '@/components/storefront/cart/storefront-cart-provider';
import { useToast } from '@/components/providers/toast-provider';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { storefrontCustomerAuthApi } from '@/lib/api/storefront-customer-auth-client';
import { ClientApiError } from '@/lib/api/web-client';
import type { StorefrontCustomerAuthUser } from '@/lib/storefront/customer-auth/customer-auth.types';
import { toLatinDigits, toPersianDigits } from '@/lib/utils/digits';
import { KeyRound, LogIn, Pencil, Phone, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PropsWithChildren,
} from 'react';

const OTP_LENGTH = 4;

type CustomerAuthStatus = 'loading' | 'authenticated' | 'guest';

type OpenCustomerLoginOptions = {
  returnTo?: string;
};

type StorefrontCustomerAuthContextValue = {
  status: CustomerAuthStatus;
  user: StorefrontCustomerAuthUser | null;
  isLoggingOut: boolean;

  openLogin: (options?: OpenCustomerLoginOptions) => void;

  closeLogin: () => void;

  refreshSession: () => Promise<StorefrontCustomerAuthUser | null>;

  logout: () => Promise<void>;
};

const StorefrontCustomerAuthContext = createContext<StorefrontCustomerAuthContextValue | null>(
  null,
);

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'عملیات ورود با خطا مواجه شد';
}

function normalizeIranianMobile(value: string): string | null {
  const digits = toLatinDigits(value).replace(/\D/g, '');

  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^989\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }

  if (/^00989\d{9}$/.test(digits)) {
    return `0${digits.slice(4)}`;
  }

  return null;
}

function formatRemainingSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;

  return `${toPersianDigits(String(minutes))}:${toPersianDigits(String(seconds).padStart(2, '0'))}`;
}

function isSafeReturnTo(value: string | undefined): value is string {
  return Boolean(value && value.startsWith('/') && !value.startsWith('//'));
}

type CustomerLoginSheetProps = {
  open: boolean;
  mobile: string;
  otp: string;
  error: string | null;
  step: 'mobile' | 'otp';
  isRequesting: boolean;
  isVerifying: boolean;
  resendRemainingSeconds: number;
  onClose: () => void;
  onMobileChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
  onBack: () => void;
};

function CustomerLoginDialog({
  open,
  mobile,
  otp,
  error,
  step,
  isRequesting,
  isVerifying,
  resendRemainingSeconds,
  onClose,
  onMobileChange,
  onOtpChange,
  onRequestOtp,
  onVerifyOtp,
  onBack,
}: CustomerLoginSheetProps) {
  const isBusy = isRequesting || isVerifying;

  function handleMobileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRequestOtp();
  }

  function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onVerifyOtp();
  }

  const title = step === 'mobile' ? 'ورود یا ثبت‌نام' : 'تأیید شماره موبایل';

  const description =
    step === 'mobile'
      ? 'برای ثبت سفارش و پیگیری پرداخت، شماره موبایل خود را وارد کنید'
      : `کد ${toPersianDigits(String(OTP_LENGTH))} رقمی ارسال‌شده به شماره شما را وارد کنید`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isBusy) {
          onClose();
        }
      }}
    >
      <DialogContent className='w-[calc(100%-2rem)] max-w-lg'>
        <DialogHeader className='text-start'>
          <div className='flex items-start gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              {step === 'mobile' ? <Phone className='size-5' /> : <KeyRound className='size-5' />}
            </span>

            <div className='min-w-0'>
              <DialogTitle className='text-lg font-extrabold text-foreground'>{title}</DialogTitle>

              <DialogDescription className='mt-1 text-xs leading-6 text-foreground-secondary'>
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'mobile' ? (
          <form onSubmit={handleMobileSubmit}>
            <DialogBody className='space-y-5'>
              <FormField label='شماره موبایل' required error={error ?? undefined}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    dir='rtl'
                    type='tel'
                    inputMode='numeric'
                    autoComplete='tel'
                    value={mobile}
                    required={required}
                    disabled={isBusy}
                    placeholder='۰۹۱۲۳۴۵۶۷۸۹'
                    className='text-center text-lg'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    onChange={(event) => onMobileChange(event.target.value)}
                  />
                )}
              </FormField>

              <div className='rounded-control border border-info/30 bg-info-soft p-4'>
                <div className='flex gap-2'>
                  <ShieldCheck className='mt-0.5 size-4 shrink-0 text-info' />

                  <p className='text-xs leading-6 text-foreground-secondary'>
                    با ادامه‌دادن، یک کد تأیید برای شماره موبایل شما ارسال می‌شود
                  </p>
                </div>
              </div>
            </DialogBody>

            <DialogFooter className='gap-3'>
              <Button type='button' variant='outline' disabled={isBusy} onClick={onClose}>
                انصراف
              </Button>

              <Button
                type='submit'
                isLoading={isRequesting}
                loadingLabel='در حال ارسال کد'
                iconStart={<LogIn className='size-4' />}
              >
                دریافت کد تأیید
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <DialogBody className='space-y-6'>
              <div className='flex items-center justify-between gap-3 rounded-control border border-border bg-surface-muted p-4'>
                <div className='min-w-0'>
                  <p className='text-xs text-foreground-muted'>
                    کد تأیید به این شماره ارسال شده است
                  </p>

                  <p dir='ltr' className='mt-1 truncate text-sm font-extrabold text-foreground'>
                    {toPersianDigits(normalizeIranianMobile(mobile) ?? mobile)}
                  </p>
                </div>

                <button
                  type='button'
                  disabled={isBusy}
                  aria-label='ویرایش شماره موبایل'
                  title='ویرایش شماره موبایل'
                  onClick={onBack}
                  className='grid size-10 shrink-0 place-items-center rounded-control border border-border bg-surface text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50'
                >
                  <Pencil className='size-4' />
                </button>
              </div>

              <OtpInput
                length={OTP_LENGTH}
                size='md'
                value={otp}
                error={Boolean(error)}
                disabled={isBusy}
                autoFocus
                onChange={onOtpChange}
              />

              {error ? (
                <p className='text-center text-sm font-semibold text-danger'>{error}</p>
              ) : null}

              <div className='rounded-control border border-border bg-surface-muted px-4 py-3 text-center'>
                {resendRemainingSeconds > 0 ? (
                  <p className='text-sm text-foreground-secondary'>
                    درخواست مجدد کد تا{' '}
                    <span dir='ltr' className='numeric font-extrabold text-foreground'>
                      {formatRemainingSeconds(resendRemainingSeconds)}
                    </span>{' '}
                    دیگر فعال می‌شود
                  </p>
                ) : (
                  <button
                    type='button'
                    disabled={isBusy}
                    onClick={onRequestOtp}
                    className='hover:text-brand-strong inline-flex items-center gap-2 text-sm font-bold text-brand transition-colors disabled:pointer-events-none disabled:opacity-50'
                  >
                    <RefreshCw className='size-4' />
                    درخواست مجدد کد تأیید
                  </button>
                )}
              </div>
            </DialogBody>

            <DialogFooter className='justify-end'>
              <Button
                type='submit'
                disabled={otp.length !== OTP_LENGTH}
                isLoading={isVerifying}
                loadingLabel='در حال تأیید'
                iconStart={<ShieldCheck className='size-4' />}
              >
                تأیید و ورود
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function StorefrontCustomerAuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { toast } = useToast();
  const { reloadCart } = useStorefrontCart();

  const [status, setStatus] = useState<CustomerAuthStatus>('loading');

  const [user, setUser] = useState<StorefrontCustomerAuthUser | null>(null);

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [resendAvailableAtMs, setResendAvailableAtMs] = useState<number | null>(null);

  const [clockMs, setClockMs] = useState(() => Date.now());

  const returnToRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (step !== 'otp' || !resendAvailableAtMs) {
      return;
    }

    setClockMs(Date.now());

    const intervalId = window.setInterval(() => {
      setClockMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [step, resendAvailableAtMs]);

  const resendRemainingSeconds = useMemo(() => {
    if (!resendAvailableAtMs) {
      return 0;
    }

    return Math.max(0, Math.ceil((resendAvailableAtMs - clockMs) / 1000));
  }, [clockMs, resendAvailableAtMs]);

  const syncAuthenticatedUser = useCallback(async () => {
    const response = await storefrontCustomerAuthApi.getMe();

    if (!response.data) {
      throw new Error('Authenticated user was not returned');
    }

    setUser(response.data);
    setStatus('authenticated');

    return response.data;
  }, []);

  const refreshSession = useCallback(async () => {
    setStatus('loading');

    try {
      return await syncAuthenticatedUser();
    } catch {
      setUser(null);
      setStatus('guest');

      return null;
    }
  }, [syncAuthenticatedUser]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const closeLogin = useCallback(() => {
    if (isRequesting || isVerifying) {
      return;
    }

    setIsLoginOpen(false);
    setError(null);
    setOtp('');
    setStep('mobile');
    setResendAvailableAtMs(null);
    returnToRef.current = undefined;
  }, [isRequesting, isVerifying]);

  const openLogin = useCallback((options?: OpenCustomerLoginOptions) => {
    returnToRef.current = options?.returnTo;
    setError(null);
    setOtp('');
    setStep('mobile');
    setIsLoginOpen(true);
  }, []);

  const requestOtp = useCallback(async () => {
    const normalizedMobile = normalizeIranianMobile(mobile);

    if (!normalizedMobile) {
      setError('شماره موبایل را با فرمت معتبر وارد کنید');
      return;
    }

    setError(null);
    setIsRequesting(true);

    try {
      const response = await storefrontCustomerAuthApi.requestOtp(normalizedMobile);

      const resendAtMs = Date.parse(response.data.resendAvailableAt);

      setMobile(normalizedMobile);
      setOtp('');
      setStep('otp');
      setClockMs(Date.now());

      setResendAvailableAtMs(Number.isFinite(resendAtMs) ? resendAtMs : Date.now() + 120_000);

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'کد تأیید ارسال شد',
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsRequesting(false);
    }
  }, [mobile, toast]);

  const verifyOtp = useCallback(async () => {
    const normalizedMobile = normalizeIranianMobile(mobile);

    if (!normalizedMobile) {
      setStep('mobile');
      setError('شماره موبایل معتبر نیست');
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setError(`کد تأیید باید ${toPersianDigits(String(OTP_LENGTH))} رقمی باشد`);

      return;
    }

    setError(null);
    setIsVerifying(true);

    try {
      const response = await storefrontCustomerAuthApi.verifyOtp(normalizedMobile, otp);

      setUser({
        ...response.data.user,
        mobile: response.data.user.mobile ?? normalizedMobile,
      });

      setStatus('authenticated');

      try {
        await syncAuthenticatedUser();
      } catch {
        // اطلاعات اولیه verifyOtp موقتاً حفظ می‌شود
        // تا Header به حالت مهمان برنگردد
      }

      await reloadCart();

      const returnTo = returnToRef.current;

      setIsLoginOpen(false);
      setOtp('');
      setStep('mobile');
      returnToRef.current = undefined;

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'با موفقیت وارد شدید',
      });

      if (isSafeReturnTo(returnTo)) {
        router.replace(returnTo);
        return;
      }

      router.refresh();
    } catch (verifyError) {
      setError(getErrorMessage(verifyError));
    } finally {
      setIsVerifying(false);
    }
  }, [mobile, otp, reloadCart, router, syncAuthenticatedUser, toast]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await storefrontCustomerAuthApi.logout();

      setUser(null);
      setStatus('guest');

      await reloadCart();

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'از حساب کاربری خارج شدید',
      });

      router.refresh();
    } catch (logoutError) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: 'خروج از حساب انجام نشد',
        description: getErrorMessage(logoutError),
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [reloadCart, router, toast]);

  const value = useMemo<StorefrontCustomerAuthContextValue>(
    () => ({
      status,
      user,
      isLoggingOut,
      openLogin,
      closeLogin,
      refreshSession,
      logout,
    }),
    [closeLogin, isLoggingOut, logout, openLogin, refreshSession, status, user],
  );

  return (
    <StorefrontCustomerAuthContext.Provider value={value}>
      {children}

      <CustomerLoginDialog
        open={isLoginOpen}
        mobile={mobile}
        otp={otp}
        error={error}
        step={step}
        isRequesting={isRequesting}
        isVerifying={isVerifying}
        resendRemainingSeconds={resendRemainingSeconds}
        onClose={closeLogin}
        onMobileChange={(value) => {
          setMobile(value);
          setError(null);
        }}
        onOtpChange={(value) => {
          setOtp(value);
          setError(null);
        }}
        onRequestOtp={() => void requestOtp()}
        onVerifyOtp={() => void verifyOtp()}
        onBack={() => {
          setStep('mobile');
          setOtp('');
          setError(null);
          setResendAvailableAtMs(null);
        }}
      />
    </StorefrontCustomerAuthContext.Provider>
  );
}

export function useStorefrontCustomerAuth() {
  const context = useContext(StorefrontCustomerAuthContext);

  if (!context) {
    throw new Error('useStorefrontCustomerAuth must be used inside StorefrontCustomerAuthProvider');
  }

  return context;
}
