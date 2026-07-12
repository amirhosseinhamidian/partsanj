import { CarFront, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import {
  storefrontCategoryLinks,
  storefrontGuideLinks,
  storefrontPrimaryNavigation,
  storefrontSiteConfig,
} from '@/lib/storefront/site-config';
import { PartSanjLogo } from '@/lib/storefront/shared/partsanj-logo';

type StorefrontFooterProps = {
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
};

function FooterLinkList({
  title,
  links,
  id,
}: {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
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
              className='text-sm text-foreground-secondary transition-colors hover:text-brand'
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function StorefrontFooter({ logoLightUrl, logoDarkUrl }: StorefrontFooterProps) {
  const contact = storefrontSiteConfig.contact;

  const hasContactDetails = Boolean(
    contact.phone || contact.mobile || contact.email || contact.address,
  );

  return (
    <footer className='mt-12 border-t border-border bg-surface'>
      <div className='mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
        <div className='grid gap-10 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))]'>
          <section id='about'>
            <PartSanjLogo logoLightUrl={logoLightUrl} logoDarkUrl={logoDarkUrl} />

            <p className='mt-5 max-w-sm text-sm leading-7 text-foreground-secondary'>
              {storefrontSiteConfig.description}
            </p>

            <div className='mt-6 rounded-card border border-border bg-surface-muted p-4'>
              <div className='flex items-start gap-3'>
                <span className='grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                  <ShieldCheck className='size-5' />
                </span>

                <div>
                  <p className='text-sm font-bold text-foreground'>انتخاب مطمئن‌تر قطعه</p>

                  <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                    قطعه را بر اساس خودرو، مدل و تیپ انتخاب کنید تا احتمال خرید اشتباه کاهش پیدا کند
                  </p>
                </div>
              </div>
            </div>
          </section>

          <FooterLinkList title='دسته‌بندی‌ها' links={storefrontCategoryLinks} />

          <FooterLinkList id='footer-guide' title='راهنمای خرید' links={storefrontGuideLinks} />

          <section id='contact'>
            <h2 className='text-sm font-extrabold text-foreground'>ارتباط با پارت‌سنج</h2>

            {hasContactDetails ? (
              <ul className='mt-4 space-y-3 text-sm text-foreground-secondary'>
                {contact.phone ? (
                  <li className='flex items-center gap-2'>
                    <Phone className='size-4 text-brand' />
                    <span dir='ltr'>{contact.phone}</span>
                  </li>
                ) : null}

                {contact.mobile ? (
                  <li className='flex items-center gap-2'>
                    <Phone className='size-4 text-brand' />
                    <span dir='ltr'>{contact.mobile}</span>
                  </li>
                ) : null}

                {contact.email ? (
                  <li className='flex items-center gap-2'>
                    <Mail className='size-4 text-brand' />
                    <span dir='ltr'>{contact.email}</span>
                  </li>
                ) : null}

                {contact.address ? (
                  <li className='flex items-start gap-2 leading-6'>
                    <MapPin className='mt-1 size-4 shrink-0 text-brand' />
                    <span>{contact.address}</span>
                  </li>
                ) : null}
              </ul>
            ) : (
              <div className='mt-4 rounded-card border border-dashed border-border bg-surface-muted p-4'>
                <p className='text-sm leading-6 text-foreground-secondary'>
                  اطلاعات تماس فروشگاه بعد از تکمیل پروفایل کسب‌وکار در این بخش نمایش داده می‌شود
                </p>
              </div>
            )}

            <Link
              href='/products#vehicle-selector'
              className='mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand transition-colors hover:text-brand-hover'
            >
              <CarFront className='size-4' />
              انتخاب قطعه براساس خودرو
            </Link>
          </section>
        </div>

        <div className='mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-foreground-muted sm:flex-row sm:items-center sm:justify-between'>
          <p>
            © {new Date().getFullYear()} تمامی حقوق این وب‌سایت متعلق به {storefrontSiteConfig.name}{' '}
            است
          </p>

          <nav aria-label='پیوندهای پایین سایت' className='flex flex-wrap gap-x-4 gap-y-2'>
            {storefrontPrimaryNavigation.slice(0, 4).map((item) => (
              <Link
                key={item.label}
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
