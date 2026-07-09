import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { HomeHeroFinder } from './home-hero-finder';
import { Grid2X2, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type HomeHeroProps = {
  className?: string;
  artworkLightSrc?: string;
  artworkDarkSrc?: string;
  artworkAlt?: string;
  compatibilityFinder?: ReactNode;
};

export function HomeHero({
  className,
  artworkLightSrc = '/images/home/hero-light.webp',
  artworkDarkSrc = '/images/home/hero-dark.webp',
  artworkAlt = 'قطعات برقی خودرو شامل سوکت، سنسور، دسته‌سیم و قطعات الکترونیکی',
  compatibilityFinder,
}: HomeHeroProps) {
  return (
    <section
      aria-labelledby='home-hero-title'
      className={cn(
        'relative isolate overflow-hidden border-b border-border bg-[#f8fbff] dark:bg-[#061321]',
        className,
      )}
    >
      <HeroBackground />

      <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div
          dir='ltr'
          className='grid min-h-[560px] items-center gap-6 py-10 lg:min-h-[500px] lg:grid-cols-[1.08fr_0.92fr] lg:py-14'
        >
          <HeroArtwork lightSrc={artworkLightSrc} darkSrc={artworkDarkSrc} alt={artworkAlt} />

          <HeroCopy />
        </div>
      </div>

      <div className='relative z-20 mx-auto -mt-2 max-w-7xl px-4 pb-10 sm:px-6 lg:-mt-12 lg:px-8 lg:pb-14'>
        {compatibilityFinder ?? <HomeHeroFinder />}
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <div dir='rtl' className='order-1 max-w-2xl text-right lg:order-2 lg:justify-self-end'>
      <span className='inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3.5 py-2 text-sm font-bold text-brand'>
        <ShieldCheck className='size-4' />
        انتخاب مطمئن قطعه برای خودرو
      </span>

      <h1
        id='home-hero-title'
        className='mt-5 text-[2.5rem] leading-[1.35] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.7rem]'
      >
        قطعه درست،
        <br />
        برای خودروی <span className='text-brand'>درست</span>
      </h1>

      <p className='mt-5 max-w-xl text-base leading-8 text-foreground-secondary sm:text-lg'>
        مرجع تخصصی خرید قطعات برقی، الکترونیکی، سوکت، سنسور و قطعات جانبی خودرو با بررسی دقیق
        سازگاری قطعه با خودروی شما
      </p>

      <div className='mt-7 flex flex-wrap gap-3'>
        <Link
          href='/products'
          className='inline-flex h-12 items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-extrabold text-brand-foreground shadow-[0_14px_28px_rgba(255,91,31,0.24)] transition-all hover:-translate-y-0.5 hover:opacity-95'
        >
          <Search className='size-4' />
          جستجوی قطعه
        </Link>

        <Link
          href='/categories'
          className='inline-flex h-12 items-center justify-center gap-2 rounded-control border border-border bg-surface px-5 text-sm font-extrabold text-foreground transition-colors hover:border-brand/45 hover:text-brand dark:bg-white/5'
        >
          <Grid2X2 className='size-4' />
          مشاهده دسته‌بندی‌ها
        </Link>
      </div>
    </div>
  );
}

function HeroArtwork({
  lightSrc,
  darkSrc,
  alt,
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
}) {
  return (
    <div className='relative order-2 min-h-[300px] sm:min-h-[380px] lg:order-1 lg:-ml-10 lg:min-h-[440px] xl:-ml-16'>
      <div className='absolute inset-x-[8%] bottom-[4%] h-[24%] rounded-full bg-brand/20 blur-3xl dark:bg-brand/30' />

      <div className='absolute inset-0'>
        <Image
          src={lightSrc}
          alt={alt}
          fill
          priority
          sizes='(max-width: 1024px) 100vw, 58vw'
          className='object-left-center block object-contain dark:hidden'
        />

        <Image
          src={darkSrc}
          alt={alt}
          fill
          priority
          sizes='(max-width: 1024px) 100vw, 58vw'
          className='object-left-center hidden object-contain dark:block'
        />
      </div>
    </div>
  );
}

// function HeroArtwork({ src, alt }: { src: string; alt: string }) {
//   return (
//     <div className='relative order-2 min-h-[260px] sm:min-h-[330px] lg:order-1 lg:min-h-[420px]'>
//       <div className='absolute inset-x-[6%] bottom-[3%] h-[24%] rounded-full bg-brand/20 blur-3xl dark:bg-brand/30' />

//       <div className='absolute inset-x-0 top-[6%] h-[78%] opacity-50 dark:opacity-70'>
//         <HeroBlueprint />
//       </div>

//       <div className='absolute inset-0'>
//         <Image
//           src={src}
//           alt={alt}
//           fill
//           priority
//           sizes='(max-width: 1024px) 100vw, 54vw'
//           className='object-contain object-center drop-shadow-[0_28px_28px_rgba(4,18,39,0.22)]'
//         />
//       </div>
//     </div>
//   );
// }

function HeroBackground() {
  return (
    <>
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_17%_40%,rgba(65,143,255,0.15),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(255,105,38,0.1),transparent_30%)] dark:bg-[radial-gradient(circle_at_17%_40%,rgba(38,122,255,0.3),transparent_35%),radial-gradient(circle_at_82%_24%,rgba(255,105,38,0.16),transparent_30%)]'
      />

      <div
        aria-hidden='true'
        className='absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-background/80 dark:to-[#061321]'
      />

      <div
        aria-hidden='true'
        className='absolute top-12 -right-24 -z-10 size-80 rounded-full border border-brand/10 bg-brand/[0.03] dark:border-brand/15 dark:bg-brand/[0.05]'
      />

      <div
        aria-hidden='true'
        className='absolute bottom-8 -left-32 -z-10 size-96 rounded-full border border-sky-500/10 bg-sky-500/[0.03] dark:border-sky-400/15 dark:bg-sky-400/[0.04]'
      />
    </>
  );
}

function HeroBlueprint() {
  return (
    <svg
      viewBox='0 0 760 430'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='h-full w-full text-sky-500/35 dark:text-sky-300/25'
    >
      <path
        d='M98 270C126 195 188 147 270 139H452C540 146 612 197 648 270'
        stroke='currentColor'
        strokeWidth='2'
      />

      <path
        d='M146 273H616C641 273 662 294 662 320V336H101V320C101 294 121 273 146 273Z'
        stroke='currentColor'
        strokeWidth='2'
      />

      <path
        d='M182 195L222 140M576 195L536 140M115 332H648'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeDasharray='8 9'
      />

      <circle cx='197' cy='340' r='45' stroke='currentColor' strokeWidth='2' />

      <circle cx='565' cy='340' r='45' stroke='currentColor' strokeWidth='2' />

      <path
        d='M340 89H473M473 89L510 52M473 89L510 126M116 223H43M43 223L16 196M43 223L16 250'
        stroke='currentColor'
        strokeWidth='1.5'
      />

      <circle cx='340' cy='89' r='4' fill='currentColor' />

      <circle cx='116' cy='223' r='4' fill='currentColor' />
    </svg>
  );
}
