import Link from 'next/link';
import {
  Bolt,
  Cable,
  ChevronLeft,
  Cpu,
  Gauge,
  ImageIcon,
  PlugZap,
  RadioReceiver,
  type LucideIcon,
} from 'lucide-react';
import type { StorefrontCategory } from '@/lib/storefront/catalog/catalog.types';
import { cn } from '@/lib/utils/cn';

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
  const params = new URLSearchParams({
    category: category.slug,
  });

  return `/products?${params.toString()}`;
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
              دسته‌بندی‌های اصلی
            </h2>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
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
      className='group relative overflow-hidden rounded-card border border-border bg-surface p-3 shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-brand/45 hover:shadow-md'
    >
      <div className='bg-muted relative aspect-[1.35/1] overflow-hidden rounded-control'>
        {category.imageUrl ? (
          // از img استفاده شده تا برای URLهای خارجی نیاز به remotePatterns در next.config نداشته باشیم
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.imageUrl}
            alt={category.imageAlt || category.name}
            loading='lazy'
            className='h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-brand-soft text-brand'>
            <ImageIcon className='size-11' />
          </div>
        )}
      </div>

      <div className='mt-3 flex items-center justify-between'>
        <span className='inline-flex size-9 items-center justify-center rounded-control border border-brand text-brand transition-colors duration-150 group-hover:bg-brand group-hover:text-brand-foreground'>
          <Icon className='size-5' />
        </span>
        <h3 className='line-clamp-1 text-sm font-extrabold text-foreground transition-colors duration-150 group-hover:text-brand'>
          {category.name}
        </h3>
      </div>
    </Link>
  );
}
