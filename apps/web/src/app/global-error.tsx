'use client';

import Link from 'next/link';
import { AlertOctagon, Home, RefreshCw } from 'lucide-react';
import './globals.css';

type GlobalErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang='fa' dir='rtl'>
      <body>
        <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10'>
          <div className='pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/90 to-transparent dark:from-white/5' />
          <div className='pointer-events-none absolute top-16 -left-24 size-96 rounded-full bg-brand/5 blur-3xl' />
          <div className='pointer-events-none absolute right-0 bottom-12 size-80 rounded-full bg-info/5 blur-3xl' />

          <section className='relative w-full max-w-2xl rounded-[32px] border border-border bg-surface p-6 text-center shadow-panel sm:p-10'>
            <div className='mx-auto flex size-24 items-center justify-center rounded-[28px] bg-brand-soft text-brand shadow-sm'>
              <AlertOctagon className='size-12 stroke-[1.7]' />
            </div>

            <h1 className='mt-8 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl'>
              خطای جدی در بارگذاری سایت
            </h1>

            <p className='mt-4 text-base leading-8 text-foreground-secondary'>
              بخشی از سایت به‌درستی بارگذاری نشد. دوباره تلاش کنید یا به صفحه اصلی برگردید.
            </p>

            {error.digest ? (
              <p className='mt-5 inline-flex rounded-2xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground-secondary'>
                کد پیگیری خطا: {error.digest}
              </p>
            ) : null}

            <div className='mt-8 flex flex-wrap justify-center gap-3'>
              <button
                type='button'
                onClick={reset}
                className='inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl bg-brand px-7 text-sm font-extrabold text-brand-foreground shadow-[0_14px_30px_rgb(255_92_0/0.24)] transition hover:-translate-y-0.5 hover:bg-brand-hover'
              >
                <RefreshCw className='size-5' />
                <span>تلاش دوباره</span>
              </button>

              <Link
                href='/'
                className='inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-7 text-sm font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand'
              >
                <Home className='size-5' />
                <span>بازگشت به خانه</span>
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
