import type {
  AdminAuditLogsResponse,
  FindAdminAuditLogsParams,
} from '@/lib/admin/audit/audit-log.types';
import { requestAdminApi } from '@/lib/api/admin-web-client';

const AUDIT_LOGS_API_PATH = '/api/admin/catalog/audit-logs';

function addOptionalParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value === undefined) {
    return;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    return;
  }

  searchParams.set(key, normalizedValue);
}

function buildAuditLogsQuery(params: FindAdminAuditLogsParams): string {
  const searchParams = new URLSearchParams();

  addOptionalParam(searchParams, 'entityType', params.entityType);

  addOptionalParam(searchParams, 'action', params.action);

  addOptionalParam(searchParams, 'actorUserId', params.actorUserId);

  addOptionalParam(searchParams, 'search', params.search);

  addOptionalParam(searchParams, 'createdFrom', params.createdFrom);

  addOptionalParam(searchParams, 'createdTo', params.createdTo);

  addOptionalParam(searchParams, 'page', params.page);

  addOptionalParam(searchParams, 'pageSize', params.pageSize);

  return searchParams.toString();
}

export const adminAuditLogsApi = {
  async list(params: FindAdminAuditLogsParams = {}): Promise<AdminAuditLogsResponse> {
    const queryString = buildAuditLogsQuery(params);

    const path = queryString ? `${AUDIT_LOGS_API_PATH}?${queryString}` : AUDIT_LOGS_API_PATH;

    return requestAdminApi<AdminAuditLogsResponse>(path);
  },
};
