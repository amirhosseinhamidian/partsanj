import { CarFront, ClipboardList, ShieldCheck, Truck } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';

type HomePurchaseProcessProps = {
  className?: string;
};

const purchaseSteps = [
  {
    number: 1,
    title: 'انتخاب خودرو',
    description: 'با کد فنی',
    icon: CarFront,
  },
  {
    number: 2,
    title: 'بررسی سازگاری',
    description: 'اطمینان از تطابق قطعه با خودرو',
    icon: ShieldCheck,
  },
  {
    number: 3,
    title: 'ثبت سفارش',
    description: 'تکمیل اطلاعات و پرداخت امن',
    icon: ClipboardList,
  },
  {
    number: 4,
    title: 'ارسال به سراسر ایران',
    description: 'تحویل سریع درب منزل',
    icon: Truck,
  },
];

export function HomePurchaseProcess({ className }: HomePurchaseProcessProps) {
  return (
    <section
      dir='rtl'
      className={cn('mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8', className)}
    >
      <div className='mb-5 flex items-center gap-3'>
        <div className='mb-2 flex items-center gap-1'>
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand' />
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand/70' />
          <span className='h-5 w-1 rotate-12 rounded-full bg-brand/40' />
        </div>

        <h2
          id='home-main-categories-title'
          className='mt-1 text-lg font-extrabold tracking-tight text-foreground sm:text-xl'
        >
          روند خرید از پارت سنج
        </h2>
      </div>

      <div className='grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {purchaseSteps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === purchaseSteps.length - 1;

          return (
            <div key={step.number} className='group relative h-full'>
              {!isLast ? (
                <span className='pointer-events-none absolute top-1/2 left-[-22px] z-10 hidden w-9 border-t-2 border-dotted border-orange-500/70 transition-all duration-300 group-hover:w-11 group-hover:border-orange-600 xl:block' />
              ) : null}

              <article className='relative flex h-full min-h-[92px] items-center justify-between gap-2 overflow-hidden rounded-2xl border border-border bg-surface px-8 py-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-300 hover:shadow-[0_14px_34px_rgba(249,115,22,0.14)] dark:hover:border-orange-600'>
                <span className='pointer-events-none absolute inset-0 bg-gradient-to-l from-orange-50/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-orange-600/20' />

                <span className='relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-extrabold text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-600 group-hover:shadow-[0_6px_16px_rgba(249,115,22,0.35)]'>
                  {toPersianDigits(step.number)}
                </span>

                <div className='relative z-10 min-w-0 flex-1 pr-1 text-right'>
                  <h3 className='line-clamp-1 text-base font-extrabold text-slate-700 transition-colors duration-300 group-hover:text-slate-950 dark:text-slate-400 dark:group-hover:text-slate-50'>
                    {step.title}
                  </h3>

                  <p className='mt-1 line-clamp-2 text-xs leading-5 font-medium text-slate-400 transition-colors duration-300 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300'>
                    {step.description}
                  </p>
                </div>

                <div className='relative z-10 mr-4 flex h-12 w-12 shrink-0 items-center justify-center text-slate-900 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-110 group-hover:text-orange-500'>
                  <Icon strokeWidth={1.8} className='h-10 w-10' />
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </section>
  );
}
