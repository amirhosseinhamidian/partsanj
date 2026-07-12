'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';

const StorefrontSettingsContext = createContext<StorefrontSiteSettings | null>(null);

export function StorefrontSettingsProvider({
  settings,
  children,
}: {
  settings: StorefrontSiteSettings;
  children: ReactNode;
}) {
  return (
    <StorefrontSettingsContext.Provider value={settings}>
      {children}
    </StorefrontSettingsContext.Provider>
  );
}

export function useStorefrontSettings() {
  const settings = useContext(StorefrontSettingsContext);

  if (!settings) {
    throw new Error('useStorefrontSettings must be used inside StorefrontSettingsProvider');
  }

  return settings;
}
