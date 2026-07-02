import type { Metadata } from 'next';

import { ToastProvider } from '@/components/providers/toast-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/providers/tooltip-provider';
import { vazirmatn } from './fonts';
import './globals.css';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';

export const metadata: Metadata = {
  title: {
    default: 'پارت‌سنج',
    template: '%s | پارت‌سنج',
  },
  description: 'مرجع تخصصی قطعات برقی و الکترونیکی خودرو',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='fa' dir='rtl' suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider>
          <ToastProvider defaultPosition='bottom-left'>
            <TooltipProvider>
              <StorefrontShell>{children}</StorefrontShell>
            </TooltipProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
