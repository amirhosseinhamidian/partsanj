'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CarFront, ChevronLeft, ChevronRight } from 'lucide-react';

import type { StorefrontHomeVehicleModel } from '@/lib/storefront/vehicles/vehicle.types';
import { cn } from '@/lib/utils/cn';

type HomeVehicleModelsProps = {
  vehicles?: StorefrontHomeVehicleModel[];
  className?: string;
};

function getVehicleDisplayName(vehicle: StorefrontHomeVehicleModel): string {
  const makeName = vehicle.make.name.trim();
  const modelName = vehicle.name.trim();

  if (modelName.toLowerCase().startsWith(makeName.toLowerCase())) {
    return modelName;
  }

  return `${makeName} ${modelName}`;
}

export function HomeVehicleModels({ vehicles = [], className }: HomeVehicleModelsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (vehicles.length === 0) {
    return null;
  }

  function scroll(direction: 'prev' | 'next') {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const scrollAmount = Math.min(620, element.clientWidth * 0.75);

    element.scrollBy({
      left: direction === 'next' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  return (
    <section
      aria-labelledby='home-vehicle-models-title'
      className={cn('relative mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8', className)}
      dir='rtl'
    >
      <div className='mb-5 flex items-end justify-between gap-4'>
        <div>
          <div className='flex items-center gap-3'>
            <div className='mb-2 flex items-center gap-1' aria-hidden='true'>
              <span className='h-5 w-1 rotate-12 rounded-full bg-brand' />
              <span className='h-5 w-1 rotate-12 rounded-full bg-brand/70' />
              <span className='h-5 w-1 rotate-12 rounded-full bg-brand/40' />
            </div>

            <h2
              id='home-vehicle-models-title'
              className='mt-1 text-lg font-extrabold tracking-tight text-foreground sm:text-xl'
            >
              خرید قطعه بر اساس خودرو
            </h2>
          </div>

          <p className='mt-1 text-sm leading-6 text-foreground-muted'>
            خودروی خود را انتخاب کنید و مستقیم قطعات سازگار با آن را ببینید
          </p>
        </div>
      </div>

      <div className='relative'>
        <button
          type='button'
          aria-label='خودروهای قبلی'
          onClick={() => scroll('prev')}
          className={cn(
            'absolute top-1/2 right-0 z-10 hidden size-10 -translate-y-1/2 translate-x-1/2',
            'cursor-pointer items-center justify-center rounded-full border border-border bg-surface',
            'text-foreground-muted shadow-[0_4px_18px_rgba(15,23,42,0.12)] transition',
            'hover:border-brand/40 hover:text-brand lg:flex',
          )}
        >
          <ChevronRight className='size-5' />
        </button>

        <button
          type='button'
          aria-label='خودروهای بعدی'
          onClick={() => scroll('next')}
          className={cn(
            'absolute top-1/2 left-0 z-10 hidden size-10 -translate-x-1/2 -translate-y-1/2',
            'cursor-pointer items-center justify-center rounded-full border border-border bg-surface',
            'text-foreground-muted shadow-[0_4px_18px_rgba(15,23,42,0.12)] transition',
            'hover:border-brand/40 hover:text-brand lg:flex',
          )}
        >
          <ChevronLeft className='size-5' />
        </button>

        <div
          ref={scrollRef}
          className='scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-4 sm:gap-4 lg:px-5'
        >
          {vehicles.map((vehicle) => (
            <VehicleModelCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VehicleModelCard({ vehicle }: { vehicle: StorefrontHomeVehicleModel }) {
  const displayName = getVehicleDisplayName(vehicle);

  return (
    <Link
      href={`/vehicles/${encodeURIComponent(vehicle.slug)}`}
      aria-label={`مشاهده قطعات مناسب ${displayName}`}
      className={cn(
        'group min-w-[164px] snap-start overflow-hidden rounded-2xl border border-border bg-surface shadow-sm',
        'transition-all duration-200 hover:-translate-y-1 hover:border-brand/45 hover:shadow-md',
        'sm:min-w-[190px] lg:min-w-[205px] xl:min-w-[212px]',
      )}
    >
      <div className='relative mx-2 mt-2 aspect-[1.35/1] overflow-hidden rounded-xl bg-surface-muted'>
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={vehicle.imageAlt?.trim() || `تصویر ${displayName}`}
            fill
            sizes='(max-width: 640px) 164px, (max-width: 1024px) 190px, 212px'
            className='object-contain p-2.5 transition-transform duration-300 group-hover:scale-105 sm:p-3'
          />
        ) : (
          <div className='flex size-full items-center justify-center bg-brand-soft text-brand'>
            <CarFront className='size-11 opacity-80' />
          </div>
        )}
      </div>

      <div className='px-3.5 pt-3 pb-3.5 sm:px-4'>
        <p className='truncate text-[11px] font-semibold text-foreground-muted sm:text-xs'>
          {vehicle.make.name}
        </p>

        <h3 className='mt-1 truncate text-sm font-extrabold text-foreground transition-colors group-hover:text-brand sm:text-[15px]'>
          {displayName}
        </h3>

        <span className='mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand'>
          مشاهده قطعات
          <ChevronLeft className='size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5' />
        </span>
      </div>
    </Link>
  );
}
