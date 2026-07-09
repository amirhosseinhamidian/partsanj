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
        'relative flex min-h-[118px] items-center gap-4 p-5 sm:p-6',
        !isLast &&
          'lg:after:absolute lg:after:inset-y-6 lg:after:left-0 lg:after:w-px lg:after:bg-border',
      )}
    >
      <span className='flex size-14 shrink-0 items-center justify-center text-brand sm:size-16'>
        <Icon className='size-10 stroke-[1.75] sm:size-11' />
      </span>
      <div className='flex-1 text-right'>
        <h3 className='text-base font-extrabold text-foreground'>{benefit.title}</h3>

        <p className='mt-1.5 text-sm leading-6 text-foreground-secondary'>{benefit.description}</p>
      </div>
    </article>
  );
}
