'use client';

import {
  CarFront,
  Headphones,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  getCategoryProductsHref,
  type StorefrontCategoryNavigationItem,
} from '@/lib/storefront/catalog/category-navigation';
import {
  storefrontCategoryLinks,
  storefrontSiteConfig,
  type StorefrontFooterLink,
} from '@/lib/storefront/site-config';
import { PartSanjLogo } from '@/lib/storefront/shared/partsanj-logo';

import { useStorefrontCategoryNavigation } from './storefront-category-navigation';
import { useStorefrontSettings } from './storefront-settings-provider';
import { toPersianDigits } from '@/lib/utils/digits';

type StorefrontFooterProps = {
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
};

type FooterSocialLink = {
  label: string;
  href: string;
  iconSrc: string;
};

const socialIconPaths = {
  instagram: '/icons/social/instagram.svg',
  whatsapp: '/icons/social/whatsapp.svg',
  telegram: '/icons/social/telegram.svg',
  bale: '/icons/social/bale.svg',
} as const;

const storefrontQuickLinks: StorefrontFooterLink[] = [
  {
    label: 'همه محصولات',
    href: '/products',
  },
  {
    label: 'سبد خرید',
    href: '/cart',
  },
  {
    label: 'حساب کاربری',
    href: '/account',
  },
  {
    label: 'پیگیری سفارش‌ها',
    href: '/account/orders',
  },
  {
    label: 'آموزش و مقالات',
    href: '/blog',
  },
];

const storefrontEssentialLinks: StorefrontFooterLink[] = [
  {
    label: 'درباره ما',
    href: '/about',
  },
  {
    label: 'تماس با ما',
    href: '/contact',
  },
  {
    label: 'رویه بازگشت کالا',
    href: '/returns',
  },
  {
    label: 'قوانین و مقررات',
    href: '/terms',
  },
  {
    label: 'حریم خصوصی',
    href: '/privacy',
  },
];

const storefrontBottomLinks: StorefrontFooterLink[] = [
  {
    label: 'قوانین',
    href: '/terms',
  },
  {
    label: 'حریم خصوصی',
    href: '/privacy',
  },
  {
    label: 'بازگشت کالا',
    href: '/returns',
  },
];

const footerHighlights: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: 'انتخاب براساس خودرو',
    description: 'کاهش احتمال خرید قطعه ناسازگار',
    icon: CarFront,
  },
  {
    title: 'پشتیبانی خرید',
    description: 'راهنمایی پیش از ثبت سفارش',
    icon: Headphones,
  },
  {
    title: 'رویه بازگشت کالا',
    description: 'شرایط شفاف برای بررسی درخواست',
    icon: RotateCcw,
  },
  {
    title: 'خرید آگاهانه‌تر',
    description: 'نمایش مشخصات و سازگاری قطعه',
    icon: ShieldCheck,
  },
];

function isValidExternalUrl(value: string | null | undefined): value is string {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function getPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

function createCategoryLinks(
  categories: StorefrontCategoryNavigationItem[],
): StorefrontFooterLink[] {
  if (categories.length === 0) {
    return storefrontCategoryLinks;
  }

  return categories.slice(0, 6).map((category) => ({
    label: category.name,
    href: getCategoryProductsHref(category.slug),
  }));
}

function FooterLinkList({
  title,
  links,
  id,
}: {
  title: string;
  links: StorefrontFooterLink[];
  id?: string;
}) {
  return (
    <section id={id}>
      <h2 className='text-sm font-extrabold text-foreground'>{title}</h2>

      <ul className='mt-4 space-y-3'>
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <Link
              href={link.href}
              className='inline-flex text-sm text-foreground-secondary transition-colors hover:text-brand'
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SocialLinks({ links }: { links: FooterSocialLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className='mt-6'>
      <p className='text-xs font-bold text-foreground-muted'>پارت‌سنج در شبکه‌های اجتماعی</p>

      <div className='mt-3 flex flex-wrap gap-2'>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={link.label}
            title={link.label}
            className='grid size-10 place-items-center rounded-control border border-border bg-surface transition-colors hover:border-brand/40 hover:bg-brand-soft'
          >
            <Image
              src={link.iconSrc}
              alt=''
              width={20}
              height={20}
              className='size-5 object-contain'
              aria-hidden='true'
            />
          </a>
        ))}
      </div>
    </div>
  );
}

