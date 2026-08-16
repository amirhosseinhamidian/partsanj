import Link from 'next/link';
import {
  Bolt,
  Cable,
  Cpu,
  Gauge,
  ImageIcon,
  PlugZap,
  RadioReceiver,
  type LucideIcon,
} from 'lucide-react';
import type { StorefrontCategory } from '@/lib/storefront/catalog/catalog.types';
import { cn } from '@/lib/utils/cn';
import Image from 'next/image';

type HomeMainCategoriesProps = {
  categories?: StorefrontCategory[];
  className?: string;
};

type HomeMainCategoryIconKey = 'socket' | 'sensor' | 'electronic' | 'relay' | 'wiring' | 'electric';

const CATEGORY_ICONS: Record<HomeMainCategoryIconKey, LucideIcon> = {
  socket: PlugZap,
  sensor: Gauge,
  electronic: Cpu,
  relay: RadioReceiver,
  wiring: Cable,
  electric: Bolt,
};

function createCategoryHref(category: StorefrontCategory) {
  return `/categories/${encodeURIComponent(category.slug)}`;
}

function getCategoryIcon(category: StorefrontCategory) {
  const slug = category.slug.toLowerCase();
  const name = category.name.toLowerCase();

  if (
    slug.includes('socket') ||
    slug.includes('connector') ||
    name.includes('سوکت') ||
    name.includes('کانکتور')
  ) {
    return CATEGORY_ICONS.socket;
  }

  if (slug.includes('sensor') || name.includes('سنسور')) {
    return CATEGORY_ICONS.sensor;
  }

  if (slug.includes('electronic') || slug.includes('ecu') || name.includes('الکترونیک')) {
    return CATEGORY_ICONS.electronic;
  }

  if (
    slug.includes('relay') ||
    slug.includes('fuse') ||
    name.includes('رله') ||
    name.includes('فیوز')
  ) {
    return CATEGORY_ICONS.relay;
  }

  if (slug.includes('wire') || slug.includes('wiring') || name.includes('سیم')) {
    return CATEGORY_ICONS.wiring;
  }

  return CATEGORY_ICONS.electric;
}

export function HomeMainCategories({ categories = [], className }: HomeMainCategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby='home-main-categories-title'
      className={cn('bg-background py-8 sm:py-10 lg:py-12', className)}
    >
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-5 flex items-center gap-3'>
          <div className='mb-2 flex items-center gap-1'>
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand' />
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand/70' />
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand/40' />
          </div>

          <h2
            id='home-main-categories-title'
            className='mt-1 text-lg font-extrabold tracking-tight text-foreground sm:text-xl'
          >
            دسته‌بندی‌های اصلی
          </h2>
        </div>

        <div
          className={cn(
            'grid grid-cols-1 gap-4',
            'min-[400px]:grid-cols-2 min-[400px]:gap-2.5',
            'sm:gap-3',
            'lg:grid-cols-3 lg:gap-5',
            'xl:grid-cols-6',
          )}
        >
          {categories.map((category) => (
            <HomeMainCategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeMainCategoryCard({ category }: { category: StorefrontCategory }) {
  const Icon = getCategoryIcon(category);

  return (
    <Link
      href={createCategoryHref(category)}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm',
        'transition-all duration-150',
        'hover:-translate-y-1 hover:border-brand/45 hover:shadow-md',
      )}
    >
      <div
        className={cn(
          'bg-muted relative overflow-hidden rounded-control',
          'aspect-[1.35/1]',
          'min-[400px]:aspect-[1.25/1]',
          'sm:aspect-[1.35/1]',
        )}
      >
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.imageAlt || category.name}
            fill
            sizes='(max-width: 399px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 16vw'
            className={cn(
              'object-contain transition-transform duration-300 group-hover:scale-105',
              'p-3',
              'min-[400px]:p-2.5',
              'sm:p-3',
            )}
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-brand-soft text-brand'>
            <ImageIcon className='size-11 min-[400px]:size-9 sm:size-11' />
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-1 items-center',

          'gap-3 px-4 py-4',

          'min-[400px]:gap-2.5 min-[400px]:px-3 min-[400px]:py-3',

          'sm:gap-3 sm:px-4 sm:py-4',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 flex-1 items-center',

            // ارتفاع ثابت معادل دو خط
            'h-14',

            'min-[400px]:h-12',

            'sm:h-14',
          )}
        >
          <span
            className={cn(
              'line-clamp-2 w-full text-right font-semibold text-foreground',

              'leading-7',

              'min-[400px]:text-sm min-[400px]:leading-6',

              'sm:text-sm sm:leading-7',
            )}
          >
            {category.name}
          </span>
        </div>

        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-lg border border-brand text-brand',

            'size-7',

            'min-[400px]:size-6',

            'sm:size-8',
          )}
        >
          <Icon className='size-4.5 min-[400px]:size-4 sm:size-5' />
        </span>
      </div>
    </Link>
  );
}
