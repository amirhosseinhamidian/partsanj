import type { Metadata } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Clock3, Headphones, Phone, ShieldCheck, Sparkles } from 'lucide-react';

import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';
import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';
import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { toPersianDigits } from '@/lib/utils/digits';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  const title = `تماس با ما | ${settings.siteName}`;

  const description =
    `راه‌های ارتباط با پشتیبانی ${settings.siteName} برای مشاوره انتخاب قطعه، ` +
    'بررسی سازگاری قطعات، پیگیری سفارش و دریافت راهنمایی خرید.';

  return buildSeoMetadata({
    /**
     * fallback برای زمانی که helper به title عادی نیاز دارد.
     */
    title: 'تماس با ما',

    /**
     * عنوان کامل و نهایی صفحه.
     * به‌صورت absolute قرار می‌گیرد تا title template
     * دوباره نام سایت را اضافه نکند.
     */
    seoTitle: title,

    description,

    canonicalPath: '/contact',

    /**
     * این صفحه به‌صورت عادی قابل ایندکس است،
     * اما تنظیم کلی noindex سایت بر آن اولویت دارد.
     */
    globalNoIndex: settings.noIndexSite,

    type: 'website',

    openGraphTitle: title,
    openGraphDescription: description,

    openGraphImage: settings.defaultOgImageUrl
      ? {
          url: settings.defaultOgImageUrl,
          alt: `تماس با ${settings.siteName}`,
        }
      : null,
  });
}

function normalizeTelHref(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d+]/g, '');

  return normalized ? `tel:${normalized}` : null;
}

function formatContactValue(value: string) {
  const trimmed = value.trim();

  const isOnlyDigits = /^[0-9۰-۹]+$/.test(trimmed);

  return isOnlyDigits ? toPersianDigits(trimmed) : value;
}

function buildContactLinks(settings: StorefrontSiteSettings): ContactLinkItem[] {
  const links: ContactLinkItem[] = [];

  const phoneHref = normalizeTelHref(settings.supportPhone);

  if (settings.supportPhone && phoneHref) {
    links.push({
      title: 'تماس تلفنی',
      description: 'برای مشاوره سریع و پیگیری سفارش',
      value: settings.supportPhone,
      href: phoneHref,
      iconSrc: '/icons/social/phone.svg',
      primary: true,
    });
  }

  if (settings.supportMobile) {
    const mobileHref = normalizeTelHref(settings.supportMobile);

    if (mobileHref) {
      links.push({
        title: 'موبایل پشتیبانی',
        description: 'تماس مستقیم با پشتیبانی',
        value: settings.supportMobile,
        href: mobileHref,
        iconSrc: '/icons/social/phone.svg',
      });
    }
  }

  if (settings.whatsappUrl) {
    links.push({
      title: 'واتساپ',
      description: 'ارسال پیام و دریافت راهنمایی خرید',
      value: 'ارسال پیام در واتساپ',
      href: settings.whatsappUrl,
      iconSrc: '/icons/social/whatsapp.svg',
    });
  }

  if (settings.telegramUrl) {
    links.push({
      title: 'تلگرام',
      description: 'ارتباط سریع با پشتیبانی پارت‌سنج',
      value: 'ارسال پیام در تلگرام',
      href: settings.telegramUrl,
      iconSrc: '/icons/social/telegram.svg',
    });
  }

  if (settings.baleUrl) {
    links.push({
      title: 'بله',
      description: 'ارتباط از طریق پیام‌رسان بله',
      value: 'ارسال پیام در بله',
      href: settings.baleUrl,
      iconSrc: '/icons/social/bale.svg',
    });
  }

  if (settings.instagramUrl) {
    links.push({
      title: 'اینستاگرام',
      description: 'مشاهده اخبار، محصولات و آموزش‌ها',
      value: 'مشاهده صفحه اینستاگرام',
      href: settings.instagramUrl,
      iconSrc: '/icons/social/instagram.svg',
    });
  }

  return links;
}

type ContactLinkItem = {
  title: string;
  description: string;
  value: string;
  href: string;
  icon?: LucideIcon;
  iconSrc?: string;
  primary?: boolean;
};

