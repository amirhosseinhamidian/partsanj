'use client';

import { AddressManager } from '@/components/storefront/customer-address/address-manager';
import { useStorefrontCart } from '@/components/storefront/cart/storefront-cart-provider';
import { useToast } from '@/components/providers/toast-provider';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { Textarea } from '@/components/ui/textarea';
import { storefrontOrderApi } from '@/lib/api/storefront-order-client';
import { ClientApiError } from '@/lib/api/web-client';
import type { StorefrontCustomerAddress } from '@/lib/storefront/customer-address/customer-address.types';
import { cn } from '@/lib/utils/cn';
import {
  CarFront,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  LogIn,
  MapPin,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useStorefrontCustomerAuth } from '../customer-auth/storefront-customer-auth-provider';
import { toPersianDigits } from '@/lib/utils/digits';
import { formatPrice } from '@/lib/utils/price';

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ثبت سفارش با خطا مواجه شد';
}

function getFitmentLabel(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: 'سازگاری تأییدشده',
        className: 'bg-success-soft text-success',
      };

    case 'REQUIRES_VERIFICATION':
      return {
        label: 'نیازمند بررسی فنی',
        className: 'bg-warning-soft text-warning',
      };

    case 'NOT_CONFIRMED':
      return {
        label: 'سازگاری تأیید نشده',
        className: 'bg-danger-soft text-danger',
      };

    default:
      return {
        label: 'بدون خودرو',
        className: 'bg-info-soft text-info',
      };
  }
}

