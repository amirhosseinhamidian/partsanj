import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { createPrivatePageMetadata } from '@/lib/storefront/seo/private-page-metadata';

export const metadata: Metadata = createPrivatePageMetadata('ورود به پنل مدیریت');

export default function AdminAuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
