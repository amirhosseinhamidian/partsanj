'use client';

import { Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { storefrontPrimaryNavigation } from '@/lib/storefront/site-config';
import { cn } from '@/lib/utils/cn';
import { PartSanjLogo } from '@/lib/storefront/shared/partsanj-logo';

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  if (href.startsWith('/products')) {
    return pathname.startsWith('/products');
  }

  return false;
}

function HeaderActionButton({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      type='button'
      disabled
      title='این بخش در فاز حساب کاربری و سبد خرید فعال می‌شود'
      aria-label={label}
      className='inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 text-sm font-semibold text-foreground-secondary opacity-75'
    >
      {children}
    </button>
  );
}

export function StorefrontHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className='sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur'>
      <div className='mx-auto flex min-h-18 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8'>
        <PartSanjLogo />

        <nav
          aria-label='ناوبری اصلی'
          className='hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex'
        >
          {storefrontPrimaryNavigation.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative inline-flex h-11 items-center px-3 text-sm font-semibold transition-colors',
                  'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-transform',
                  isActive
                    ? 'text-brand after:scale-x-100 after:bg-brand'
                    : 'text-foreground-secondary after:scale-x-0 hover:text-foreground hover:after:scale-x-100 hover:after:bg-border-strong',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className='ms-auto hidden items-center gap-2 lg:flex'>
          <Link
            href='/products'
            aria-label='جستجو در قطعات'
            className='grid size-10 place-items-center rounded-control border border-border bg-surface text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand'
          >
            <Search className='size-5' />
          </Link>

          <HeaderActionButton label='سبد خرید'>
            <ShoppingCart className='size-5' />
          </HeaderActionButton>

          <HeaderActionButton label='ورود یا ثبت‌نام'>
            <UserRound className='size-5' />
            ورود / ثبت‌نام
          </HeaderActionButton>
        </div>

        <button
          type='button'
          aria-label={isMobileMenuOpen ? 'بستن منوی سایت' : 'باز کردن منوی سایت'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className='ms-auto grid size-10 place-items-center rounded-control border border-border bg-surface text-foreground transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand lg:hidden'
        >
          {isMobileMenuOpen ? <X className='size-5' /> : <Menu className='size-5' />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className='border-t border-border bg-surface lg:hidden'>
          <div className='mx-auto w-full max-w-7xl px-4 py-4 sm:px-6'>
            <nav aria-label='ناوبری موبایل' className='grid gap-1'>
              {storefrontPrimaryNavigation.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'rounded-control px-4 py-3 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-brand-soft text-brand'
                        : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className='mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4'>
              <HeaderActionButton label='سبد خرید'>
                <ShoppingCart className='size-5' />
                سبد خرید
              </HeaderActionButton>

              <HeaderActionButton label='ورود یا ثبت‌نام'>
                <UserRound className='size-5' />
                ورود
              </HeaderActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
