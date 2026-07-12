'use client';

import { Button } from '@/components/ui/button';
import { useStorefrontCart } from '@/components/storefront/cart/storefront-cart-provider';
import { useStorefrontSettings } from '@/components/storefront/layout/storefront-settings-provider';
import type { StorefrontProductDetail } from '@/lib/storefront/catalog/catalog.types';
import type { StorefrontVehicleVariant } from '@/lib/storefront/vehicles/vehicle.types';
import { CarFront, ChevronLeft, Headphones, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';
import { formatPrice } from '@/lib/utils/price';

type SelectedVehicle = {
  makeName: string;
  modelName: string;
  variant: StorefrontVehicleVariant;
};

type ProductPurchasePanelProps = {
  product: StorefrontProductDetail;
  selectedVehicle: SelectedVehicle | null;
  onSelectVehicle: () => void;
};

function CartQuantityControl({
  quantity,
  isMutating,
  canIncrease,
  onDecreaseOrRemove,
  onIncrease,
  className = '',
}: {
  quantity: number;
  isMutating: boolean;
  canIncrease: boolean;
  onDecreaseOrRemove: () => void;
  onIncrease: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center rounded-control border border-border bg-surface p-1 ${className}`}
    >
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
        className='numeric grid min-w-10 place-items-center text-sm font-extrabold text-foreground'
      >
        {toPersianDigits(quantity)}
      </output>

      <button
        type='button'
        disabled={!canIncrease}
        aria-label='افزایش تعداد'
        title='افزایش تعداد'
        onClick={onIncrease}
        className='grid size-10 place-items-center rounded-control text-foreground-secondary transition-colors hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-50'
      >
        <Plus className='size-4' />
      </button>
    </div>
  );
}

function PriceBlock({
  product,
  displayedPrice,
  showPrices,
  compact = false,
}: {
  product: StorefrontProductDetail;
  displayedPrice: number | null;
  showPrices: boolean;
  compact?: boolean;
}) {
  if (!showPrices) {
    return (
      <div>
        <p
          className={
            compact
              ? 'text-sm font-extrabold text-foreground'
              : 'text-base font-extrabold text-foreground'
          }
        >
          قیمت با استعلام
        </p>

        {!compact ? (
          <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
            برای دریافت قیمت این قطعه با پشتیبانی تماس بگیرید.
          </p>
        ) : null}
      </div>
    );
  }

  if (displayedPrice === null) {
    return (
      <div>
        <p
          className={
            compact
              ? 'text-sm font-extrabold text-foreground'
              : 'text-base font-extrabold text-foreground'
          }
        >
          قیمت نیازمند استعلام است
        </p>

        {!compact ? (
          <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
            قیمت این قطعه پس از بررسی توسط پشتیبانی اعلام می‌شود.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {product.isSaleActive && product.priceToman !== null ? (
        <div className='flex flex-wrap items-center gap-3'>
          <span className='numeric text-sm text-foreground-muted line-through'>
            {formatPrice(product.priceToman)}
          </span>

          <span className='rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger'>
            {toPersianDigits(product.discountPercent)}٪ تخفیف
          </span>
        </div>
      ) : null}

      <p
        className={
          compact
            ? 'numeric mt-0.5 text-base font-extrabold text-foreground'
            : 'numeric mt-2 text-2xl font-extrabold text-foreground'
        }
      >
        {formatPrice(displayedPrice)}
      </p>
    </>
  );
}

function SupportButton({
  href,
  isExternal,
  phoneDisplay,
  className = '',
}: {
  href: string;
  isExternal: boolean;
  phoneDisplay?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      {phoneDisplay ? (
        <p className='text-md mb-2 text-center font-bold text-foreground md:mb-4 lg:text-xl'>
          شماره پشتیبانی: {toPersianDigits(phoneDisplay)}
        </p>
      ) : null}

      <Link
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
        className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-brand-foreground transition hover:bg-brand-hover'
      >
        <Headphones className='size-4' />
        تماس با پشتیبانی
        <ChevronLeft className='size-4' />
      </Link>
    </div>
  );
}

function getFirstNonEmpty(...values: Array<string | null | undefined>) {
  const value = values.find((item) => typeof item === 'string' && item.trim().length > 0);

  return value?.trim() ?? null;
}

function normalizeTelHref(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d+]/g, '');

  return normalized ? `tel:${normalized}` : null;
}

export function ProductPurchasePanel({
  product,
  selectedVehicle,
  onSelectVehicle,
}: ProductPurchasePanelProps) {
  const settings = useStorefrontSettings();
  const { cart, addItem, updateItemQuantity, removeItem, isMutating } = useStorefrontCart();

  const rawDisplayedPrice = product.effectivePriceToman ?? product.priceToman ?? null;
  const displayedPrice = settings.showPrices ? rawDisplayedPrice : null;

  const selectedVehicleVariantId = selectedVehicle?.variant.id ?? null;

  const cartItem = useMemo(
    () =>
      cart?.items.find(
        (item) =>
          item.product.id === product.id && (item.vehicle?.id ?? null) === selectedVehicleVariantId,
      ) ?? null,
    [cart?.items, product.id, selectedVehicleVariantId],
  );

  const primarySupportPhone = getFirstNonEmpty(settings.supportPhone, settings.supportMobile);
  const primarySupportPhoneHref = normalizeTelHref(primarySupportPhone);

  const fallbackSupportHref =
    getFirstNonEmpty(
      settings.whatsappUrl,
      settings.telegramUrl,
      settings.baleUrl,
      settings.instagramUrl,
    ) ?? '/contact';

  const supportHref = primarySupportPhoneHref ?? fallbackSupportHref;
  const isExternalSupportHref = supportHref.startsWith('http');

  const supportPhoneDisplay = primarySupportPhone;

  const isOrderingAvailable =
    settings.storeEnabled && settings.orderingEnabled && settings.showPrices;

  const shouldShowSupportCta = !settings.showPrices || rawDisplayedPrice === null;

  const isUnavailable =
    !isOrderingAvailable || product.stockStatus === 'OUT_OF_STOCK' || rawDisplayedPrice === null;

  const canIncrease =
    cartItem !== null &&
    isOrderingAvailable &&
    !isMutating &&
    cartItem.availability.canPurchase &&
    cartItem.quantity < 99;

  function getPurchaseMessage() {
    if (!settings.storeEnabled) {
      return 'فروشگاه موقتاً در حال بروزرسانی است.';
    }

    if (!settings.orderingEnabled) {
      return 'ثبت سفارش در حال حاضر غیرفعال است.';
    }

    if (!settings.showPrices) {
      return 'برای دریافت قیمت این قطعه با پشتیبانی تماس بگیرید.';
    }

    if (product.stockStatus === 'OUT_OF_STOCK') {
      return 'این قطعه در حال حاضر موجود نیست.';
    }

    if (rawDisplayedPrice === null) {
      return 'قیمت این قطعه نیازمند استعلام است.';
    }

    return selectedVehicle
      ? 'خودروی انتخاب‌شده همراه این قطعه در سبد خرید ثبت می‌شود'
      : 'می‌توانید قطعه را بدون انتخاب خودرو به سبد خرید اضافه کنید';
  }

  async function handleAddToCart() {
    if (isUnavailable) {
      return;
    }

    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        vehicleVariantId: selectedVehicle?.variant.id ?? undefined,
      });
    } catch {
      // Toast در Cart Provider نمایش داده می‌شود
    }
  }

  async function handleIncreaseQuantity() {
    if (!cartItem || !canIncrease) {
      return;
    }

    try {
      await updateItemQuantity(cartItem.id, {
        quantity: cartItem.quantity + 1,
      });
    } catch {
      // Toast در Cart Provider نمایش داده می‌شود
    }
  }

  async function handleDecreaseOrRemove() {
    if (!cartItem || !isOrderingAvailable) {
      return;
    }

    try {
      if (cartItem.quantity === 1) {
        await removeItem(cartItem.id);
        return;
      }

      await updateItemQuantity(cartItem.id, {
        quantity: cartItem.quantity - 1,
      });
    } catch {
      // Toast در Cart Provider نمایش داده می‌شود
    }
  }

  return (
    <>
      <div className='mt-6 hidden rounded-card border border-border bg-surface-muted p-5 lg:block'>
        <PriceBlock
          product={product}
          displayedPrice={displayedPrice}
          showPrices={settings.showPrices}
        />

        <div className='mt-5 rounded-control border border-border bg-surface p-4'>
          <div className='flex gap-3'>
            <span className='grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <CarFront className='size-5' />
            </span>

            <div className='min-w-0 flex-1'>
              <p className='text-sm font-extrabold text-foreground'>
                {selectedVehicle ? 'خودروی انتخاب‌شده' : 'بررسی سازگاری با خودرو'}
              </p>

              {selectedVehicle ? (
                <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                  {selectedVehicle.makeName} · {selectedVehicle.modelName} ·{' '}
                  {selectedVehicle.variant.name}
                </p>
              ) : (
                <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                  اختیاری است، اما احتمال انتخاب قطعه نامناسب را کاهش می‌دهد
                </p>
              )}

              <Button
                type='button'
                size='sm'
                variant='outline'
                className='mt-3'
                iconStart={<CarFront />}
                onClick={onSelectVehicle}
              >
                {selectedVehicle ? 'تغییر خودرو' : 'انتخاب خودرو برای تطبیق'}
              </Button>
            </div>
          </div>
        </div>

        {shouldShowSupportCta ? (
          <>
            <SupportButton
              href={supportHref}
              isExternal={isExternalSupportHref}
              phoneDisplay={supportPhoneDisplay}
              className='mt-5'
            />

            <p className='mt-3 text-center text-xs leading-6 text-foreground-muted'>
              {getPurchaseMessage()}
            </p>
          </>
        ) : cartItem && isOrderingAvailable ? (
          <>
            <div className='mt-5 rounded-control border border-success/30 bg-success-soft p-4'>
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div>
                  <p className='text-sm font-extrabold text-success'>این قطعه در سبد خرید شماست</p>

                  <p className='mt-1 text-xs text-foreground-secondary'>
                    تعداد موردنظر را از همین بخش مدیریت کنید
                  </p>
                </div>

                <CartQuantityControl
                  quantity={cartItem.quantity}
                  isMutating={isMutating}
                  canIncrease={canIncrease}
                  onDecreaseOrRemove={() => void handleDecreaseOrRemove()}
                  onIncrease={() => void handleIncreaseQuantity()}
                />
              </div>
            </div>

            <Link
              href='/cart'
              className='mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90'
            >
              <ShoppingCart className='size-4' />
              مشاهده سبد خرید
              <ChevronLeft className='size-4' />
            </Link>
          </>
        ) : (
          <>
            <Button
              type='button'
              fullWidth
              className='mt-5'
              iconStart={<ShoppingCart />}
              isLoading={isMutating}
              loadingLabel='در حال افزودن به سبد خرید'
              disabled={isUnavailable}
              onClick={() => void handleAddToCart()}
            >
              افزودن به سبد خرید
            </Button>

            <p className='mt-3 text-center text-xs leading-6 text-foreground-muted'>
              {getPurchaseMessage()}
            </p>
          </>
        )}
      </div>

      <div className='fixed inset-x-0 bottom-0 z-60 border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-floating backdrop-blur lg:hidden'>
        <div className='mx-auto w-full max-w-xl'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='min-w-0'>
              <PriceBlock
                product={product}
                displayedPrice={displayedPrice}
                showPrices={settings.showPrices}
                compact
              />
            </div>

            <button
              type='button'
              onClick={onSelectVehicle}
              className='inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-start text-xs font-bold text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand sm:max-w-[62%]'
            >
              <CarFront className='size-4 shrink-0' />

              <span className='truncate'>
                {selectedVehicle
                  ? `${selectedVehicle.modelName} · ${selectedVehicle.variant.name}`
                  : 'تطبیق خودرو اختیاری'}
              </span>

              <ChevronLeft className='size-4 shrink-0' />
            </button>
          </div>

          {shouldShowSupportCta ? (
            <SupportButton
              href={supportHref}
              isExternal={isExternalSupportHref}
              phoneDisplay={supportPhoneDisplay}
              className='mt-3'
            />
          ) : cartItem && isOrderingAvailable ? (
            <div className='mt-3 flex items-center gap-3'>
              <CartQuantityControl
                quantity={cartItem.quantity}
                isMutating={isMutating}
                canIncrease={canIncrease}
                onDecreaseOrRemove={() => void handleDecreaseOrRemove()}
                onIncrease={() => void handleIncreaseQuantity()}
              />

              <Link
                href='/cart'
                className='inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-control bg-brand px-3 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90'
              >
                <ShoppingCart className='size-4 shrink-0' />
                <span className='truncate'>مشاهده سبد خرید</span>
              </Link>
            </div>
          ) : (
            <Button
              type='button'
              fullWidth
              className='mt-3 h-12'
              iconStart={<ShoppingCart />}
              isLoading={isMutating}
              loadingLabel='در حال افزودن به سبد خرید'
              disabled={isUnavailable}
              onClick={() => void handleAddToCart()}
            >
              افزودن به سبد خرید
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
