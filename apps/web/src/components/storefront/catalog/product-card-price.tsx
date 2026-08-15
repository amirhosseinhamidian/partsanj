'use client';

import { useStorefrontSettings } from '@/components/storefront/layout/storefront-settings-provider';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/price';

type ProductCardPriceProduct = {
  priceToman: number | null;
  effectivePriceToman?: number | null;
  isSaleActive?: boolean;
};

type ProductCardPriceVariant = 'home-row' | 'product-list';

type ProductCardPriceProps = {
  product: ProductCardPriceProduct;
  variant?: ProductCardPriceVariant;
  className?: string;
  showOriginalPrice?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function ProductCardPrice({
  product,
  variant = 'product-list',
  className,
  showOriginalPrice = true,
}: ProductCardPriceProps) {
  const settings = useStorefrontSettings();

  const displayedPrice = product.effectivePriceToman ?? product.priceToman ?? null;

  const hasActiveSale =
    Boolean(product.isSaleActive) &&
    product.priceToman !== null &&
    displayedPrice !== null &&
    product.priceToman > displayedPrice;

  if (!settings.showPrices) {
    if (variant === 'home-row') {
      return (
        <div className={cn('flex min-h-[52px] items-center text-right', className)}>
          <span className='text-sm font-extrabold text-brand'>استعلام قیمت</span>
        </div>
      );
    }

    return (
      <div className={cn('flex min-h-[58px] flex-col gap-1 text-right', className)}>
        <Badge variant='brand' size='lg' dot>
          قیمت با استعلام
        </Badge>

        <span className='mt-1 text-xs leading-5 font-semibold text-foreground-secondary'>
          برای دریافت قیمت با پشتیبانی تماس بگیرید
        </span>
      </div>
    );
  }

  if (displayedPrice === null) {
    return (
      <div
        className={cn(
          'flex min-h-[52px] items-center text-right',
          variant === 'product-list' && 'justify-end',
          className,
        )}
      >
        <span
          className={cn(
            'font-semibold text-foreground-secondary',
            variant === 'home-row' ? 'text-sm' : 'text-sm',
          )}
        >
          قیمت نیازمند استعلام است
        </span>
      </div>
    );
  }

  if (variant === 'home-row') {
    return (
      <div
        className={cn('flex min-h-[52px] flex-col items-start justify-end text-right', className)}
      >
        <span className='numeric text-lg leading-6 font-extrabold text-brand'>
          {formatPrice(displayedPrice)}
        </span>

        {showOriginalPrice && hasActiveSale ? (
          <span className='numeric mt-1 text-xs leading-4 font-medium text-foreground-muted line-through decoration-1'>
            {formatPrice(product.priceToman as number)}
          </span>
        ) : (
          <span aria-hidden='true' className='mt-1 block h-4' />
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-[58px] flex-col items-end justify-end text-right', className)}>
      <span className='numeric text-lg leading-6 font-extrabold text-foreground'>
        {formatPrice(displayedPrice)}
      </span>

      {showOriginalPrice && hasActiveSale ? (
        <span className='numeric mt-1 text-xs leading-4 font-medium text-foreground-muted line-through decoration-1'>
          {formatPrice(product.priceToman as number)}
        </span>
      ) : (
        <span aria-hidden='true' className='mt-1 block h-4' />
      )}
    </div>
  );
}
