import { CarFront, CircleDollarSign, FileSearch, ShieldCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type HomeBenefitsProps = {
  className?: string;
};

type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const BENEFITS: BenefitItem[] = [
  {
    title: 'سازگاری دقیق با خودرو',
    description: 'قطعات متناسب با مدل و تیپ خودروی شما برای انتخاب مطمئن‌تر بررسی می‌شود',
    icon: CarFront,
  },
  {
    title: 'کاهش خطای خرید',
    description: 'با بررسی دقیق‌تر، احتمال انتخاب قطعه اشتباه یا ناسازگار کمتر می‌شود',
    icon: ShieldCheck,
  },
  {
    title: 'اطلاعات فنی شفاف',
    description: 'مشخصات، کد فنی و جزئیات کاربردی محصول واضح‌تر نمایش داده می‌شود',
    icon: FileSearch,
  },
  {
    title: 'قیمت‌گذاری شفاف',
    description: 'قیمت محصولات روشن و بدون ابهام نمایش داده می‌شود تا انتخاب راحت‌تر باشد',
    icon: CircleDollarSign,
  },
];

export function HomeBenefits({ className }: HomeBenefitsProps) {
  return (
    <section aria-label='مزیت‌های پارت‌سنج' className={cn('bg-background py-6 sm:py-8', className)}>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='overflow-hidden rounded-[22px] border border-border bg-surface shadow-panel'>
          <div className='grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x-0 sm:divide-y md:grid-cols-2 lg:grid-cols-4 lg:divide-x-0 lg:divide-y-0'>
            {BENEFITS.map((benefit, index) => (
              <BenefitStripItem
                key={benefit.title}
                benefit={benefit}
                isLast={index === BENEFITS.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitStripItem({ benefit, isLast }: { benefit: BenefitItem; isLast: boolean }) {
  const Icon = benefit.icon;

  return (
    <article
      className={cn(
        'group relative flex min-h-[118px] items-center gap-4 overflow-hidden p-5 transition-all duration-300 ease-out sm:p-6',
        'hover:-translate-y-1 hover:bg-orange-50/70 dark:hover:bg-surface-muted',
        !isLast &&
          'lg:after:absolute lg:after:inset-y-6 lg:after:left-0 lg:after:w-px lg:after:bg-border lg:after:transition-colors lg:after:duration-300',
      )}
    >
      <span className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
        <span className='absolute -top-10 -right-10 size-28 rounded-full bg-orange-500/10 blur-2xl' />
      </span>

      <span className='relative flex size-14 shrink-0 items-center justify-center rounded-2xl text-brand transition-all duration-300 ease-out group-hover:scale-110 group-hover:bg-white group-hover:text-orange-500 group-hover:shadow-[0_10px_24px_rgba(249,115,22,0.18)] sm:size-16 dark:group-hover:bg-background'>
        <Icon className='size-10 stroke-[1.75] transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:rotate-[-4deg] sm:size-11' />
      </span>

      <div className='relative flex-1 text-right'>
        <h3 className='text-base font-extrabold text-foreground transition-colors duration-300 group-hover:text-orange-600'>
          {benefit.title}
        </h3>

        <p className='mt-1.5 text-sm leading-6 text-foreground-secondary transition-colors duration-300 group-hover:text-slate-600 dark:group-hover:text-slate-100'>
          {benefit.description}
        </p>
      </div>
    </article>
  );
}
