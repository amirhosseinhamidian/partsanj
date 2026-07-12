'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { StorefrontCartProvider } from '@/components/storefront/cart/storefront-cart-provider';
import { StorefrontCustomerAuthProvider } from '@/components/storefront/customer-auth/storefront-customer-auth-provider';
import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';
import { StorefrontFooter } from './storefront-footer';
import { StorefrontHeader } from './storefront-header';
import { StorefrontSettingsProvider } from './storefront-settings-provider';

type StorefrontShellProps = {
  children: ReactNode;
  settings: StorefrontSiteSettings;
};

export function StorefrontShell({ children, settings }: StorefrontShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAdminRoute = pathname.startsWith('/admin');
  const isMaintenanceRoute = pathname.startsWith('/maintenance');

  const shouldRedirectToMaintenance =
    !settings.storeEnabled && !isAdminRoute && !isMaintenanceRoute;

  useEffect(() => {
    if (shouldRedirectToMaintenance) {
      router.replace('/maintenance');
    }
  }, [router, shouldRedirectToMaintenance]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (shouldRedirectToMaintenance) {
    return null;
  }

  if (isMaintenanceRoute) {
    return <StorefrontSettingsProvider settings={settings}>{children}</StorefrontSettingsProvider>;
  }

  return (
    <StorefrontSettingsProvider settings={settings}>
      <StorefrontCartProvider>
        <StorefrontCustomerAuthProvider>
          <StorefrontHeader />
          {children}
          <StorefrontFooter />
        </StorefrontCustomerAuthProvider>
      </StorefrontCartProvider>
    </StorefrontSettingsProvider>
  );
}
