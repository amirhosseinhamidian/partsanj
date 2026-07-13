'use client';

import { useStorefrontCart } from '@/components/storefront/cart/storefront-cart-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import type {
  StorefrontCart,
  StorefrontCartAvailabilityReason,
  StorefrontCartFitmentStatus,
  StorefrontCartItem,
} from '@/lib/storefront/cart/cart.types';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import { formatPrice } from '@/lib/utils/price';
import {
  CarFront,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Minus,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';

function buildProductHref(item: StorefrontCartItem): string {
  const searchParams = new URLSearchParams();

  if (item.vehicle) {
    searchParams.set('vehicleVariantId', item.vehicle.id);
    searchParams.set('vehicleMake', item.vehicle.model.make.slug);
    searchParams.set('vehicleModel', item.vehicle.model.slug);
  }

  const queryString = searchParams.toString();

  return queryString
    ? `/products/${item.product.slug}?${queryString}`
    : `/products/${item.product.slug}`;
}

function getAvailabilityReasonLabel(reason: StorefrontCartAvailabilityReason): string {
  const labels: Record<StorefrontCartAvailabilityReason, string> = {
    PRODUCT_INACTIVE: 'این محصول دیگر برای خرید فعال نیست',
    CHECK_AVAILABILITY: 'موجودی این محصول نیازمند استعلام است',
    OUT_OF_STOCK: 'این محصول در حال حاضر موجود نیست',
    INSUFFICIENT_STOCK: 'تعداد انتخاب‌شده بیشتر از موجودی فعلی است',
    PRICE_UNAVAILABLE: 'قیمت این محصول نیازمند استعلام است',
  };

  return labels[reason];
}

function getFitmentConfig(status: StorefrontCartFitmentStatus) {
  if (status === 'CONFIRMED') {
    return {
      title: 'سازگاری خودرو تأیید شده است',
      description: 'این قطعه برای خودروی انتخاب‌شده در سبد خرید ثبت شده است',
      wrapperClassName: 'border-success/30 bg-success-soft',
      iconClassName: 'bg-surface text-success',
      textClassName: 'text-success',
      icon: <CheckCircle2 className='size-4' />,
    };
  }

  if (status === 'REQUIRES_VERIFICATION') {
    return {
      title: 'تطابق اولیه ثبت شده است',
      description: 'مشخصات فنی این قطعه پیش از ارسال بررسی خواهد شد',
      wrapperClassName: 'border-warning/30 bg-warning-soft',
      iconClassName: 'bg-surface text-warning',
      textClassName: 'text-warning',
      icon: <TriangleAlert className='size-4' />,
    };
  }

  if (status === 'NOT_CONFIRMED') {
    return {
      title: 'سازگاری این قطعه تأیید نشده است',
      description: 'خودرو انتخاب شده، اما این قطعه در فهرست سازگاری‌های ثبت‌شده قرار ندارد',
      wrapperClassName: 'border-danger/30 bg-danger-soft',
      iconClassName: 'bg-surface text-danger',
      textClassName: 'text-danger',
      icon: <CircleAlert className='size-4' />,
    };
  }

  return {
    title: 'خودرو برای این آیتم انتخاب نشده است',
    description: 'برای بررسی دقیق‌تر سازگاری، می‌توانید خودرو را از صفحه محصول انتخاب کنید',
    wrapperClassName: 'border-info/30 bg-info-soft',
    iconClassName: 'bg-surface text-info',
    textClassName: 'text-info',
    icon: <CarFront className='size-4' />,
  };
}

function CartItemQuantityControl({
  quantity,
  isMutating,
  canPurchase,
  maxOrderQuantity,
  hasQuantityConflict,
  onDecreaseOrRemove,
  onIncrease,
}: {
  quantity: number;
  isMutating: boolean;
  canPurchase: boolean;
  maxOrderQuantity: number;
  hasQuantityConflict: boolean;
  onDecreaseOrRemove: () => void;
  onIncrease: () => void;
}) {
  const hasReachedMaximumQuantity =
    canPurchase && !hasQuantityConflict && maxOrderQuantity > 0 && quantity === maxOrderQuantity;

  const canIncrease =
    canPurchase && !isMutating && !hasQuantityConflict && quantity < maxOrderQuantity;

  const increaseButtonLabel = hasReachedMaximumQuantity
    ? 'حداکثر موجودی انتخاب شده است'
    : canPurchase
      ? 'افزایش تعداد'
      : 'افزایش تعداد در حال حاضر امکان‌پذیر نیست';

  return (
    <div className='flex max-w-full flex-col items-start gap-2'>
      <div className='flex shrink-0 items-center rounded-control border border-border bg-surface p-1'>
        <button
          type='button'
          disabled={isMutating}
          aria-label={quantity === 1 ? 'حذف از سبد خرید' : 'کاهش تعداد'}
          title={quantity === 1 ? 'حذف از سبد خرید' : 'کاهش تعداد'}
          onClick={onDecreaseOrRemove}
          className='grid size-10 place-items-center rounded-control text-foreground-secondary transition-colors hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-50'
        >
          {quantity === 1 ? <Trash2 className='size-4' /> : <Minus className='size-4' />}
        </button>

        <output
          aria-live='polite'
          className='numeric grid min-w-10 place-items-center text-base font-extrabold text-foreground'
        >
          {toPersianDigits(quantity)}
        </output>

        <button
          type='button'
          disabled={!canIncrease}
          aria-label={increaseButtonLabel}
          title={increaseButtonLabel}
          onClick={onIncrease}
          className='grid size-10 place-items-center rounded-control text-foreground-secondary transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50'
        >
          <Plus className='size-4' />
        </button>
      </div>

      {hasReachedMaximumQuantity ? (
        <p role='status' aria-live='polite' className='text-xs leading-5 font-bold text-warning'>
          حداکثر تعداد موجودی این محصول را انتخاب کرده‌اید.
        </p>
      ) : null}

      {hasQuantityConflict ? (
        <p role='alert' className='text-xs leading-5 font-bold text-danger'>
          {maxOrderQuantity > 0 ? (
            <>
              تعداد انتخاب‌شده بیشتر از موجودی فعلی است. حداکثر موجودی قابل سفارش{' '}
              {toPersianDigits(maxOrderQuantity)} عدد است.
            </>
          ) : (
            'این محصول در حال حاضر موجودی قابل سفارش ندارد.'
          )}
        </p>
      ) : null}
    </div>
  );
}

function CartItemWarnings({ item }: { item: StorefrontCartItem }) {
  const hasAvailabilityWarning = !item.availability.canPurchase;
  const currentEffectivePriceToman = item.price.currentEffectivePriceToman;
  const hasPriceChanged = item.price.hasPriceChanged && currentEffectivePriceToman !== null;

  if (!hasAvailabilityWarning && !hasPriceChanged) {
    return null;
  }

  return (
    <div className='mt-4 space-y-2'>
      {hasAvailabilityWarning ? (
        <div className='flex gap-2 rounded-control border border-danger/30 bg-danger-soft p-3'>
          <CircleAlert className='mt-0.5 size-4 shrink-0 text-danger' />

          <div>
            <p className='text-xs font-extrabold text-danger'>این آیتم فعلاً قابل ثبت سفارش نیست</p>

            <ul className='mt-1 space-y-1 text-xs leading-5 text-foreground-secondary'>
              {item.availability.reasons.map((reason) => (
                <li key={reason}>{getAvailabilityReasonLabel(reason)}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {hasPriceChanged ? (
        <div className='flex gap-2 rounded-control border border-warning/30 bg-warning-soft p-3'>
          <TriangleAlert className='mt-0.5 size-4 shrink-0 text-warning' />

          <p className='text-xs leading-5 text-foreground-secondary'>
            قیمت این محصول به‌روزرسانی شده است؛ قیمت قبلی{' '}
            <span className='numeric font-bold text-foreground'>
              {formatPrice(item.price.snapshotEffectivePriceToman)}
            </span>{' '}
            و قیمت فعلی{' '}
            <span className='numeric font-bold text-foreground'>
              {currentEffectivePriceToman !== null
                ? formatPrice(currentEffectivePriceToman)
                : 'نامشخص'}
            </span>{' '}
            است
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CartItemFitment({ item }: { item: StorefrontCartItem }) {
  const config = getFitmentConfig(item.fitment.status);

  return (
    <div className={cn('mt-4 rounded-control border p-3', config.wrapperClassName)}>
      <div className='flex gap-2'>
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-control',
            config.iconClassName,
          )}
        >
          {config.icon}
        </span>

        <div className='min-w-0'>
          <p className={cn('text-xs font-extrabold', config.textClassName)}>{config.title}</p>

          <p className='mt-1 text-xs leading-5 text-foreground-secondary'>{config.description}</p>

          {item.vehicle ? (
            <p className='mt-2 text-xs font-bold text-foreground'>
              {item.vehicle.model.make.name} · {item.vehicle.model.name} · {item.vehicle.name}
            </p>
          ) : null}

          {item.fitment.notes ? (
            <p className='mt-2 text-xs leading-5 text-foreground-secondary'>{item.fitment.notes}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CartItemCard({
  item,
  isMutating,
  onDecreaseOrRemove,
  onIncrease,
}: {
  item: StorefrontCartItem;
  isMutating: boolean;
  onDecreaseOrRemove: (item: StorefrontCartItem) => void;
  onIncrease: (item: StorefrontCartItem) => void;
}) {
  const productHref = buildProductHref(item);
  const currentPrice = item.price.currentEffectivePriceToman;

  return (
    <article className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
      <div className='flex min-w-0 gap-4 p-4 sm:p-5'>
        <Link href={productHref} className='shrink-0' aria-label={`مشاهده ${item.product.name}`}>
          <ImageUrlPreview
            src={item.product.image?.url ?? null}
            alt={item.product.image?.alt ?? item.product.name}
            emptyLabel='تصویر ندارد'
            className='size-24 rounded-control border-border bg-surface-muted sm:size-28'
            imageClassName='object-contain p-2'
          />
        </Link>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-xs font-semibold text-foreground-muted'>
                {item.product.brand.name}
              </p>

              <Link
                href={productHref}
                className='mt-1 block text-base leading-7 font-extrabold text-foreground transition-colors hover:text-brand'
              >
                {item.product.name}
              </Link>

              <p dir='ltr' className='mt-1 text-xs font-bold text-foreground-muted'>
                {item.product.sku}
              </p>
            </div>

            {item.price.discountPercent > 0 ? (
              <span className='rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger'>
                {toPersianDigits(item.price.discountPercent)}٪ تخفیف
              </span>
            ) : null}
          </div>

          {item.product.shortDescription ? (
            <p className='mt-3 text-xs leading-6 text-foreground-secondary'>
              {item.product.shortDescription}
            </p>
          ) : null}

          <CartItemFitment item={item} />
          <CartItemWarnings item={item} />
        </div>
      </div>

      <div className='flex flex-wrap items-start justify-between gap-4 border-t border-border bg-surface-muted px-4 py-4 sm:px-5'>
        <CartItemQuantityControl
          quantity={item.quantity}
          isMutating={isMutating}
          canPurchase={item.availability.canPurchase}
          maxOrderQuantity={item.availability.maxOrderQuantity}
          hasQuantityConflict={item.availability.hasQuantityConflict}
          onDecreaseOrRemove={() => onDecreaseOrRemove(item)}
          onIncrease={() => onIncrease(item)}
        />

        <div className='text-end'>
          {item.price.hasPriceChanged ? (
            <p className='numeric text-xs text-foreground-muted line-through'>
              {formatPrice(item.price.snapshotEffectivePriceToman)}
            </p>
          ) : null}

          <p className='text-xs font-semibold text-foreground-muted'>جمع این آیتم</p>

          <p className='numeric mt-1 text-base font-extrabold text-foreground'>
            {item.lineTotalToman !== null
              ? formatPrice(item.lineTotalToman)
              : currentPrice !== null
                ? formatPrice(currentPrice * item.quantity)
                : 'نیازمند استعلام'}
          </p>
        </div>
      </div>
    </article>
  );
}

function CartSummary({ cart }: { cart: StorefrontCart }) {
  /**
   * hasQuantityConflict را مستقل از canPurchase هم بررسی می‌کنیم تا حتی اگر
   * پاسخ قدیمی API یا mapping ناقص باشد، سفارش با تعداد بیش از موجودی ادامه پیدا نکند.
   */
  const hasBlockingItems = cart.items.some(
    (item) => !item.availability.canPurchase || item.availability.hasQuantityConflict,
  );

  const canStartCheckout = cart.items.length > 0 && !hasBlockingItems;

  const hasFitmentRisks = cart.items.some(
    (item) =>
      item.fitment.status === 'NOT_CONFIRMED' || item.fitment.status === 'REQUIRES_VERIFICATION',
  );

  return (
    <>
      <aside className='hidden h-fit self-start rounded-card border border-border bg-surface p-5 shadow-panel xl:sticky xl:top-24 xl:block'>
        <div className='flex items-center gap-2'>
          <ShoppingCart className='size-5 text-brand' />
          <h2 className='text-lg font-extrabold text-foreground'>خلاصه سفارش</h2>
        </div>

        <dl className='mt-5 space-y-3 text-sm'>
          <div className='flex items-center justify-between gap-4'>
            <dt className='text-foreground-secondary'>کالاهای آماده خرید</dt>
            <dd className='numeric font-extrabold text-foreground'>
              {toPersianDigits(cart.summary.purchasableItemCount)}
            </dd>
          </div>

          <div className='border-t border-border pt-4'>
            <div className='flex items-end justify-between gap-4'>
              <dt className='text-sm font-extrabold text-foreground'>جمع کالاها</dt>
              <dd className='numeric text-xl font-extrabold text-foreground'>
                {formatPrice(cart.summary.subtotalToman)}
              </dd>
            </div>
          </div>
        </dl>

        {hasBlockingItems ? (
          <div className='mt-5 rounded-control border border-danger/30 bg-danger-soft p-3'>
            <p className='text-xs leading-6 text-danger'>
              برخی از آیتم‌ها فعلاً قابل ثبت سفارش نیستند و در جمع نهایی لحاظ نشده‌اند
            </p>
          </div>
        ) : null}

        {hasFitmentRisks ? (
          <div className='mt-3 rounded-control border border-warning/30 bg-warning-soft p-3'>
            <p className='text-xs leading-6 text-foreground-secondary'>
              یک یا چند قطعه نیازمند بررسی سازگاری خودرو هستند؛ این وضعیت مانع ثبت سفارش نیست اما
              پیش از ارسال کنترل می‌شود
            </p>
          </div>
        ) : null}

        {canStartCheckout ? (
          <Link
            href='/checkout'
            className='mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90'
          >
            ادامه ثبت سفارش
            <ChevronLeft className='size-4' />
          </Link>
        ) : (
          <Button type='button' fullWidth disabled className='mt-5' iconEnd={<ChevronLeft />}>
            ادامه ثبت سفارش
          </Button>
        )}
      </aside>

      <div className='fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-floating backdrop-blur xl:hidden'>
        <div className='mx-auto w-full max-w-xl'>
          {hasBlockingItems ? (
            <p className='mb-2 text-center text-xs font-semibold text-danger'>
              برخی آیتم‌ها قابل ثبت سفارش نیستند
            </p>
          ) : hasFitmentRisks ? (
            <p className='mb-2 text-center text-xs font-semibold text-warning'>
              یک یا چند قطعه نیازمند بررسی سازگاری است
            </p>
          ) : null}

          <div className='flex items-center gap-3'>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-semibold text-foreground-muted'>جمع کالاها</p>
              <p className='numeric mt-1 text-lg font-extrabold text-foreground'>
                {formatPrice(cart.summary.subtotalToman)}
              </p>
            </div>

            {canStartCheckout ? (
              <Link
                href='/checkout'
                className='inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90'
              >
                ادامه سفارش
                <ChevronLeft className='size-4' />
              </Link>
            ) : (
              <Button
                type='button'
                disabled
                className='h-12 shrink-0 px-4'
                iconEnd={<ChevronLeft />}
              >
                ادامه سفارش
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyCart() {
  return (
    <div className='rounded-card border border-dashed border-border bg-surface p-8 text-center shadow-panel sm:p-12'>
      <span className='mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-brand'>
        <ShoppingCart className='size-8' />
      </span>

      <h1 className='mt-5 text-xl font-extrabold text-foreground'>سبد خرید شما خالی است</h1>

      <p className='mx-auto mt-3 max-w-md text-sm leading-7 text-foreground-secondary'>
        قطعات موردنیاز خودرو را پیدا کنید و از صفحه جزئیات محصول به سبد خرید اضافه کنید
      </p>

      <Link
        href='/products'
        className='mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90'
      >
        مشاهده قطعات
        <ChevronLeft className='size-4' />
      </Link>
    </div>
  );
}

function CartPageSkeleton() {
  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='h-9 w-44 animate-pulse rounded bg-surface-muted' />

      <div className='mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <div className='space-y-4'>
          {[1, 2].map((item) => (
            <div key={item} className='h-60 animate-pulse rounded-card bg-surface-muted' />
          ))}
        </div>

        <div className='h-72 animate-pulse rounded-card bg-surface-muted' />
      </div>
    </div>
  );
}

export function StorefrontCartPageClient() {
  const { cart, isLoading, isMutating, cartLoadError, reloadCart, updateItemQuantity, removeItem } =
    useStorefrontCart();

  async function handleIncreaseQuantity(item: StorefrontCartItem) {
    if (
      isMutating ||
      !item.availability.canPurchase ||
      item.availability.hasQuantityConflict ||
      item.quantity >= item.availability.maxOrderQuantity
    ) {
      return;
    }

    try {
      await updateItemQuantity(item.id, {
        quantity: item.quantity + 1,
      });
    } catch {
      // Toast در Cart Provider نمایش داده می‌شود.
    }
  }

  async function handleDecreaseOrRemove(item: StorefrontCartItem) {
    if (isMutating) {
      return;
    }

    try {
      if (item.quantity === 1) {
        await removeItem(item.id);
        return;
      }

      await updateItemQuantity(item.id, {
        quantity: item.quantity - 1,
      });
    } catch {
      // Toast در Cart Provider نمایش داده می‌شود.
    }
  }

  if (isLoading) {
    return <CartPageSkeleton />;
  }

  if (cartLoadError) {
    return (
      <div className='mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8'>
        <div className='rounded-card border border-danger/30 bg-danger-soft p-6 text-center'>
          <CircleAlert className='mx-auto size-8 text-danger' />

          <h1 className='mt-4 text-xl font-extrabold text-foreground'>دریافت سبد خرید انجام نشد</h1>

          <p className='mx-auto mt-3 max-w-lg text-sm leading-7 text-foreground-secondary'>
            {cartLoadError}
          </p>

          <Button
            type='button'
            variant='outline'
            className='mt-6'
            iconStart={<RefreshCw />}
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
      <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-7xl px-4 pt-8 pb-32 sm:px-6 lg:px-8 xl:py-8'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 text-sm text-foreground-muted'>
            <Link href='/' className='transition-colors hover:text-brand'>
              خانه
            </Link>

            <ChevronLeft className='size-4' />
            <span>سبد خرید</span>
          </div>

          <h1 className='mt-3 text-2xl font-extrabold text-foreground sm:text-3xl'>سبد خرید شما</h1>
        </div>

        <Badge>{toPersianDigits(cart.summary.itemCount)} کالا در سبد خرید</Badge>
      </div>

      <div className='mt-8 grid min-w-0 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <section className='min-w-0 space-y-4'>
          {cart.items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              isMutating={isMutating}
              onDecreaseOrRemove={(currentItem) => void handleDecreaseOrRemove(currentItem)}
              onIncrease={(currentItem) => void handleIncreaseQuantity(currentItem)}
            />
          ))}
        </section>

        <CartSummary cart={cart} />
      </div>
    </div>
  );
}
