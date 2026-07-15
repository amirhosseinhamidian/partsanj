'use client';

import { Suspense } from 'react';
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

function StorefrontHeaderFallback() {
  return <div aria-hidden='true' className='min-h-18 border-b border-border bg-surface' />;
}

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
          <Suspense fallback={<StorefrontHeaderFallback />}>
            <StorefrontHeader
              logoLightUrl={settings.logoLightUrl}
              logoDarkUrl={settings.logoDarkUrl}
            />
          </Suspense>
          {children}
          <StorefrontFooter
            logoLightUrl={settings.logoLightUrl}
            logoDarkUrl={settings.logoDarkUrl}
          />
        </StorefrontCustomerAuthProvider>
      </StorefrontCartProvider>
    </StorefrontSettingsProvider>
  );
}
