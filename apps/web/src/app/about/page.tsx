import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  BadgeCheck,
  Boxes,
  Headphones,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Target,
  Truck,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  const siteName = settings.siteName?.trim() || 'پارت‌سنج';

  const title = `درباره ما | ${siteName}`;

  const description =
    `${siteName} مرجع تخصصی انتخاب و خرید قطعات یدکی خودرو، ` +
    'با تمرکز بر بررسی دقیق سازگاری قطعه با برند، مدل و تیپ خودرو است.';

  return buildSeoMetadata({
    title: 'درباره ما',
    seoTitle: title,
    description,
    canonicalPath: '/about',
    globalNoIndex: settings.noIndexSite,
    type: 'website',
    openGraphTitle: title,
    openGraphDescription: description,
    openGraphImage: {
      url: settings.defaultOgImageUrl || '/images/about/about-light.webp',
      alt: `درباره ${siteName}`,
    },
  });
}

const TRUST_ITEMS = [
  {
    title: 'پرداخت امن',
    icon: LockKeyhole,
  },
  {
    title: 'پشتیبانی ۲۴/۷',
    icon: Headphones,
  },
  {
    title: 'ارسال سریع',
    icon: Truck,
  },
  {
    title: 'ضمانت اصالت',
    icon: BadgeCheck,
  },
];

const STATS = [
  {
    value: '+۳۰۰,۰۰۰',
    label: 'سفارش موفق',
    icon: WalletCards,
  },
  {
    value: '+۱۵۰,۰۰۰',
    label: 'مشتری راضی',
    icon: UsersRound,
  },
  {
    value: '+۲۰,۰۰۰',
    label: 'محصول باکیفیت',
    icon: Boxes,
  },
  {
    value: '+۵',
    label: 'سال تجربه در صنعت',
    icon: Award,
  },
];

const VALUES = [
  {
    title: 'اعتماد و شفافیت',
    description:
      'ما با ارائه اطلاعات دقیق، قیمت‌گذاری شفاف و توضیحات کاربردی، اعتماد شما را جلب می‌کنیم.',
    icon: ShieldCheck,
  },
  {
    title: 'سازگاری دقیق',
    description: 'قطعات متناسب با برند، مدل و تیپ خودروی شما با دقت بررسی و پیشنهاد می‌شوند.',
    icon: Target,
  },
  {
    title: 'کیفیت و اصالت',
    description: 'تمرکز ما بر ارائه محصولات معتبر، باکیفیت و قابل اطمینان برای خودروهای مختلف است.',
    icon: Award,
  },
  {
    title: 'مشتری‌مداری',
    description: 'رضایت شما اولویت ماست؛ از انتخاب قطعه تا دریافت سفارش، همراهتان هستیم.',
    icon: UsersRound,
  },
];

export default function AboutPage() {
  return (
    <main dir='rtl' className='bg-background'>
      <section className='relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10'>
        <AboutBackground />

        <div className='relative mx-auto max-w-7xl'>
          <AboutHero />

          {/* <AboutStats /> */}

          <AboutValues />

          <AboutStatement />
        </div>
      </section>
    </main>
  );
}

