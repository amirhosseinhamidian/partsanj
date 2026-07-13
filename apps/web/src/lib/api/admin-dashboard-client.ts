import { requestAdminApi } from '@/lib/api/admin-web-client';
import type {
  AdminDashboardRange,
  AdminDashboardResponse,
} from '@/lib/admin/dashboard/admin-dashboard.types';

export const adminDashboardApi = {
  getDashboard(range: AdminDashboardRange = '30d') {
    const params = new URLSearchParams({
      range,
    });

    return requestAdminApi<AdminDashboardResponse>(`/api/admin/dashboard?${params.toString()}`);
  },
};
