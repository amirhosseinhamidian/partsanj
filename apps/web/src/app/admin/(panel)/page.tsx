import type { Metadata } from 'next';

import { AdminDashboardPageClient } from '@/components/admin/dashboard/admin-dashboard-page-client';

export const metadata: Metadata = {
  title: 'داشبورد',
};

export default function AdminDashboardPage() {
  return <AdminDashboardPageClient />;
}
