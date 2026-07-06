'use client';

import {
  House,
  MapPinned,
  Package,
  Store,
  UserRound,
  CarFront,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AccountNavigationVariant = 'desktop' | 'mobile';

type AccountNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AccountNavigationProps = {
  variant: AccountNavigationVariant;
};

const navigationItems: AccountNavigationItem[] = [
  {
    href: '/account',
    label: 'داشبورد',
    icon: House,
  },
  {
    href: '/account/orders',
    label: 'سفارش‌های من',
    icon: Package,
  },
  {
    href: '/account/vehicles',
    label: 'خودروهای من',
    icon: CarFront,
  },
  {
    href: '/account/addresses',
    label: 'آدرس‌ها',
    icon: MapPinned,
  },
  {
    href: '/account/profile',
    label: 'اطلاعات حساب',
    icon: UserRound,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/account') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNavigation({ variant }: AccountNavigationProps) {
  const pathname = usePathname();

  if (variant === 'mobile') {
    return (
      <nav aria-label='ناوبری حساب کاربری' className='overflow-x-auto'>
        <div className='flex min-w-max gap-2'>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex min-h-12 items-center justify-center gap-2 rounded-control px-4 text-sm font-bold transition-colors',
                  active
                    ? 'bg-brand text-white shadow-sm [&_svg]:text-white'
                    : 'bg-surface-muted text-foreground-secondary hover:bg-surface hover:text-foreground',
                ].join(' ')}
              >
                <Icon className='size-4 shrink-0' />
                <span className='whitespace-nowrap'>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label='ناوبری حساب کاربری'
      className='rounded-card border border-border bg-surface p-3 shadow-panel'
    >
      <div className='border-b border-border px-3 pt-3 pb-5'>
        <p className='text-2xl font-extrabold text-foreground'>حساب کاربری</p>

        <p className='mt-2 text-sm leading-7 text-foreground-secondary'>
          سفارش‌ها، آدرس‌ها و اطلاعات حساب خود را مدیریت کنید
        </p>
      </div>

      <div className='mt-3 space-y-1'>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-h-12 items-center gap-3 rounded-control px-3 text-sm font-bold transition-colors',
                active
                  ? 'bg-brand text-white shadow-sm [&_svg]:text-white'
                  : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground',
              ].join(' ')}
            >
              <Icon className='size-5 shrink-0' />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className='mt-3 border-t border-border pt-3'>
        <Link
          href='/products'
          className='flex min-h-12 items-center gap-3 rounded-control px-3 text-sm font-bold text-foreground-secondary transition-colors hover:bg-surface-muted hover:text-foreground'
        >
          <Store className='size-5 shrink-0' />
          <span>بازگشت به فروشگاه</span>
        </Link>
      </div>
    </nav>
  );
}
