import { Settings2, Wrench } from 'lucide-react';
import Link from 'next/link';

import { storefrontSiteConfig } from '@/lib/storefront/site-config';
import { cn } from '@/lib/utils/cn';

type PartSanjLogoProps = {
  compact?: boolean;
  className?: string;
};

export function PartSanjLogo({ compact = false, className }: PartSanjLogoProps) {
  return (
    <Link
      href='/'
      aria-label='صفحه اصلی پارت‌سنج'
      className={cn(
        'inline-flex shrink-0 items-center gap-2.5 text-foreground transition-opacity hover:opacity-90',
        className,
      )}
    >
      <span className='relative grid size-11 place-items-center overflow-hidden rounded-[14px] bg-foreground text-background shadow-panel'>
        <Settings2 className='size-8' />

        <span className='absolute -start-1 -bottom-1 grid size-5 place-items-center rounded-full bg-brand text-brand-foreground'>
          <Wrench className='size-3' />
        </span>
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
    </Link>
  );
}
