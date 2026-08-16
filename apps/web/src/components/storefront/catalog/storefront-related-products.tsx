import Link from 'next/link';
import { ChevronLeft, PackageSearch, Puzzle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { ProductCardPrice } from '@/components/storefront/catalog/product-card-price';

import type {
  StorefrontRelatedProduct,
  StorefrontStockStatus,
} from '@/lib/storefront/catalog/catalog.types';

import { toPersianDigits } from '@/lib/utils/digits';

type StorefrontRelatedProductsProps = {
  products: StorefrontRelatedProduct[];

  variant?: 'related' | 'complementary';
};

function getStockStatusLabel(stockStatus: StorefrontStockStatus) {
  if (stockStatus === 'IN_STOCK') {
    return 'موجود';
  }

  if (stockStatus === 'CHECK_AVAILABILITY') {
    return 'استعلام موجودی';
  }

  return 'ناموجود';
}

function getStockStatusVariant(stockStatus: StorefrontStockStatus) {
  if (stockStatus === 'IN_STOCK') {
    return 'success' as const;
  }

  if (stockStatus === 'CHECK_AVAILABILITY') {
    return 'warning' as const;
  }

  return 'neutral' as const;
}

export function StorefrontRelatedProducts({
  products,
  variant = 'related',
}: StorefrontRelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  const isComplementary = variant === 'complementary';

  const category = products[0]?.category;

  const SectionIcon = isComplementary ? Puzzle : PackageSearch;

  const title = isComplementary ? 'قطعات مکمل پیشنهادی' : 'محصولات مرتبط';

  const description = isComplementary
    ? 'قطعات پیشنهادی برای استفاده در کنار این محصول، بر اساس خودرو و ارتباط دسته‌بندی‌ها'
    : 'قطعات مشابه بر اساس دسته‌بندی و سازگاری خودرو';

  return (
    <section
      aria-labelledby='related-products-title'
      className='mx-auto w-full max-w-7xl px-4 pt-4 pb-12 sm:px-6 lg:px-8'
    >
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
            <SectionIcon className='size-5' />
          </span>

          <div>
            <h2
              id={isComplementary ? 'complementary-products-title' : 'related-products-title'}
              className='text-lg font-extrabold text-foreground sm:text-xl'
            >
              {title}
            </h2>

            <p className='mt-1 text-sm leading-6 text-foreground-secondary'>{description}</p>
          </div>
        </div>

        {!isComplementary && category ? (
          <Link
            href={`/categories/${encodeURIComponent(category.slug)}`}
            className='inline-flex items-center gap-1 text-sm font-bold text-brand transition-opacity hover:opacity-75'
          >
            مشاهده همه {category.name}
            <ChevronLeft className='size-4' />
          </Link>
        ) : null}
      </div>

      <div className='scrollbar-hide grid snap-x snap-mandatory auto-cols-[minmax(230px,270px)] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain px-12 pb-14 sm:auto-cols-[minmax(245px,285px)] lg:auto-cols-[minmax(260px,300px)]'>
        {products.map((product) => {
          const primaryImage = product.images[0] ?? null;

          const hasSale =
            product.isSaleActive &&
            product.priceToman !== null &&
            product.effectivePriceToman !== null;

          const productHref = `/products/${encodeURIComponent(product.slug)}`;

          return (
            <article
              key={product.id}
              className='group flex min-w-0 snap-start flex-col overflow-hidden rounded-card border border-border bg-surface shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-floating'
            >
              <Link href={productHref} className='relative block'>
                <ImageUrlPreview
                  src={primaryImage?.url}
                  alt={primaryImage?.alt || `تصویر محصول ${product.name}`}
                  emptyLabel='تصویر محصول ثبت نشده است'
                  className='aspect-square w-full rounded-none border-0'
                  imageClassName='object-contain transition-transform duration-300 group-hover:scale-[1.03]'
                />

                {hasSale ? (
                  <Badge variant='danger' size='sm' className='absolute start-3 top-3'>
                    {toPersianDigits(product.discountPercent)}٪ تخفیف
                  </Badge>
                ) : null}
              </Link>

              <div className='flex flex-1 flex-col p-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <Badge variant={getStockStatusVariant(product.stockStatus)} size='sm' dot>
                    {getStockStatusLabel(product.stockStatus)}
                  </Badge>

                  <span className='text-xs text-foreground-muted'>{product.brand.name}</span>
                </div>

                <Link href={productHref} className='mt-3 block'>
                  <h3 className='line-clamp-2 min-h-12 text-base leading-6 font-bold text-foreground transition-colors group-hover:text-brand'>
                    {product.name}
                  </h3>
                </Link>

                {product.shortDescription ? (
                  <p className='mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-foreground-secondary'>
                    {product.shortDescription}
                  </p>
                ) : (
                  <div className='min-h-10' />
                )}

                <div className='mt-4 flex flex-1 flex-col border-t border-border pt-4'>
                  <ProductCardPrice product={product} variant='product-list' />

                  <Link
                    href={productHref}
                    className='mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand'
                  >
                    مشاهده محصول
                    <ChevronLeft className='size-4' />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
