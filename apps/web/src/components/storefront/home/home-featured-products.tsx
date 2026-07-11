'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

import type { StorefrontProductListItem } from '@/lib/storefront/catalog/catalog.types';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/price';
import { Button } from '@/components/ui/button';

type HomeFeaturedProductsProps = {
  products?: StorefrontProductListItem[];
  className?: string;
};

export function HomeFeaturedProducts({ products = [], className }: HomeFeaturedProductsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (products.length === 0) {
    return null;
  }

  const scroll = (direction: 'prev' | 'next') => {
    const element = scrollRef.current;

    if (!element) return;

    const scrollAmount = 330;

    element.scrollBy({
      left: direction === 'next' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section
      className={cn('relative mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8', className)}
      dir='rtl'
    >
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='mb-2 flex items-center gap-1'>
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand' />
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand/70' />
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand/40' />
          </div>

          <h2
            id='home-main-categories-title'
            className='mt-1 text-lg font-extrabold tracking-tight text-foreground sm:text-xl'
          >
            محصولات ویژه
          </h2>
        </div>
        <Link href='/products'>
          <Button variant='outline' iconEnd={<ChevronLeft />}>
            همه محصولات
          </Button>
        </Link>
      </div>

      <button
        type='button'
        aria-label='محصولات قبلی'
        onClick={() => scroll('prev')}
        className='absolute top-1/2 right-0 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_4px_18px_rgba(15,23,42,0.15)] transition duration-200 hover:text-orange-500 lg:flex dark:border dark:border-brand-foreground dark:bg-transparent dark:text-brand-foreground dark:hover:border-orange-500'
      >
        <ChevronRight className='h-5 w-5' />
      </button>

      <button
        type='button'
        aria-label='محصولات بعدی'
        onClick={() => scroll('next')}
        className='absolute top-1/2 left-0 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_4px_18px_rgba(15,23,42,0.15)] transition duration-200 hover:text-orange-500 lg:flex dark:border dark:border-brand-foreground dark:bg-transparent dark:text-brand-foreground dark:hover:border-orange-500'
      >
        <ChevronLeft className='h-5 w-5' />
      </button>

      <div
        ref={scrollRef}
        className='scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth px-6 pb-10'
      >
        {products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function FeaturedProductCard({ product }: { product: StorefrontProductListItem }) {
  const primaryImage = product.images?.[0] ?? null;
  const displayedPrice = product.effectivePriceToman ?? product.priceToman;
  const metaLines = getProductMetaLines(product);

  return (
    <article className='max-w-[300px] min-w-[300px] overflow-hidden rounded-2xl bg-surface shadow-[0_8px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(15,23,42,0.12)] sm:max-w-[315px] sm:min-w-[315px]'>
      <div className='grid h-[145px] grid-cols-[42%_58%] gap-2 p-5'>
        <Link
          href={`/products/${encodeURIComponent(product.slug)}`}
          className='flex items-center justify-center rounded-xl bg-background'
        >
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              className='max-h-[105px] w-full object-contain transition duration-300 hover:scale-105'
            />
          ) : (
            <div className='flex h-[105px] w-full items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400'>
              بدون تصویر
            </div>
          )}
        </Link>

        <div className='flex min-w-0 flex-col'>
          <Link href={`/products/${encodeURIComponent(product.slug)}`}>
            <h3 className='line-clamp-2 text-sm font-extrabold text-slate-800 transition hover:text-orange-500 dark:text-slate-100'>
              {product.name}
            </h3>
          </Link>

          <ul className='mt-2 space-y-1 text-[11px] leading-4 text-slate-500 dark:text-slate-300'>
            {metaLines.map((line) => (
              <li key={line} className='line-clamp-1'>
                {line}
              </li>
            ))}
          </ul>

          <div className='mt-auto'>
            {displayedPrice !== null ? (
              <p className='font-extrabold text-orange-500'>{formatPrice(displayedPrice)}</p>
            ) : (
              <p className='text-xs font-bold text-orange-500'>استعلام قیمت</p>
            )}
          </div>
        </div>
      </div>

      <div className='px-7 pb-3'>
        <Button
          size='sm'
          fullWidth
          type='button'
          variant='outline'
          iconEnd={<ChevronLeft className='h-4 w-4' />}
        >
          مشاهده جزییات قطعه
        </Button>
      </div>
    </article>
  );
}

function getProductMetaLines(product: StorefrontProductListItem) {
  const lines: string[] = [];

  if (product.category?.name) {
    lines.push(product.category.name);
  }

  if (product.brand?.name) {
    lines.push(product.brand.name);
  }

  return lines.slice(0, 3);
}
