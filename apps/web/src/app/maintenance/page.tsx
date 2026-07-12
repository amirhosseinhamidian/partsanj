import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock3, Headphones, Wrench } from 'lucide-react';

import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  return buildSeoMetadata({
    title: 'در حال بروزرسانی',

    description: `${settings.siteName} موقتاً برای بروزرسانی و بهبود خدمات در دسترس نیست و به‌زودی بازمی‌گردد.`,

    /**
     * صفحه تعمیرات نباید ایندکس شود
     * و نیازی به دنبال‌شدن لینک‌های آن نیز نیست.
     */
    privatePage: true,
  });
}

export default async function MaintenancePage() {
  const settings = await getStorefrontSiteSettings();

  const contactHref = settings.whatsappUrl?.trim() || settings.telegramUrl?.trim() || '/contact';

  const isExternalContact = contactHref.startsWith('http://') || contactHref.startsWith('https://');

  return (
    <main className='relative min-h-screen overflow-hidden bg-background'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(255_92_0/0.12),transparent_34%),radial-gradient(circle_at_80%_20%,rgb(15_23_42/0.08),transparent_30%)]' />

      <div className='relative z-10 mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5 py-12'>
        <section
          aria-labelledby='maintenance-title'
          className='w-full rounded-[2rem] border border-border bg-surface p-7 text-center shadow-panel sm:p-10'
        >
          <div className='mx-auto grid size-20 place-items-center rounded-[1.75rem] bg-brand-soft text-brand'>
            <Wrench aria-hidden='true' className='size-10 stroke-[1.7]' />
          </div>

          <h1
            id='maintenance-title'
            className='mt-7 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl'
          >
            به‌زودی برمی‌گردیم
          </h1>

          <p className='mx-auto mt-4 max-w-xl text-sm leading-8 text-foreground-secondary sm:text-base'>
            {settings.siteName} موقتاً برای بروزرسانی و بهبود تجربه خرید در دسترس نیست. لطفاً کمی
            بعد دوباره مراجعه کنید.
          </p>

          <div className='mt-7 grid gap-3 rounded-3xl border border-border bg-background/70 p-4 text-right sm:grid-cols-2'>
            <div className='flex items-start gap-3'>
              <span className='grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand'>
                <Clock3 aria-hidden='true' className='size-5' />
              </span>

              <div>
                <p className='font-extrabold text-foreground'>اختلال موقت</p>

                <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                  پس از پایان بروزرسانی، سایت دوباره فعال می‌شود.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <span className='grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand'>
                <Headphones aria-hidden='true' className='size-5' />
              </span>

              <div>
                <p className='font-extrabold text-foreground'>نیاز به راهنمایی دارید؟</p>

                <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                  می‌توانید از مسیرهای ارتباطی با پشتیبانی تماس بگیرید.
                </p>
              </div>
            </div>
          </div>

          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <Link
              href={contactHref}
              target={isExternalContact ? '_blank' : undefined}
              rel={isExternalContact ? 'noopener noreferrer' : undefined}
              className='inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-extrabold text-brand-foreground shadow-[0_14px_30px_rgb(255_92_0/0.24)] transition hover:-translate-y-0.5 hover:bg-brand-hover'
            >
              پیام به پشتیبانی
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
