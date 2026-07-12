import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Home, Search, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'صفحه پیدا نشد',

  description: 'صفحه‌ای که به دنبال آن هستید پیدا نشد، حذف شده یا آدرس آن تغییر کرده است.',
  robots: {
    index: false,
    follow: true,

    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function NotFoundPage() {
  return (
    <main dir='rtl' className='relative min-h-[calc(100vh-120px)] overflow-hidden bg-background'>
      <ErrorBackground />

      <section className='relative mx-auto flex min-h-[calc(100vh-120px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid w-full items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]'>
          <div className='order-2 lg:order-1'>
            <ErrorVisual code='۴۰۴' />
          </div>

          <div className='order-1 text-right lg:order-2'>
            <div className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-extrabold text-brand'>
              <Wrench aria-hidden='true' className='size-4' />

              <span>مسیر اشتباه است</span>
            </div>

            <h1 className='mt-6 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl lg:text-5xl'>
              این قطعه از مسیر پیدا نشد!
            </h1>

            <p className='mt-5 max-w-2xl text-base leading-9 text-foreground-secondary lg:text-lg'>
              صفحه‌ای که باز کرده‌اید وجود ندارد، حذف شده یا آدرس آن تغییر کرده است. می‌توانید به
              صفحه اصلی برگردید یا بین محصولات پارت‌سنج جست‌وجو کنید.
            </p>

            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                href='/'
                className='inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl bg-brand px-7 text-sm font-extrabold text-brand-foreground shadow-[0_14px_30px_rgb(255_92_0/0.24)] transition hover:-translate-y-0.5 hover:bg-brand-hover'
              >
                <Home aria-hidden='true' className='size-5' />

                <span>بازگشت به خانه</span>
              </Link>

              <Link
                href='/products'
                className='inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-7 text-sm font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand'
              >
                <Search aria-hidden='true' className='size-5' />

                <span>مشاهده محصولات</span>
              </Link>
            </div>

            <Link
              href='/contact'
              className='mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground-secondary transition hover:text-brand'
            >
              <ArrowRight aria-hidden='true' className='size-4' />

              <span>نیاز به راهنمایی دارید؟ تماس با پشتیبانی</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ErrorVisual({ code }: { code: string }) {
  return (
    <div className='relative mx-auto flex min-h-[320px] max-w-[520px] items-center justify-center rounded-[32px] border border-border bg-surface p-8 shadow-panel sm:min-h-[420px]'>
      <div className='absolute inset-6 rounded-[28px] border border-dashed border-brand/20' />

      <div className='relative text-center'>
        <div className='mx-auto mb-6 flex size-24 items-center justify-center rounded-[28px] bg-brand-soft text-brand shadow-sm'>
          <Wrench aria-hidden='true' className='size-12 stroke-[1.7]' />
        </div>

        <div className='text-7xl font-black tracking-[-6px] text-brand select-none sm:text-8xl'>
          {code}
        </div>

        <p className='mt-4 text-sm font-bold text-foreground-secondary'>
          صفحه موردنظر در دسترس نیست
        </p>
      </div>
    </div>
  );
}

function ErrorBackground() {
  return (
    <>
      <div className='pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/90 to-transparent dark:from-white/5' />

      <div className='pointer-events-none absolute top-32 -right-24 size-72 rounded-full border border-info/15' />

      <div className='pointer-events-none absolute top-16 -left-24 size-96 rounded-full bg-brand/5 blur-3xl' />

      <div className='pointer-events-none absolute right-0 bottom-12 size-80 rounded-full bg-info/5 blur-3xl' />
    </>
  );
}
