'use client';

import {
  CarFront,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPinned,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useStorefrontCart } from '@/components/storefront/cart/storefront-cart-provider';
import { useStorefrontCustomerAuth } from '@/components/storefront/customer-auth/storefront-customer-auth-provider';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import type { StorefrontCustomerAuthUser } from '@/lib/storefront/customer-auth/customer-auth.types';
import { PartSanjLogo } from '@/lib/storefront/shared/partsanj-logo';
import { storefrontPrimaryNavigation } from '@/lib/storefront/site-config';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';

import {
  StorefrontCategoryDesktopMenu,
  StorefrontCategoryMobileMenu,
  useStorefrontCategoryNavigation,
} from './storefront-category-navigation';

type AccountShortcut = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type StorefrontHeaderProps = {
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
};

const accountShortcuts: AccountShortcut[] = [
  {
    href: '/account',
    label: 'داشبورد حساب',
    icon: LayoutDashboard,
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

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getCustomerDisplayName(user: StorefrontCustomerAuthUser | null) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

  return fullName || 'کاربر';
}

function getCustomerInitial(user: StorefrontCustomerAuthUser | null) {
  const displayName = getCustomerDisplayName(user);

  return displayName.charAt(0).toLocaleUpperCase('fa-IR');
}

function HeaderCartButton() {
  const { itemCount, isLoading } = useStorefrontCart();

  const displayCount = itemCount > 99 ? '۹۹+' : toPersianDigits(String(itemCount));

  return (
    <Link
      href='/cart'
      aria-label={itemCount > 0 ? `سبد خرید، ${displayCount} کالا` : 'سبد خرید'}
      className='relative grid size-10 shrink-0 place-items-center rounded-control border border-border bg-surface text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand'
    >
      <ShoppingCart className='size-5' />

      {!isLoading && itemCount > 0 ? (
        <span className='numeric absolute -end-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full border-2 border-surface bg-brand px-1 text-[10px] leading-5 font-extrabold text-white'>
          {displayCount}
        </span>
      ) : null}
    </Link>
  );
}

function HeaderCustomerMenu({ mobile = false, returnTo }: { mobile?: boolean; returnTo: string }) {
  const { status, user, openLogin, logout, isLoggingOut } = useStorefrontCustomerAuth();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const displayName = getCustomerDisplayName(user);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isOpen || mobile) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, mobile]);

  async function handleLogout() {
    setIsOpen(false);
    await logout();
  }

  function openCustomerLogin() {
    openLogin({
      returnTo,
    });
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'h-10 animate-pulse rounded-control bg-surface-muted',
          mobile ? 'w-full' : 'w-32',
        )}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        type='button'
        onClick={openCustomerLogin}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-control border border-border bg-surface px-3 text-sm font-semibold text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand',
          mobile && 'w-full',
        )}
      >
        <LogIn className='size-5' />
        ورود / ثبت‌نام
      </button>
    );
  }

  if (mobile) {
    return (
      <section className='rounded-card border border-border bg-surface-muted p-3'>
        <Link
          href='/account'
          className='flex items-center gap-3 rounded-control p-2 transition-colors hover:bg-surface'
        >
          <span className='grid size-11 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white'>
            {getCustomerInitial(user)}
          </span>

          <span className='min-w-0'>
            <span className='block truncate text-sm font-extrabold text-foreground'>
              {displayName}
            </span>

            <span className='mt-1 block text-xs text-foreground-secondary'>
              {user?.mobile ? toPersianDigits(user.mobile) : '—'}
            </span>
          </span>
        </Link>

        {isAdmin ? (
          <div className='mt-3 border-t border-border pt-3'>
            <Link
              href='/admin'
              className='flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand px-3 text-sm font-extrabold text-white transition-colors hover:bg-brand/90'
            >
              <ShieldCheck className='size-4 shrink-0' />
              ورود به پنل مدیریت
            </Link>
          </div>
        ) : null}

        <div className='mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3'>
          {accountShortcuts.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className='flex min-h-11 items-center gap-2 rounded-control bg-surface px-3 text-sm font-bold text-foreground-secondary transition-colors hover:bg-brand-soft hover:text-brand'
              >
                <Icon className='size-4 shrink-0' />
                <span className='truncate'>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          type='button'
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          className='mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control border border-danger/30 bg-surface px-3 text-sm font-bold text-danger transition-colors hover:bg-danger-soft disabled:pointer-events-none disabled:opacity-60'
        >
          <LogOut className='size-4' />
          خروج از حساب
        </button>
      </section>
    );
  }

  return (
    <div ref={menuRef} className='relative'>
      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        className='inline-flex h-10 items-center gap-2 rounded-control border border-border bg-surface px-2.5 text-sm font-semibold text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand'
      >
        <span className='grid size-6 place-items-center rounded-full bg-brand text-xs font-extrabold text-white'>
          {getCustomerInitial(user)}
        </span>

        <span className='max-w-28 truncate'>{displayName}</span>

        <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <div
          role='menu'
          className='absolute end-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-card border border-border bg-surface p-2 shadow-panel'
        >
          <Link
            href='/account'
            role='menuitem'
            onClick={() => setIsOpen(false)}
            className='flex items-center gap-3 rounded-control p-3 transition-colors hover:bg-surface-muted'
          >
            <span className='grid size-11 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-white'>
              {getCustomerInitial(user)}
            </span>

            <span className='min-w-0'>
              <span className='block truncate font-extrabold text-foreground'>{displayName}</span>

              <span className='mt-1 block text-xs text-foreground-secondary'>
                {user?.mobile ? toPersianDigits(user.mobile) : '—'}
              </span>
            </span>
          </Link>

          <div className='my-2 border-t border-border' />

          <div className='space-y-1'>
            {accountShortcuts.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role='menuitem'
                  onClick={() => setIsOpen(false)}
                  className='flex min-h-10 items-center gap-3 rounded-control px-3 text-sm font-bold text-foreground-secondary transition-colors hover:bg-brand-soft hover:text-brand'
                >
                  <Icon className='size-4 shrink-0' />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {isAdmin ? (
            <>
              <div className='my-2 border-t border-border' />

              <Link
                href='/admin'
                role='menuitem'
                onClick={() => setIsOpen(false)}
                className='flex min-h-10 items-center gap-3 rounded-control bg-brand-soft px-3 text-sm font-extrabold text-brand transition-colors hover:bg-brand hover:text-white'
              >
                <ShieldCheck className='size-4 shrink-0' />
                پنل مدیریت
              </Link>
            </>
          ) : null}

          <div className='my-2 border-t border-border' />

          <button
            type='button'
            role='menuitem'
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            className='flex min-h-10 w-full items-center gap-3 rounded-control px-3 text-sm font-bold text-danger transition-colors hover:bg-danger-soft disabled:pointer-events-none disabled:opacity-60'
          >
            <LogOut className='size-4 shrink-0' />
            خروج از حساب
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function StorefrontHeader({ logoLightUrl, logoDarkUrl }: StorefrontHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { categories: categoryNavigation, isLoading: isCategoriesLoading } =
    useStorefrontCategoryNavigation();

  const activeCategorySlug = searchParams.get('category');

  const searchParamsKey = searchParams.toString();

  const isProductsRoute = pathname === '/products' || pathname.startsWith('/products/');

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, searchParamsKey]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className='sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur'>
        <div className='mx-auto flex min-h-18 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8'>
          <PartSanjLogo logoLightUrl={logoLightUrl} logoDarkUrl={logoDarkUrl} />

          <nav
            aria-label='ناوبری اصلی'
            className='hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex'
          >
            {storefrontPrimaryNavigation.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <div key={item.href} className='flex items-center'>
                  <Link
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

                  {item.href === '/' ? (
                    <StorefrontCategoryDesktopMenu
                      categories={categoryNavigation}
                      isLoading={isCategoriesLoading}
                      activeCategorySlug={activeCategorySlug}
                      isProductsRoute={isProductsRoute}
                    />
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className='ms-auto hidden items-center gap-2 lg:flex'>
            <ThemeSwitcher />

            <HeaderCartButton />

            <HeaderCustomerMenu returnTo={pathname} />
          </div>

          <div className='ms-auto flex items-center gap-2 lg:hidden'>
            <ThemeSwitcher />

            <HeaderCartButton />

            <button
              type='button'
              aria-label={isMobileMenuOpen ? 'بستن منوی سایت' : 'باز کردن منوی سایت'}
              aria-expanded={isMobileMenuOpen}
              aria-controls='storefront-mobile-menu'
              onClick={() => {
                setIsMobileMenuOpen((current) => !current);
              }}
              className='grid size-10 shrink-0 place-items-center rounded-control border border-border bg-surface text-foreground transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand'
            >
              {isMobileMenuOpen ? <X className='size-5' /> : <Menu className='size-5' />}
            </button>
          </div>
        </div>
      </header>

      <div
        id='storefront-mobile-menu'
        aria-hidden={!isMobileMenuOpen}
        inert={!isMobileMenuOpen}
        className={cn(
          /*
           * مهم:
           * این منو عمداً بیرون از <header> قرار دارد.
           *
           * header دارای backdrop-blur است و backdrop-filter
           * می‌تواند برای عناصر fixed داخل خودش containing block
           * ایجاد کند و باعث شود منو هنگام scroll در جای اشتباه
           * نمایش داده شود.
           */
          'fixed inset-x-0 top-18 bottom-0 z-40 lg:hidden',

          'overflow-hidden bg-surface',

          'transition-[opacity,transform] duration-300 ease-out',
          'motion-reduce:transition-none',

          isMobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-3 opacity-0',
        )}
      >
        <div
          className={cn(
            /*
             * scroll فقط متعلق به خود منو است.
             */
            'h-full overflow-x-hidden overflow-y-auto',

            /*
             * مانع انتقال scroll از انتهای منو
             * به صفحه پشت آن می‌شود.
             */
            'overscroll-y-contain',

            /*
             * برای swipe عمودی روی موبایل.
             */
            'touch-pan-y',

            /*
             * اسکرول نرم iOS / Safari.
             */
            '[-webkit-overflow-scrolling:touch]',
          )}
        >
          <div className='min-h-full border-t border-border'>
            <div className='mx-auto w-full max-w-7xl px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6'>
              <nav aria-label='ناوبری موبایل' className='grid gap-1'>
                <div className='grid gap-1'>
                  {storefrontPrimaryNavigation.map((item) => {
                    const isActive = isNavItemActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          'flex min-h-11 items-center rounded-control px-3 text-sm font-bold transition-colors',
                          isActive
                            ? 'bg-brand-soft text-brand'
                            : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground',
                        )}
                      >
                        <span
                          className={cn(
                            'me-3 h-5 w-1 shrink-0 rounded-full transition-colors',
                            isActive ? 'bg-brand' : 'bg-transparent',
                          )}
                        />

                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <StorefrontCategoryMobileMenu
                  categories={categoryNavigation}
                  isLoading={isCategoriesLoading}
                  activeCategorySlug={activeCategorySlug}
                />
              </nav>

              <div className='mt-4 border-t border-border pt-4'>
                <HeaderCustomerMenu mobile returnTo={pathname} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
