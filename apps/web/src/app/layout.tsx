import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ToastProvider } from '@/components/providers/toast-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/providers/tooltip-provider';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

import { vazirmatn } from './fonts';

import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  const siteName = settings.siteName?.trim() || 'پارت‌سنج';

  const title = settings.defaultSeoTitle?.trim() || siteName;

  const description =
    settings.defaultSeoDescription?.trim() ||
    settings.siteTagline?.trim() ||
    'فروشگاه تخصصی قطعات یدکی خودرو';

  const openGraphImage = settings.defaultOgImageUrl?.trim() || undefined;

  const shouldNoIndex = settings.noIndexSite;

  const faviconUrl = settings.faviconUrl?.trim() || '/images/branding/favicon-default.ico';

  return {
    metadataBase: new URL(settings.siteBaseUrl),
    applicationName: siteName,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    icons: {
      icon: [
        {
          url: faviconUrl,
        },
      ],

      shortcut: [
        {
          url: faviconUrl,
        },
      ],
    },
    robots: {
      index: !shouldNoIndex,
      follow: true,

      googleBot: {
        index: !shouldNoIndex,
        follow: true,

        ...(!shouldNoIndex
          ? {
              'max-image-preview': 'large',
              'max-snippet': -1,
              'max-video-preview': -1,
            }
          : {}),
      },
    },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName,

      title,
      description,

      images: openGraphImage
        ? [
            {
              url: openGraphImage,
              alt: siteName,
            },
          ]
        : undefined,
    },
    twitter: {
      card: openGraphImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: openGraphImage ? [openGraphImage] : undefined,
    },
  };
}

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const settings = await getStorefrontSiteSettings();

  return (
    <html lang='fa' dir='rtl' suppressHydrationWarning>
      <body className={vazirmatn.className}>
        <ThemeProvider>
          <TooltipProvider>
            <ToastProvider>
              <StorefrontShell settings={settings}>{children}</StorefrontShell>
            </ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