const SUPPORT_ITEMS = [
  {
    title: 'پاسخ‌گویی سریع',
    description: 'پیام‌ها و تماس‌های شما در کوتاه‌ترین زمان ممکن بررسی می‌شود.',
    icon: Clock3,
  },
  {
    title: 'مشاوره انتخاب قطعه',
    description: 'برای انتخاب قطعه مناسب با خودرو، می‌توانید قبل از خرید راهنمایی بگیرید.',
    icon: Headphones,
  },
  {
    title: 'پیگیری مطمئن سفارش',
    description: 'در صورت نیاز، وضعیت سفارش و مراحل ارسال از طریق پشتیبانی بررسی می‌شود.',
    icon: ShieldCheck,
  },
];

export default async function ContactPage() {
  const settings = await getStorefrontSiteSettings();
  const contactLinks = buildContactLinks(settings);

  return (
    <main className='relative overflow-hidden bg-background'>
      <ContactBackground />

      <div className='relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16'>
        <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start'>
          <ContactIntro settings={settings} />
          <ContactMainCard links={contactLinks} />
        </div>

        <SupportSection />
      </div>
    </main>
  );
}

function ContactIntro({ settings }: { settings: StorefrontSiteSettings }) {
  const primaryPhone = settings.supportPhone ?? settings.supportMobile;
  const primaryPhoneHref = normalizeTelHref(primaryPhone);
  const whatsappHref = settings.whatsappUrl;

  const hasDirectContact = Boolean(primaryPhoneHref || whatsappHref);

  return (
    <section className='rounded-[28px] border border-border bg-surface p-6 shadow-panel lg:p-8'>
      <div className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-extrabold text-brand'>
        <Headphones className='size-4' />
        <span>تماس با {settings.siteName}</span>
      </div>

      <h1 className='mt-6 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl lg:text-5xl'>
        برای انتخاب قطعه مناسب، کنار شما هستیم
      </h1>

      <p className='mt-5 text-base leading-9 text-foreground-secondary lg:text-lg'>
        اگر برای انتخاب قطعه، بررسی سازگاری با خودرو، قیمت، موجودی یا پیگیری سفارش نیاز به راهنمایی
        دارید، از طریق راه‌های ارتباطی ثبت‌شده با {settings.siteName} در تماس باشید.
      </p>

      <div className='mt-8 rounded-3xl border border-brand/15 bg-brand-soft/70 p-5'>
        <div className='flex items-start gap-3'>
          <span className='mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-brand text-white'>
            <Sparkles className='size-5 stroke-[1.8]' />
          </span>

          <p className='text-sm leading-7 font-bold text-foreground'>
            فعلاً {settings.siteName} آدرس حضوری ندارد و پشتیبانی از طریق تماس تلفنی و پیام‌رسان‌ها
            انجام می‌شود.
          </p>
        </div>
      </div>

      {hasDirectContact ? (
        <div className='mt-8 flex flex-wrap gap-3'>
          {primaryPhoneHref ? (
            <Link
              href={primaryPhoneHref}
              className='inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl bg-brand px-7 text-sm font-extrabold text-brand-foreground shadow-[0_14px_30px_rgb(255_92_0/0.24)] transition hover:-translate-y-0.5 hover:bg-brand-hover'
            >
              <Phone className='size-5' />
              <span>تماس با پشتیبانی</span>
            </Link>
          ) : null}

          {whatsappHref ? (
            <Link
              href={whatsappHref}
              target='_blank'
              rel='noreferrer'
              className='group inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-7 text-sm font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand'
            >
              <span className='flex size-5 items-center justify-center'>
                <SocialMaskIcon
                  src='/icons/social/whatsapp.svg'
                  className='block size-5 bg-current text-foreground-secondary transition-colors duration-300 group-hover:text-brand dark:text-foreground-secondary'
                />
              </span>

              <span>پیام در واتساپ</span>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className='mt-8 rounded-2xl border border-dashed border-border bg-background/60 p-4 text-sm leading-7 text-foreground-secondary'>
          هنوز شماره تماس یا لینک واتساپ در تنظیمات سایت ثبت نشده است.
        </div>
      )}
    </section>
  );
}

function ContactMainCard({ links }: { links: ContactLinkItem[] }) {
  return (
    <section className='rounded-[2rem] border border-border bg-surface p-5 shadow-panel lg:p-6'>
      <div className='mb-5'>
        <h2 className='text-lg font-extrabold text-foreground'>راه‌های ارتباطی</h2>
        <p className='mt-1 text-sm text-foreground-secondary'>
          از مسیر دلخواه خودتان با ما در ارتباط باشید.
        </p>
      </div>

      {links.length > 0 ? (
        <div className='grid gap-3'>
          {links.map((item) => (
            <ContactLinkCard key={item.title} item={item} />
          ))}
        </div>
      ) : (
        <div className='rounded-2xl border border-dashed border-border bg-background/60 p-5 text-sm leading-7 text-foreground-secondary'>
          هنوز اطلاعات تماس در تنظیمات سایت ثبت نشده است.
        </div>
      )}
    </section>
  );
}

function ContactLinkCard({ item }: { item: ContactLinkItem }) {
  const isExternal = item.href.startsWith('http');

  return (
    <Link
      href={item.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      className='group flex items-center justify-between gap-4 rounded-3xl border border-border bg-background/60 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand-soft/50 hover:shadow-md'
    >
      <div className='flex min-w-0 items-center gap-4'>
        <span
          className={
            item.primary
              ? 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_rgb(255_92_0/0.22)] transition group-hover:scale-110'
              : 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface shadow-sm transition group-hover:scale-110 group-hover:bg-white'
          }
        >
          <ContactIcon item={item} />
        </span>

        <div className='min-w-0'>
          <h3 className='text-base font-extrabold text-foreground transition group-hover:text-brand'>
            {item.title}
          </h3>

          <p className='mt-1 text-sm leading-6 text-foreground-secondary'>{item.description}</p>
        </div>
      </div>

      <span className='shrink-0 text-left text-sm font-extrabold text-foreground-secondary transition group-hover:text-brand max-sm:hidden'>
        {formatContactValue(item.value)}
      </span>
    </Link>
  );
}

function ContactIcon({ item }: { item: ContactLinkItem }) {
  if (item.iconSrc && item.primary) {
    return (
      <span aria-hidden='true'>
        <span
          className='block size-7 bg-current text-white'
          style={{
            WebkitMask: `url(${item.iconSrc}) center / contain no-repeat`,
            mask: `url(${item.iconSrc}) center / contain no-repeat`,
          }}
        />
      </span>
    );
  }

  if (item.iconSrc) {
    return (
      <span
        aria-hidden='true'
        className='block size-7 bg-current text-foreground-secondary transition-colors duration-300 group-hover:text-brand'
        style={{
          WebkitMask: `url(${item.iconSrc}) center / contain no-repeat`,
          mask: `url(${item.iconSrc}) center / contain no-repeat`,
        }}
      />
    );
  }

  if (item.icon) {
    const Icon = item.icon;

    return <Icon className='size-7 stroke-[1.8] text-current transition-colors duration-300' />;
  }

  return null;
}

function SupportSection() {
  return (
    <section className='mt-6 grid gap-4 md:grid-cols-3'>
      {SUPPORT_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.title}
            className='group overflow-hidden rounded-[24px] border border-border bg-surface p-6 text-right shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-panel'
          >
            <div className='mb-5 flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand transition duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white'>
              <Icon className='size-7 stroke-[1.8]' />
            </div>

            <h3 className='text-lg font-black text-foreground'>{item.title}</h3>

            <p className='mt-3 text-sm leading-7 text-foreground-secondary'>{item.description}</p>
          </article>
        );
      })}
    </section>
  );
}

function ContactBackground() {
  return (
    <>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/90 to-transparent dark:from-white/5' />
      <div className='pointer-events-none absolute top-32 -right-24 size-72 rounded-full border border-info/15' />
      <div className='pointer-events-none absolute top-16 -left-24 size-96 rounded-full bg-brand/5 blur-3xl' />
      <div className='pointer-events-none absolute right-0 bottom-12 size-80 rounded-full bg-info/5 blur-3xl' />
    </>
  );
}

function SocialMaskIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden='true'
      className={className}
      style={{
        WebkitMask: `url(${src}) center / contain no-repeat`,
        mask: `url(${src}) center / contain no-repeat`,
      }}
    />
  );
}
