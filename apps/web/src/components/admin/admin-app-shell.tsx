'use client';

import { AdminLogoutButton } from '@/components/admin/admin-logout-button';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils/cn';
import {
  Boxes,
  CarFront,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Settings2,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

export type AdminShellUser = {
  fullName: string | null;
  phone: string | null;
  role: string;
};

type AdminNavigationChild = {
  label: string;
  href: string;
  disabled?: boolean;
  badge?: string;
};

type AdminNavigationItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
  children?: AdminNavigationChild[];
};

type AdminNavigationGroup = {
  label: string;
  items: AdminNavigationItem[];
};

const navigation: AdminNavigationGroup[] = [
  {
    label: 'اصلی',
    items: [
      {
        label: 'داشبورد',
        href: '/admin',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'مدیریت داده',
    items: [
      {
        label: 'کاتالوگ',
        href: '/admin/catalog',
        icon: Boxes,
        children: [
          {
            label: 'دسته‌بندی‌ها',
            href: '/admin/catalog/categories',
          },
          {
            label: 'برندها',
            href: '/admin/catalog/brands',
          },
        ],
      },
      {
        label: 'خودروها و سازگاری',
        href: '/admin/vehicles',
        icon: CarFront,
      },
    ],
  },
  {
    label: 'عملیات',
    items: [
      {
        label: 'سفارش‌ها',
        icon: ClipboardList,
        disabled: true,
        badge: 'به‌زودی',
      },
      {
        label: 'مشتریان',
        icon: UsersRound,
        disabled: true,
        badge: 'به‌زودی',
      },
      {
        label: 'تنظیمات',
        icon: Settings2,
        disabled: true,
        badge: 'به‌زودی',
      },
    ],
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavigationItemActive(pathname: string, item: AdminNavigationItem): boolean {
  const isParentActive = item.href ? isRouteActive(pathname, item.href) : false;

  const isChildActive =
    item.children?.some((child) => isRouteActive(pathname, child.href)) ?? false;

  return isParentActive || isChildActive;
}

function getCurrentItem(pathname: string) {
  for (const group of navigation) {
    for (const item of group.items) {
      const currentChild = item.children?.find((child) => isRouteActive(pathname, child.href));

      if (currentChild) {
        return currentChild;
      }

      if (item.href && isRouteActive(pathname, item.href)) {
        return item;
      }
    }
  }

  return undefined;
}

function getAdminDisplayName(admin: AdminShellUser): string {
  return admin.fullName?.trim() || admin.phone || 'مدیر سیستم';
}

function getAdminInitial(admin: AdminShellUser): string {
  const fullName = admin.fullName?.trim();

  return fullName ? fullName.slice(0, 1) : 'م';
}

type SidebarContentProps = {
  admin: AdminShellUser;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
};

function SidebarContent({
  admin,
  pathname,
  collapsed,
  onNavigate,
  onToggleCollapse,
  onCloseMobile,
}: SidebarContentProps) {
  const displayName = getAdminDisplayName(admin);

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col'>
      <div
        className={cn(
          'flex h-20 shrink-0 items-center border-b border-border',
          collapsed ? 'flex-col justify-center gap-1 px-2' : 'justify-between px-4',
        )}
      >
        <Link
          href='/admin'
          onClick={onNavigate}
          aria-label='رفتن به داشبورد پارت‌سنج'
          className={cn('flex min-w-0 items-center gap-3', collapsed && 'justify-center')}
        >
          <span className='grid size-10 shrink-0 place-items-center rounded-control bg-brand text-brand-foreground shadow-panel'>
            <Gauge className='size-5' />
          </span>

          {collapsed ? (
            <span className='sr-only'>پارت‌سنج</span>
          ) : (
            <span className='min-w-0'>
              <span className='block truncate text-base font-extrabold text-foreground'>
                پارت‌سنج
              </span>

              <span className='block truncate text-xs text-foreground-muted'>پنل مدیریت</span>
            </span>
          )}
        </Link>

        {onToggleCollapse ? (
          <IconButton
            type='button'
            size='sm'
            variant='ghost'
            aria-label={collapsed ? 'باز کردن منوی کناری' : 'جمع کردن منوی کناری'}
            icon={collapsed ? <PanelRightOpen /> : <PanelRightClose />}
            onClick={onToggleCollapse}
          />
        ) : null}

        {onCloseMobile ? (
          <IconButton
            type='button'
            size='sm'
            variant='ghost'
            aria-label='بستن منوی مدیریت'
            icon={<X />}
            onClick={onCloseMobile}
          />
        ) : null}
      </div>

      <nav aria-label='منوی مدیریت' className='min-h-0 flex-1 overflow-y-auto px-3 py-4'>
        {navigation.map((group, groupIndex) => (
          <div key={group.label}>
            {collapsed ? (
              groupIndex > 0 ? (
                <div className='mx-2 my-4 border-t border-border' />
              ) : null
            ) : (
              <p className='mb-2 px-3 text-xs font-bold text-foreground-muted'>{group.label}</p>
            )}

            <div className='space-y-1'>
              {group.items.map((item) => {
                const Icon = item.icon;

                const isParentRouteActive = item.href ? isRouteActive(pathname, item.href) : false;

                const isChildRouteActive =
                  item.children?.some((child) => isRouteActive(pathname, child.href)) ?? false;

                const active = isNavigationItemActive(pathname, item);

                const itemClasses = cn(
                  'group flex h-11 items-center rounded-control text-sm font-semibold transition-colors',
                  collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                  active
                    ? 'bg-brand-soft text-brand'
                    : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground',
                  item.disabled &&
                    'cursor-not-allowed opacity-45 hover:bg-transparent hover:text-foreground-secondary',
                );

                const itemContent = (
                  <>
                    <Icon className='size-5 shrink-0' />

                    {collapsed ? (
                      <span className='sr-only'>{item.label}</span>
                    ) : (
                      <>
                        <span className='min-w-0 flex-1 truncate'>{item.label}</span>

                        {item.badge ? (
                          <span className='rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-foreground-muted'>
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </>
                );

                return (
                  <div key={item.href ?? item.label}>
                    {item.disabled || !item.href ? (
                      <span
                        aria-disabled='true'
                        title={`${item.label} — به‌زودی`}
                        className={itemClasses}
                      >
                        {itemContent}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={
                          isParentRouteActive && !isChildRouteActive ? 'page' : undefined
                        }
                        title={collapsed ? item.label : undefined}
                        className={itemClasses}
                      >
                        {itemContent}
                      </Link>
                    )}

                    {!collapsed && item.children?.length ? (
                      <div className='mt-1 space-y-1 border-s border-border ps-3'>
                        {item.children.map((child) => {
                          const childActive = isRouteActive(pathname, child.href);

                          if (child.disabled) {
                            return (
                              <span
                                key={child.href}
                                aria-disabled='true'
                                className='flex h-9 items-center rounded-[10px] px-3 text-xs font-semibold text-foreground-muted opacity-45'
                              >
                                {child.label}
                              </span>
                            );
                          }

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onNavigate}
                              aria-current={childActive ? 'page' : undefined}
                              className={cn(
                                'flex h-9 items-center rounded-[10px] px-3 text-xs font-semibold transition-colors',
                                childActive
                                  ? 'bg-brand-soft text-brand'
                                  : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                              )}
                            >
                              <span className='truncate'>{child.label}</span>

                              {child.badge ? (
                                <span className='me-auto rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground-muted'>
                                  {child.badge}
                                </span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('shrink-0 border-t border-border p-3', collapsed && 'px-2')}>
        <div
          className={cn(
            'flex min-w-0 items-center',
            collapsed ? 'justify-center' : 'gap-3 rounded-control bg-surface-muted p-2',
          )}
        >
          <span className='grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-extrabold text-brand'>
            {getAdminInitial(admin)}
          </span>

          {collapsed ? null : (
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-bold text-foreground'>{displayName}</p>

              <p className='truncate text-xs text-foreground-muted'>{admin.role}</p>
            </div>
          )}
        </div>

        <AdminLogoutButton
          showLabel={!collapsed}
          className={cn('mt-2', collapsed ? 'w-full justify-center px-0' : 'w-full justify-start')}
        />
      </div>
    </div>
  );
}

type AdminAppShellProps = {
  admin: AdminShellUser;
  children: ReactNode;
};

export function AdminAppShell({ admin, children }: AdminAppShellProps) {
  const pathname = usePathname() ?? '/admin';

  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentItem = useMemo(() => getCurrentItem(pathname), [pathname]);

  const pageTitle = currentItem?.label ?? 'پنل مدیریت';

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener('keydown', handleEscape);
    };
  }, [mobileSidebarOpen]);

  return (
    <div className='min-h-dvh overflow-x-hidden bg-background text-foreground'>
      <a
        href='#admin-main-content'
        className='sr-only fixed inset-s-4 top-4 z-110 rounded-control bg-brand px-4 py-2 text-sm font-bold text-brand-foreground focus:not-sr-only'
      >
        رفتن به محتوای اصلی
      </a>

      <aside
        className={cn(
          'fixed inset-y-0 inset-s-0 z-40 hidden border-e border-border bg-surface transition-[width] duration-200 ease-out lg:flex',
          desktopCollapsed ? 'w-21' : 'w-72',
        )}
      >
        <SidebarContent
          admin={admin}
          pathname={pathname}
          collapsed={desktopCollapsed}
          onToggleCollapse={() => setDesktopCollapsed((current) => !current)}
        />
      </aside>

      {mobileSidebarOpen ? (
        <>
          <button
            type='button'
            aria-label='بستن منوی مدیریت'
            onClick={() => setMobileSidebarOpen(false)}
            className='fixed inset-0 z-40 bg-overlay lg:hidden'
          />

          <aside
            role='dialog'
            aria-modal='true'
            aria-label='منوی مدیریت'
            className='fixed inset-y-0 inset-s-0 z-50 flex w-80 max-w-[calc(100vw-1.5rem)] border-e border-border bg-surface shadow-floating lg:hidden'
          >
            <SidebarContent
              admin={admin}
              pathname={pathname}
              collapsed={false}
              onNavigate={() => setMobileSidebarOpen(false)}
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </aside>
        </>
      ) : null}

      <div
        className={cn(
          'min-h-dvh transition-[padding-inline-start] duration-200 ease-out',
          desktopCollapsed ? 'lg:ps-21' : 'lg:ps-72',
        )}
      >
        <header className='sticky top-0 z-30 border-b border-border bg-surface'>
          <div className='mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8'>
            <div className='flex min-w-0 items-center gap-3'>
              <IconButton
                type='button'
                size='sm'
                variant='outline'
                aria-label='باز کردن منوی مدیریت'
                icon={<Menu />}
                onClick={() => setMobileSidebarOpen(true)}
                className='lg:hidden'
              />

              <div className='min-w-0'>
                <p className='truncate text-xs font-medium text-foreground-muted'>
                  پنل مدیریت / {pageTitle}
                </p>

                <h1 className='truncate text-base font-extrabold text-foreground sm:text-lg'>
                  {pageTitle}
                </h1>
              </div>
            </div>

            <ThemeSwitcher />
          </div>
        </header>

        <main id='admin-main-content' className='mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8'>
          {children}
        </main>
      </div>
    </div>
  );
}