export function StorefrontFooter({ logoLightUrl, logoDarkUrl }: StorefrontFooterProps) {
  const settings = useStorefrontSettings();
  const { categories } = useStorefrontCategoryNavigation();

  const categoryLinks = useMemo(() => createCategoryLinks(categories), [categories]);

  const socialLinks = useMemo<FooterSocialLink[]>(() => {
    const candidates: (FooterSocialLink | null)[] = [
      isValidExternalUrl(settings.instagramUrl)
        ? {
            label: 'اینستاگرام پارت‌سنج',
            href: settings.instagramUrl,
            iconSrc: socialIconPaths.instagram,
          }
        : null,
      isValidExternalUrl(settings.whatsappUrl)
        ? {
            label: 'واتساپ پارت‌سنج',
            href: settings.whatsappUrl,
            iconSrc: socialIconPaths.whatsapp,
          }
        : null,
      isValidExternalUrl(settings.telegramUrl)
        ? {
            label: 'تلگرام پارت‌سنج',
            href: settings.telegramUrl,
            iconSrc: socialIconPaths.telegram,
          }
        : null,
      isValidExternalUrl(settings.baleUrl)
        ? {
            label: 'بله پارت‌سنج',
            href: settings.baleUrl,
            iconSrc: socialIconPaths.bale,
          }
        : null,
    ];

    return candidates.filter((link): link is FooterSocialLink => link !== null);
  }, [settings.baleUrl, settings.instagramUrl, settings.telegramUrl, settings.whatsappUrl]);

  const contact = storefrontSiteConfig.contact;
  const siteDescription = settings.siteTagline?.trim() || storefrontSiteConfig.description;
  const siteName = settings.siteName?.trim() || storefrontSiteConfig.name;

  const hasContactDetails = Boolean(
    settings.supportPhone || settings.supportMobile || contact.email || contact.address,
  );

  return (
    <footer className='mt-12 border-t border-border bg-surface'>
      <div className='mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
        <div className='grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))]'>
          <section id='about' className='sm:col-span-2 lg:col-span-2 xl:col-span-1'>
            <PartSanjLogo
              logoLightUrl={logoLightUrl ?? settings.logoLightUrl}
              logoDarkUrl={logoDarkUrl ?? settings.logoDarkUrl}
            />

            <p className='mt-5 max-w-md text-sm leading-7 text-foreground-secondary'>
              {siteDescription}
            </p>

            <Link
              href='/products'
              className='mt-5 inline-flex items-center gap-2 rounded-control bg-brand-soft px-3 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white'
            >
              <CarFront className='size-4' aria-hidden='true' />
              انتخاب قطعه براساس خودرو
            </Link>

            <SocialLinks links={socialLinks} />
          </section>

          <FooterLinkList title='دسته‌بندی محصولات' links={categoryLinks} />

          <FooterLinkList title='دسترسی سریع' links={storefrontQuickLinks} />

          <FooterLinkList title='لینک‌های ضروری' links={storefrontEssentialLinks} />

          <section id='contact'>
            <h2 className='text-sm font-extrabold text-foreground'>ارتباط با پارت‌سنج</h2>

            {hasContactDetails ? (
              <ul className='mt-4 space-y-3 text-sm text-foreground-secondary'>
                {settings.supportPhone ? (
                  <li>
                    <a
                      href={getPhoneHref(settings.supportPhone)}
                      className='flex items-center gap-2 transition-colors hover:text-brand'
                    >
                      <Phone className='size-4 shrink-0 text-brand' aria-hidden='true' />
                      <span>{toPersianDigits(settings.supportPhone)}</span>
                    </a>
                  </li>
                ) : null}

                {settings.supportMobile ? (
                  <li>
                    <a
                      href={getPhoneHref(settings.supportMobile)}
                      className='flex items-center gap-2 transition-colors hover:text-brand'
                    >
                      <Phone className='size-4 shrink-0 text-brand' aria-hidden='true' />
                      <span>{toPersianDigits(settings.supportMobile)}</span>
                    </a>
                  </li>
                ) : null}

                {contact.email ? (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className='flex items-center gap-2 transition-colors hover:text-brand'
                    >
                      <Mail className='size-4 shrink-0 text-brand' aria-hidden='true' />
                      <span dir='ltr'>{contact.email}</span>
                    </a>
                  </li>
                ) : null}

                {contact.address ? (
                  <li className='flex items-start gap-2 leading-6'>
                    <MapPin className='mt-1 size-4 shrink-0 text-brand' aria-hidden='true' />
                    <span>{contact.address}</span>
                  </li>
                ) : null}
              </ul>
            ) : (
              <div className='mt-4 rounded-card border border-dashed border-border bg-surface-muted p-4'>
                <p className='text-sm leading-6 text-foreground-secondary'>
                  اطلاعات تماس فروشگاه پس از تکمیل تنظیمات سایت در این بخش نمایش داده می‌شود.
                </p>
              </div>
            )}

            <div className='mt-5 space-y-2'>
              <Link
                href='/contact'
                className='inline-flex items-center gap-2 text-sm font-bold text-brand transition-colors hover:text-brand-hover'
              >
                <Headphones className='size-4' aria-hidden='true' />
                دریافت راهنمایی خرید
              </Link>

              <Link
                href='/cart'
                className='flex items-center gap-2 text-sm font-bold text-foreground-secondary transition-colors hover:text-brand'
              >
                <ShoppingCart className='size-4' aria-hidden='true' />
                مشاهده سبد خرید
              </Link>

              <Link
                href='/account'
                className='flex items-center gap-2 text-sm font-bold text-foreground-secondary transition-colors hover:text-brand'
              >
                <UserRound className='size-4' aria-hidden='true' />
                ورود به حساب کاربری
              </Link>
            </div>

            <div className='mt-6'>
              <p className='text-xs font-bold text-foreground-muted'>نماد اعتماد الکترونیکی</p>

              <a
                referrerPolicy='origin'
                target='_blank'
                rel='noopener noreferrer'
                href='https://trustseal.enamad.ir/?id=6937477&Code=3mFvy0fA2rHoD3qOn8naXI4VVDVqfxJG'
                aria-label='مشاهده اعتبار نماد اعتماد الکترونیکی پارت‌سنج'
                title='نماد اعتماد الکترونیکی پارت‌سنج'
                className='mt-3 inline-flex rounded-card border border-border bg-white p-2 transition-colors hover:border-brand/40'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  referrerPolicy='origin'
                  src='https://trustseal.enamad.ir/logo.aspx?id=6937477&Code=3mFvy0fA2rHoD3qOn8naXI4VVDVqfxJG'
                  alt='نماد اعتماد الکترونیکی پارت‌سنج'
                  width={125}
                  height={136}
                  loading='lazy'
                  className='h-28 w-auto object-contain'
                />
              </a>
            </div>
          </section>
        </div>

        <section
          aria-label='مزیت‌های خرید از پارت‌سنج'
          className='mt-10 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4'
        >
          {footerHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className='flex items-start gap-3 bg-surface-muted p-4'>
                <span className='grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                  <Icon className='size-5' aria-hidden='true' />
                </span>

                <div>
                  <h2 className='text-sm font-extrabold text-foreground'>{item.title}</h2>
                  <p className='mt-1 text-xs leading-5 text-foreground-secondary'>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <div className='mt-8 flex flex-col gap-4 border-t border-border pt-6 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between'>
          <p>
            © {new Date().getFullYear()} تمامی حقوق این وب‌سایت متعلق به {siteName} است.
          </p>

          <nav aria-label='پیوندهای حقوقی پایین سایت' className='flex flex-wrap gap-x-4 gap-y-2'>
            {storefrontBottomLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className='transition-colors hover:text-foreground'
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
