import type { Metadata } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Clock3, Headphones, Phone, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'تماس با ما | پارت‌سنج',
  description:
    'راه‌های ارتباط با پارت‌سنج؛ تماس تلفنی، واتساپ، تلگرام، بله و اینستاگرام برای مشاوره انتخاب و خرید قطعات خودرو.',
};

const PHONE_DISPLAY = '۰۲۱-۹۱۳۰۱۰۰';
const PHONE_TEL = '0219130100';

type ContactLinkItem = {
  title: string;
  description: string;
  value: string;
  href: string;
  icon?: LucideIcon;
  iconSrc?: string;
  primary?: boolean;
};

const CONTACT_LINKS: ContactLinkItem[] = [
  {
    title: 'تماس تلفنی',
    description: 'برای مشاوره سریع و پیگیری سفارش',
    value: PHONE_DISPLAY,
    href: `tel:${PHONE_TEL}`,
    icon: Phone,
    primary: true,
  },
  {
    title: 'واتساپ',
    description: 'ارسال پیام و دریافت راهنمایی خرید',
    value: 'ارسال پیام در واتساپ',
    href: 'https://wa.me/989120000000',
    iconSrc: '/icons/social/whatsapp.svg',
  },
  {
    title: 'تلگرام',
    description: 'ارتباط سریع با پشتیبانی پارت‌سنج',
    value: 'ارسال پیام در تلگرام',
    href: 'https://t.me/partsanj',
    iconSrc: '/icons/social/telegram.svg',
  },
  {
    title: 'بله',
    description: 'ارتباط از طریق پیام‌رسان بله',
    value: 'ارسال پیام در بله',
    href: 'https://ble.ir/partsanj',
    iconSrc: '/icons/social/bale.svg',
  },
  {
    title: 'اینستاگرام',
    description: 'مشاهده اخبار، محصولات و آموزش‌ها',
    value: 'مشاهده صفحه اینستاگرام',
    href: 'https://instagram.com/partsanj',
    iconSrc: '/icons/social/instagram.svg',
  },
];

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

export default function ContactPage() {
  return (
    <main dir='rtl' className='bg-background'>
      <section className='relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10'>
        <ContactBackground />

        <div className='relative mx-auto max-w-7xl'>
          <section className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
            <ContactIntro />

            <ContactMainCard />
          </section>

          <SupportSection />
        </div>
      </section>
    </main>
  );
}

function ContactIntro() {
  return (
    <section className='rounded-[28px] border border-border bg-surface p-6 shadow-panel lg:p-8'>
      <div className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-extrabold text-brand'>
        <Headphones className='size-4' />
        <span>تماس با پارت‌سنج</span>
      </div>

      <h1 className='mt-6 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl lg:text-5xl'>
        برای انتخاب قطعه مناسب، کنار شما هستیم
      </h1>

      <p className='mt-5 text-base leading-9 text-foreground-secondary lg:text-lg'>
        اگر برای انتخاب قطعه، بررسی سازگاری با خودرو، قیمت، موجودی یا پیگیری سفارش نیاز به راهنمایی
        دارید، از طریق راه‌های ارتباطی زیر با پارت‌سنج در تماس باشید.
      </p>

      <div className='mt-8 rounded-3xl border border-brand/15 bg-brand-soft/70 p-5'>
        <div className='flex items-start gap-3'>
          <span className='mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-brand text-white'>
            <Sparkles className='size-5 stroke-[1.8]' />
          </span>

          <p className='text-sm leading-7 font-bold text-foreground'>
            فعلاً پارت‌سنج آدرس حضوری ندارد و پشتیبانی از طریق تماس تلفنی و پیام‌رسان‌ها انجام
            می‌شود.
          </p>
        </div>
      </div>

      <div className='mt-8 flex flex-wrap gap-3'>
        <Link
          href={`tel:${PHONE_TEL}`}
          className='inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl bg-brand px-7 text-sm font-extrabold text-brand-foreground shadow-[0_14px_30px_rgb(255_92_0/0.24)] transition hover:-translate-y-0.5 hover:bg-brand-hover'
        >
          <Phone className='size-5' />
          <span>تماس با پشتیبانی</span>
        </Link>

        <Link
          href='https://wa.me/989120000000'
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
      </div>
    </section>
  );
}

function ContactMainCard() {
  return (
    <section className='rounded-[28px] border border-border bg-surface p-5 shadow-panel lg:p-6'>
      <div className='mb-5 flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-black text-foreground'>راه‌های ارتباطی</h2>

          <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
            از مسیر دلخواه خودتان با ما در ارتباط باشید.
          </p>
        </div>

        <div className='mb-2 flex items-center gap-1'>
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand' />
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand/70' />
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand/40' />
        </div>
      </div>

      <div className='grid gap-4'>
        {CONTACT_LINKS.map((item) => (
          <ContactLinkCard key={item.title} item={item} />
        ))}
      </div>
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
        {item.value}
      </span>
    </Link>
  );
}

function ContactIcon({ item }: { item: ContactLinkItem }) {
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
