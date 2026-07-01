'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { StorefrontFooter } from './storefront-footer';
import { StorefrontHeader } from './storefront-header';

type StorefrontShellProps = {
  children: ReactNode;
};

export function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <StorefrontHeader />

      <main className='flex-1'>{children}</main>

      <StorefrontFooter />
    </div>
  );
}
