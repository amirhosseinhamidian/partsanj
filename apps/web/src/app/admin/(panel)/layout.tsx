import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AdminAppShell } from '@/components/admin/admin-app-shell';
import { getCurrentAdmin } from '@/lib/auth/current-admin';
import { createPrivatePageMetadata } from '@/lib/storefront/seo/private-page-metadata';

/**
 * این metadata روی تمام صفحات زیر این layout اعمال می‌شود:
 *
 * /admin
 * /admin/products
 * /admin/orders
 * /admin/settings
 * و سایر صفحات پنل مدیریت
 */
export const metadata: Metadata = createPrivatePageMetadata(
  'پنل مدیریت',
  'مدیریت محصولات، سفارش‌ها، کاربران و تنظیمات سایت',
);

type AdminPanelLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <AdminAppShell
      admin={{
        fullName: admin.fullName,
        phone: admin.phone,
        role: admin.role,
      }}
    >
      {children}
    </AdminAppShell>
  );
}
