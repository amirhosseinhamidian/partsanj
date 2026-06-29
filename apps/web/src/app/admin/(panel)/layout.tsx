import { AdminAppShell } from '@/components/admin/admin-app-shell';
import { getCurrentAdmin } from '@/lib/auth/current-admin';
import { redirect } from 'next/navigation';

export default async function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
