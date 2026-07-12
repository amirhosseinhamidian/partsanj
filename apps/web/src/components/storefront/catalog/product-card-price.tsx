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
        <div className={cn('text-right', className)}>
          <span className='text-sm font-extrabold text-brand'>استعلام قیمت</span>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col gap-1 text-right', className)}>
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
    if (variant === 'home-row') {
      return (
        <div className={cn('text-right', className)}>
          <span className='text-sm font-extrabold text-brand'>استعلام قیمت</span>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col items-end gap-1 text-right', className)}>
        <span className='text-sm font-semibold text-foreground-secondary'>
          قیمت نیازمند استعلام است
        </span>
      </div>
    );
  }

  if (variant === 'home-row') {
    return (
      <div className={cn('flex flex-col items-start gap-1 text-right', className)}>
        <span className='text-lg font-extrabold text-brand'>{formatPrice(displayedPrice)}</span>

        {showOriginalPrice && hasActiveSale ? (
          <span className='text-xs font-bold text-foreground-muted line-through'>
            {formatPrice(product.priceToman as number)}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-end gap-1 text-right', className)}>
      <span className='numeric text-lg font-extrabold text-foreground'>
        {formatPrice(displayedPrice)}
      </span>

      {showOriginalPrice && hasActiveSale ? (
        <span className='numeric text-xs text-foreground-muted line-through'>
          {formatPrice(product.priceToman as number)}
        </span>
      ) : null}
    </div>
  );
}