function CheckoutCartReview() {
  const { cart } = useStorefrontCart();

  if (!cart) {
    return null;
  }

  return (
    <section className='rounded-card border border-border bg-surface p-5 shadow-panel'>
      <div className='flex items-center gap-2'>
        <PackageOpen className='size-5 text-brand' />

        <div>
          <h2 className='text-lg font-extrabold text-foreground'>اقلام سفارش</h2>

          <p className='mt-1 text-xs text-foreground-secondary'>
            قبل از ثبت سفارش، مشخصات کالاها را بررسی کنید
          </p>
        </div>
      </div>

      <div className='mt-5 divide-y divide-border'>
        {cart.items.map((item) => {
          const fitment = getFitmentLabel(item.fitment.status);

          return (
            <article key={item.id} className='flex min-w-0 gap-3 py-4 first:pt-0 last:pb-0'>
              <ImageUrlPreview
                src={item.product.image?.url ?? null}
                alt={item.product.image?.alt ?? item.product.name}
                emptyLabel='تصویر ندارد'
                className='size-16 shrink-0 rounded-control border-border bg-surface-muted'
                imageClassName='object-contain p-1.5'
              />

              <div className='min-w-0 flex-1'>
                <p className='text-xs font-semibold text-foreground-muted'>
                  {item.product.brand.name}
                </p>

                <p className='mt-1 line-clamp-2 text-sm leading-6 font-extrabold text-foreground'>
                  {item.product.name}
                </p>

                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <span className='text-xs text-foreground-secondary'>
                    تعداد: {toPersianDigits(item.quantity)}
                  </span>

                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-[10px] font-bold',
                      fitment.className,
                    )}
                  >
                    {fitment.label}
                  </span>
                </div>

                {item.vehicle ? (
                  <p className='mt-2 flex items-center gap-1 text-xs text-foreground-secondary'>
                    <CarFront className='size-3.5 shrink-0' />
                    {item.vehicle.model.make.name} · {item.vehicle.model.name} · {item.vehicle.name}
                  </p>
                ) : null}
              </div>

              <div className='shrink-0 text-end'>
                <p className='numeric text-sm font-extrabold text-foreground'>
                  {item.lineTotalToman !== null
                    ? formatPrice(item.lineTotalToman)
                    : 'نیازمند استعلام'}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CheckoutSummary({
  selectedAddress,
  isCustomerAuthenticated,
  isCreatingOrder,
  canCreateOrder,
  onCreateOrder,
}: {
  selectedAddress: StorefrontCustomerAddress | null;
  isCustomerAuthenticated: boolean;
  isCreatingOrder: boolean;
  canCreateOrder: boolean;
  onCreateOrder: () => void;
}) {
  const { cart } = useStorefrontCart();

  if (!cart) {
    return null;
  }

  return (
    <aside className='hidden h-fit self-start rounded-card border border-border bg-surface p-5 shadow-panel xl:sticky xl:top-24 xl:block'>
      <div className='flex items-center gap-2'>
        <ShoppingCart className='size-5 text-brand' />

        <h2 className='text-lg font-extrabold text-foreground'>خلاصه سفارش</h2>
      </div>

      <dl className='mt-5 space-y-3 text-sm'>
        <div className='flex items-center justify-between gap-4'>
          <dt className='text-foreground-secondary'>تعداد کالا</dt>

          <dd className='numeric font-extrabold text-foreground'>
            {toPersianDigits(cart.summary.itemCount)}
          </dd>
        </div>

        <div className='border-t border-border pt-4'>
          <div className='flex items-end justify-between gap-4'>
            <dt className='font-extrabold text-foreground'>مبلغ قابل پرداخت</dt>

            <dd className='numeric text-xl font-extrabold text-foreground'>
              {formatPrice(cart.summary.subtotalToman)}
            </dd>
          </div>
        </div>
      </dl>

      {!isCustomerAuthenticated ? (
        <div className='mt-5 rounded-control border border-warning/30 bg-warning-soft p-3'>
          <div className='flex gap-2'>
            <ShieldCheck className='mt-0.5 size-4 shrink-0 text-warning' />

            <p className='text-xs leading-6 text-foreground-secondary'>
              برای انتخاب آدرس، ثبت سفارش و ادامه پرداخت باید وارد حساب کاربری شوید
            </p>
          </div>
        </div>
      ) : selectedAddress ? (
        <div className='mt-5 rounded-control border border-success/30 bg-success-soft p-3'>
          <div className='flex gap-2'>
            <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-success' />

            <p className='text-xs leading-6 text-foreground-secondary'>
              آدرس «{selectedAddress.label}» برای ارسال سفارش انتخاب شده است
            </p>
          </div>
        </div>
      ) : (
        <div className='mt-5 rounded-control border border-warning/30 bg-warning-soft p-3'>
          <div className='flex gap-2'>
            <TriangleAlert className='mt-0.5 size-4 shrink-0 text-warning' />

            <p className='text-xs leading-6 text-foreground-secondary'>
              برای ادامه، یک آدرس تحویل انتخاب کنید
            </p>
          </div>
        </div>
      )}

      <Button
        type='button'
        fullWidth
        className='mt-5'
        disabled={isCustomerAuthenticated ? !canCreateOrder : false}
        isLoading={isCreatingOrder}
        loadingLabel='در حال ثبت سفارش'
        iconEnd={<ChevronLeft />}
        onClick={onCreateOrder}
      >
        {isCustomerAuthenticated ? 'ثبت سفارش و ادامه پرداخت' : 'ورود و ادامه'}
      </Button>

      <p className='mt-3 text-center text-xs leading-6 text-foreground-muted'>
        {isCustomerAuthenticated
          ? 'پس از ثبت سفارش، به مرحله پرداخت آنلاین هدایت می‌شوید'
          : 'برای ادامه فرآیند خرید، ابتدا وارد حساب کاربری شوید'}
      </p>
    </aside>
  );
}

export function StorefrontCheckoutPageClient() {
  const router = useRouter();
  const { toast } = useToast();

  const { cart, isLoading, cartLoadError, reloadCart } = useStorefrontCart();

  const [selectedAddress, setSelectedAddress] = useState<StorefrontCustomerAddress | null>(null);

  const [customerNote, setCustomerNote] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const { status: authStatus, openLogin } = useStorefrontCustomerAuth();

  const isCustomerAuthenticated = authStatus === 'authenticated';

  const hasUnavailableItems = useMemo(
    () => cart?.items.some((item) => !item.availability.canPurchase) ?? false,
    [cart],
  );

  const hasFitmentRisks = useMemo(
    () =>
      cart?.items.some(
        (item) =>
          item.fitment.status === 'NOT_CONFIRMED' ||
          item.fitment.status === 'REQUIRES_VERIFICATION',
      ) ?? false,
    [cart],
  );

  const canCreateOrder =
    isCustomerAuthenticated &&
    Boolean(cart?.items.length) &&
    Boolean(selectedAddress) &&
    !hasUnavailableItems &&
    !isCreatingOrder;

  const handleCreateOrder = useCallback(async () => {
    if (!isCustomerAuthenticated) {
      openLogin({
        returnTo: '/checkout',
      });

      return;
    }

    if (!selectedAddress || !canCreateOrder) {
      return;
    }

    setOrderError(null);
    setIsCreatingOrder(true);

    try {
      const response = await storefrontOrderApi.createFromCart({
        shippingAddressId: selectedAddress.id,
        customerNote: customerNote.trim() || null,
      });

      await reloadCart();

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'سفارش با موفقیت ثبت شد',
      });

      router.replace(`/orders/${response.data.id}`);
    } catch (error) {
      if (error instanceof ClientApiError && error.status === 401) {
        setIsAuthRequired(true);
      }

      setOrderError(getErrorMessage(error));
    } finally {
      setIsCreatingOrder(false);
    }
  }, [
    canCreateOrder,
    customerNote,
    isCustomerAuthenticated,
    openLogin,
    reloadCart,
    router,
    selectedAddress,
    toast,
  ]);

  if (isLoading || authStatus === 'loading') {
    return (
      <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='h-8 w-48 animate-pulse rounded bg-surface-muted' />

        <div className='mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='space-y-5'>
            <div className='h-72 animate-pulse rounded-card bg-surface-muted' />
            <div className='h-64 animate-pulse rounded-card bg-surface-muted' />
          </div>

          <div className='h-72 animate-pulse rounded-card bg-surface-muted' />
        </div>
      </div>
    );
  }

  if (cartLoadError) {
    return (
      <div className='mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8'>
        <div className='rounded-card border border-danger/30 bg-danger-soft p-6 text-center'>
          <CircleAlert className='mx-auto size-8 text-danger' />

          <h1 className='mt-4 text-xl font-extrabold text-foreground'>دریافت سبد خرید انجام نشد</h1>

          <p className='mt-2 text-sm leading-7 text-foreground-secondary'>{cartLoadError}</p>

          <Button
            type='button'
            variant='outline'
            className='mt-5'
            iconStart={<RefreshCw className='size-4' />}
            onClick={() => void reloadCart()}
          >
            تلاش مجدد
          </Button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className='mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8'>
        <div className='rounded-card border border-dashed border-border bg-surface p-8 text-center shadow-panel sm:p-12'>
          <span className='mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-brand'>
            <ShoppingCart className='size-8' />
          </span>

          <h1 className='mt-5 text-xl font-extrabold text-foreground'>سبد خرید شما خالی است</h1>

          <p className='mx-auto mt-3 max-w-md text-sm leading-7 text-foreground-secondary'>
            ابتدا قطعات موردنیازتان را به سبد خرید اضافه کنید
          </p>

          <Link
            href='/products'
            className='mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90'
          >
            مشاهده قطعات
            <ChevronLeft className='size-4' />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-7xl px-4 pt-8 pb-40 sm:px-6 lg:px-8 xl:py-8'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 text-sm text-foreground-muted'>
            <Link href='/cart' className='transition-colors hover:text-brand'>
              سبد خرید
            </Link>

            <ChevronLeft className='size-4' />

            <span>ثبت سفارش</span>
          </div>

          <h1 className='mt-3 text-2xl font-extrabold text-foreground sm:text-3xl'>ثبت سفارش</h1>
        </div>

        <Link
          href='/cart'
          className='hover:text-brand-strong inline-flex items-center gap-1 text-sm font-bold text-brand transition-colors'
        >
          بازگشت به سبد خرید
          <ChevronLeft className='size-4' />
        </Link>
      </div>

      {hasUnavailableItems ? (
        <div className='mt-6 flex gap-3 rounded-card border border-danger/30 bg-danger-soft p-4'>
          <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

          <div>
            <p className='font-extrabold text-danger'>
              برخی آیتم‌های سبد خرید قابل ثبت سفارش نیستند
            </p>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
              برای ادامه، به سبد خرید بازگردید و آیتم‌های ناموجود یا نیازمند استعلام را اصلاح کنید
            </p>
          </div>
        </div>
      ) : null}

      {hasFitmentRisks ? (
        <div className='mt-6 flex gap-3 rounded-card border border-warning/30 bg-warning-soft p-4'>
          <TriangleAlert className='mt-0.5 size-5 shrink-0 text-warning' />

          <div>
            <p className='font-extrabold text-foreground'>بررسی سازگاری خودرو</p>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
              برخی قطعات نیازمند بررسی فنی هستند. این وضعیت مانع ثبت سفارش نیست و پیش از ارسال کنترل
              می‌شود
            </p>
          </div>
        </div>
      ) : null}

      {orderError ? (
        <div className='mt-6 flex gap-3 rounded-card border border-danger/30 bg-danger-soft p-4'>
          <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

          <div>
            <p className='font-extrabold text-danger'>ثبت سفارش انجام نشد</p>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>{orderError}</p>
          </div>
        </div>
      ) : null}

      <div className='mt-8 grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='min-w-0 space-y-6'>
          {isCustomerAuthenticated ? (
            <AddressManager
              selectedAddressId={selectedAddress?.id ?? null}
              onSelectedAddressChange={setSelectedAddress}
              onAuthRequired={() =>
                openLogin({
                  returnTo: '/checkout',
                })
              }
              selectionMode
              title='آدرس ارسال سفارش'
              description='آدرس تحویل سفارش را انتخاب کنید یا آدرس جدیدی ثبت کنید'
            />
          ) : (
            <section className='rounded-card border border-warning/30 bg-warning-soft p-6 shadow-panel'>
              <div className='flex gap-3'>
                <span className='grid size-11 shrink-0 place-items-center rounded-control bg-surface text-warning'>
                  <ShieldCheck className='size-5' />
                </span>

                <div>
                  <h2 className='text-lg font-extrabold text-foreground'>
                    ورود به حساب کاربری لازم است
                  </h2>

                  <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
                    برای ثبت آدرس، ثبت سفارش و پرداخت آنلاین باید وارد حساب مشتری شوید
                  </p>

                  <Button
                    type='button'
                    className='mt-5'
                    iconStart={<LogIn className='size-4' />}
                    onClick={() =>
                      openLogin({
                        returnTo: '/checkout',
                      })
                    }
                  >
                    ورود یا ثبت‌نام
                  </Button>
                </div>
              </div>
            </section>
          )}

          <section className='rounded-card border border-border bg-surface p-5 shadow-panel'>
            <div className='flex items-center gap-2'>
              <MapPin className='size-5 text-brand' />

              <div>
                <h2 className='text-lg font-extrabold text-foreground'>توضیحات سفارش</h2>

                <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                  اختیاری؛ مثلاً زمان مناسب تماس یا تحویل
                </p>
              </div>
            </div>

            <FormField label='یادداشت مشتری'>
              {({ id, labelId, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  rows={4}
                  value={customerNote}
                  maxLength={1000}
                  placeholder='توضیحات شما برای سفارش'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  onChange={(event) => setCustomerNote(event.target.value)}
                />
              )}
            </FormField>
          </section>

          <CheckoutCartReview />
        </div>

        <CheckoutSummary
          selectedAddress={selectedAddress}
          isCustomerAuthenticated={isCustomerAuthenticated}
          isCreatingOrder={isCreatingOrder}
          canCreateOrder={canCreateOrder}
          onCreateOrder={() => void handleCreateOrder()}
        />
      </div>

      <div className='fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-floating backdrop-blur xl:hidden'>
        <div className='mx-auto flex w-full max-w-xl items-center gap-3'>
          <div className='min-w-0 flex-1'>
            <p className='text-xs font-semibold text-foreground-muted'>مبلغ قابل پرداخت</p>

            <p className='numeric mt-1 text-lg font-extrabold text-foreground'>
              {formatPrice(cart.summary.subtotalToman)}
            </p>
          </div>

          <Button
            type='button'
            className='h-12 shrink-0 px-4'
            disabled={isCustomerAuthenticated ? !canCreateOrder : false}
            isLoading={isCreatingOrder}
            loadingLabel='در حال ثبت'
            iconEnd={<ChevronLeft />}
            onClick={() => void handleCreateOrder()}
          >
            {isCustomerAuthenticated ? 'ثبت سفارش' : 'ورود و ادامه'}
          </Button>
        </div>
      </div>
    </div>
  );
}
