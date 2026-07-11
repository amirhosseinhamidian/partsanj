'use client';

import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, Search } from 'lucide-react';

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main dir='rtl' className='relative min-h-[calc(100vh-120px)] overflow-hidden bg-background'>
      <ErrorBackground />

      <section className='relative mx-auto flex min-h-[calc(100vh-120px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid w-full items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]'>
          <div className='order-2 lg:order-1'>
            <ErrorVisual />
          </div>

          <div className='order-1 text-right lg:order-2'>
            <div className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-extrabold text-brand'>
              <AlertTriangle className='size-4' />
              <span>خطای غیرمنتظره</span>
            </div>

            <h1 className='mt-6 text-3xl leading-[1.7] font-black text-foreground sm:text-4xl lg:text-5xl'>
              مشکلی در نمایش این بخش پیش آمد
            </h1>

            <p className='mt-5 max-w-2xl text-base leading-9 text-foreground-secondary lg:text-lg'>
              درخواست شما با خطا مواجه شد. می‌توانید دوباره تلاش کنید یا به صفحه اصلی برگردید و مسیر
              دیگری را انتخاب کنید.
            </p>

            {error.digest ? (
              <p className='mt-4 inline-flex rounded-2xl border border-border bg-surface px-4 py-2 text-xs font-bold text-foreground-secondary'>
                کد پیگیری خطا: {error.digest}
              </p>
            ) : null}

            <div className='mt-8 flex flex-wrap gap-3'>
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

              <Link
                href='/products'
                className='inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-7 text-sm font-extrabold text-foreground transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand'
              >
                <Search className='size-5' />
                <span>مشاهده محصولات</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ErrorVisual() {
  return (
    <div className='relative mx-auto flex min-h-[320px] max-w-[520px] items-center justify-center rounded-[32px] border border-border bg-surface p-8 shadow-panel sm:min-h-[420px]'>
      <div className='absolute inset-6 rounded-[28px] border border-dashed border-brand/20' />

      <div className='relative text-center'>
        <div className='mx-auto mb-6 flex size-24 items-center justify-center rounded-[28px] bg-brand-soft text-brand shadow-sm'>
          <AlertTriangle className='size-12 stroke-[1.7]' />
        </div>

        <div className='text-7xl font-black tracking-[-6px] text-brand select-none sm:text-8xl'>
          ۵۰۰
        </div>

        <p className='mt-4 text-sm font-bold text-foreground-secondary'>خطا در پردازش درخواست</p>
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
