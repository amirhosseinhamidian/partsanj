import type { Metadata } from 'next';

import { ToastProvider } from '@/components/providers/toast-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/providers/tooltip-provider';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

import { vazirmatn } from './fonts';

import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStorefrontSiteSettings();

  const title = settings.defaultSeoTitle || settings.siteName;
  const description =
    settings.defaultSeoDescription || settings.siteTagline || 'فروشگاه تخصصی قطعات یدکی خودرو';

  const ogImage = settings.defaultOgImageUrl || undefined;

  return {
    metadataBase: new URL(settings.siteBaseUrl),
    title: {
      default: title,
      template: `%s | ${settings.siteName}`,
    },
    description,
    robots: {
      index: !settings.noIndexSite,
      follow: !settings.noIndexSite,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: settings.siteName,
      url: settings.siteBaseUrl,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: settings.siteName,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