function AboutHero() {
  return (
    <section className='grid items-center gap-8 rounded-[28px] border border-border bg-surface p-5 shadow-panel lg:grid-cols-[0.95fr_1.05fr] lg:p-8'>
      <div className='space-y-7 text-right'>
        <div className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-extrabold text-brand'>
          <ShieldCheck className='size-4' />
          <span>درباره پارت‌سنج</span>
        </div>

        <div>
          <h1 className='type-page-title max-w-3xl text-foreground sm:text-4xl lg:text-5xl'>
            انتخابی مطمئن برای خودروی شما
          </h1>

          <p className='mt-5 max-w-3xl text-base leading-9 text-foreground-secondary lg:text-lg'>
            پارت‌سنج با هدف ساده‌سازی فرآیند انتخاب و خرید قطعات یدکی خودرو تأسیس شد. ما با تمرکز بر
            سازگاری دقیق قطعات با مدل و تیپ خودرو، اطلاعات فنی شفاف و قیمت‌گذاری منصفانه، تجربه‌ای
            مطمئن و لذت‌بخش از خرید آنلاین را برای شما فراهم می‌کنیم.
          </p>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className='flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-border bg-surface text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand hover:shadow-md'
              >
                <Icon className='size-5 stroke-[1.8]' />
                <span>{item.title}</span>
              </div>
            );
          })}
        </div>

        <div className='flex flex-wrap gap-3'>
          <Link
            href='/products'
            className='inline-flex h-13 items-center justify-center rounded-2xl bg-brand px-7 text-sm font-extrabold text-brand-foreground shadow-[0_14px_30px_rgb(255_92_0/0.24)] transition hover:-translate-y-0.5 hover:bg-brand-hover'
          >
            مشاهده محصولات
          </Link>

          <Link
            href='/contact'
            className='inline-flex h-13 items-center justify-center rounded-2xl border border-border bg-surface px-7 text-sm font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand'
          >
            ارتباط با پشتیبانی
          </Link>
        </div>
      </div>

      <div className='relative min-h-75 overflow-hidden rounded-3xl bg-surface-muted sm:min-h-95 lg:min-h-105'>
        <Image
          src='/images/about/about-light.webp'
          alt='قطعات خودرو پارت‌سنج'
          fill
          priority
          sizes='(max-width: 1024px) 100vw, 48vw'
          className='block object-cover object-center dark:hidden'
        />

        <Image
          src='/images/about/about-dark.webp'
          alt='قطعات خودرو پارت‌سنج'
          fill
          priority
          sizes='(max-width: 1024px) 100vw, 48vw'
          className='hidden object-cover object-center dark:block'
        />
      </div>
    </section>
  );
}

function AboutStats() {
  return (
    <section className='mt-5 rounded-[24px] border border-border bg-surface/90 p-4 shadow-panel backdrop-blur'>
      <div className='grid md:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border'>
        {STATS.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className='group flex items-center justify-center gap-4 rounded-2xl p-4 text-center transition hover:bg-brand-soft/70 lg:rounded-none'
            >
              <div className='flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand transition group-hover:scale-110 group-hover:bg-brand group-hover:text-white'>
                <Icon className='size-7 stroke-[1.8]' />
              </div>

              <div>
                <div className='text-2xl font-black text-foreground'>{stat.value}</div>
                <div className='mt-1 text-sm font-medium text-foreground-secondary'>
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AboutValues() {
  return (
    <section className='mt-10'>
      <div className='mb-6 text-center'>
        <h2 className='type-section-title text-foreground'>ارزش‌هایی که به آن‌ها باور داریم</h2>

        <div className='my-2 flex items-center justify-center gap-1'>
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand' />
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand/70' />
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand/40' />
        </div>
      </div>

      <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
        {VALUES.map((value) => {
          const Icon = value.icon;

          return (
            <article
              key={value.title}
              className='group relative overflow-hidden rounded-[22px] border border-border bg-surface p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-panel'
            >
              <div className='absolute -top-16 right-1/2 size-32 translate-x-1/2 rounded-full bg-brand/10 opacity-0 blur-2xl transition group-hover:opacity-100' />

              <div className='relative mx-auto flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand transition duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white'>
                <Icon className='size-8 stroke-[1.8]' />
              </div>

              <h3 className='relative mt-5 text-base font-extrabold text-foreground'>
                {value.title}
              </h3>

              <p className='relative mt-3 text-sm leading-7 text-foreground-secondary'>
                {value.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AboutStatement() {
  return (
    <section className='mt-5 overflow-hidden rounded-[24px] border border-border bg-surface p-6 text-center shadow-sm lg:p-8'>
      <div className='mx-auto flex max-w-4xl flex-col items-center gap-3'>
        <div className='flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand'>
          <PackageCheck className='size-7 stroke-[1.8]' />
        </div>

        <p className='text-base leading-8 font-bold text-foreground-secondary lg:text-lg'>
          ما در پارت‌سنج تلاش می‌کنیم تا خرید قطعات یدکی خودرو را آسان، مطمئن و هوشمند کنیم.
        </p>

        <p className='text-lg font-black text-brand'>پارت‌سنج، همراه مطمئن خودروی شما</p>
      </div>
    </section>
  );
}

function AboutBackground() {
  return (
    <>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/90 to-transparent dark:from-white/5' />
      <div className='pointer-events-none absolute top-32 -right-24 size-72 rounded-full border border-info/15' />
      <div className='pointer-events-none absolute top-16 -left-24 size-96 rounded-full bg-brand/5 blur-3xl' />
      <div className='pointer-events-none absolute right-0 bottom-12 size-80 rounded-full bg-info/5 blur-3xl' />
    </>
  );
}
