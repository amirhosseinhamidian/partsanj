import { requestAdminApi } from '@/lib/api/admin-web-client';

import { notifyAdminInteractionsChanged } from '@/lib/api/admin-interactions-client';

import type {
  AdminContentReportMutationResponse,
  AdminContentReportStatus,
  AdminContentReportsResponse,
  FindAdminContentReportsParams,
} from '@/lib/admin/interactions/reports/admin-content-report.types';

const ADMIN_CONTENT_REPORTS_API_PATH = '/api/admin/interactions/reports';

function addOptionalParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === '') {
    return;
  }

  searchParams.set(key, String(value));
}

function buildQuery(params: FindAdminContentReportsParams) {
  const searchParams = new URLSearchParams();

  addOptionalParam(searchParams, 'status', params.status);

  addOptionalParam(searchParams, 'targetType', params.targetType);

  addOptionalParam(searchParams, 'page', params.page);

  addOptionalParam(searchParams, 'limit', params.limit);

  return searchParams.toString();
}

export const adminContentReportsApi = {
  list(params: FindAdminContentReportsParams = {}) {
    const query = buildQuery(params);

    return requestAdminApi<AdminContentReportsResponse>(
      query ? `${ADMIN_CONTENT_REPORTS_API_PATH}?${query}` : ADMIN_CONTENT_REPORTS_API_PATH,
    );
  },

  async updateStatus(reportId: string, status: Exclude<AdminContentReportStatus, 'OPEN'>) {
    const result = await requestAdminApi<AdminContentReportMutationResponse>(
      `${ADMIN_CONTENT_REPORTS_API_PATH}/${encodeURIComponent(reportId)}`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          status,
        }),
      },
    );

    /*
     * Summary سایدبار شامل openReports است،
     * پس بعد از Resolve / Dismiss آن را refresh می‌کنیم.
     */
    notifyAdminInteractionsChanged();

    return result;
  },
};
