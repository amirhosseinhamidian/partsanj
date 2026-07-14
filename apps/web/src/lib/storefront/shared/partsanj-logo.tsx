import Image from 'next/image';
import Link from 'next/link';
import { Settings2, Wrench } from 'lucide-react';

import { storefrontSiteConfig } from '@/lib/storefront/site-config';
import { cn } from '@/lib/utils/cn';

type PartSanjLogoProps = {
  compact?: boolean;
  className?: string;

  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
};

export function PartSanjLogo({
  compact = false,
  className,
  logoLightUrl,
  logoDarkUrl,
}: PartSanjLogoProps) {
  const normalizedLightLogo = logoLightUrl?.trim() || null;
  const normalizedDarkLogo = logoDarkUrl?.trim() || null;

  return (
    <Link
      href='/'
      aria-label={`صفحه اصلی ${storefrontSiteConfig.name}`}
      className={cn(
        'inline-flex shrink-0 items-center text-foreground transition-opacity hover:opacity-90',
        className,
      )}
    >
      {/* حالت لایت */}
      <span className='inline-flex dark:hidden'>
        {normalizedLightLogo ? (
          <CustomLogo
            src={normalizedLightLogo}
            compact={compact}
            alt={`لوگوی ${storefrontSiteConfig.name}`}
          />
        ) : (
          <DefaultLogo compact={compact} />
        )}
      </span>

      {/* حالت دارک */}
      <span className='hidden dark:inline-flex'>
        {normalizedDarkLogo ? (
          <CustomLogo
            src={normalizedDarkLogo}
            compact={compact}
            alt={`لوگوی ${storefrontSiteConfig.name}`}
          />
        ) : (
          <DefaultLogo compact={compact} />
        )}
      </span>
    </Link>
  );
}

type CustomLogoProps = {
  src: string;
  alt: string;
  compact: boolean;
};

function CustomLogo({ src, alt, compact }: CustomLogoProps) {
  return (
    <span
      className={cn(
        'relative block h-11 overflow-hidden',
        compact ? 'w-11' : 'w-36 sm:w-40 lg:w-44',
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes={compact ? '44px' : '(max-width: 640px) 144px, (max-width: 1024px) 160px, 176px'}
        className='object-contain object-right'
      />
    </span>
  );
}

/**
 * لوگوی پیش‌فرض فعلی پروژه
 */
function DefaultLogo({ compact }: { compact: boolean }) {
  return (
    <span className='inline-flex items-center gap-2.5'>
      <span className='relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-foreground text-background shadow-panel'>
        <Settings2 aria-hidden='true' className='size-8' />

        {/* <span className='absolute -start-1 -bottom-1 grid size-5 place-items-center rounded-full bg-brand text-brand-foreground'>
          <Wrench aria-hidden='true' className='size-3' />
        </span> */}
      </span>

      {!compact ? (
        <span className='flex min-w-0 flex-col leading-none'>
          <strong className='text-lg font-extrabold tracking-tight'>
            {storefrontSiteConfig.name}
          </strong>

          <span
            dir='ltr'
            className='mt-1 text-[10px] font-bold tracking-[0.18em] text-foreground-muted'
          >
            {storefrontSiteConfig.englishName}
          </span>
        </span>
      ) : null}
    </span>
  );
}
