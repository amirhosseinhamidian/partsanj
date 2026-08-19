import { requestAdminApi } from '@/lib/api/admin-web-client';

import type {
  AdminInteractionMutationResponse,
  AdminInteractionStatus,
  AdminInteractionSummaryResponse,
  AdminInteractionType,
  AdminInteractionsResponse,
  FindAdminInteractionsParams,
} from '@/lib/admin/interactions/admin-interaction.types';

const ADMIN_INTERACTIONS_API_PATH = '/api/admin/interactions';

export const ADMIN_INTERACTIONS_CHANGED_EVENT = 'admin-interactions-changed';

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

function buildQuery(params: FindAdminInteractionsParams) {
  const searchParams = new URLSearchParams();

  addOptionalParam(searchParams, 'type', params.type);

  addOptionalParam(searchParams, 'status', params.status);

  addOptionalParam(searchParams, 'q', params.q);

  addOptionalParam(searchParams, 'productId', params.productId);

  addOptionalParam(searchParams, 'blogPostId', params.blogPostId);

  addOptionalParam(searchParams, 'page', params.page);

  addOptionalParam(searchParams, 'limit', params.limit);

  return searchParams.toString();
}

export const adminInteractionsApi = {
  list(params: FindAdminInteractionsParams = {}) {
    const query = buildQuery(params);

    return requestAdminApi<AdminInteractionsResponse>(
      query ? `${ADMIN_INTERACTIONS_API_PATH}?${query}` : ADMIN_INTERACTIONS_API_PATH,
    );
  },

  summary() {
    return requestAdminApi<AdminInteractionSummaryResponse>(
      `${ADMIN_INTERACTIONS_API_PATH}/summary`,
    );
  },

  moderate(type: AdminInteractionType, id: string, status: AdminInteractionStatus) {
    return requestAdminApi<AdminInteractionMutationResponse>(
      `${ADMIN_INTERACTIONS_API_PATH}/${encodeURIComponent(type)}/${encodeURIComponent(id)}/moderation`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          status,
        }),
      },
    );
  },

  reply(type: AdminInteractionType, id: string, body: string) {
    return requestAdminApi<AdminInteractionMutationResponse>(
      `${ADMIN_INTERACTIONS_API_PATH}/${encodeURIComponent(type)}/${encodeURIComponent(id)}/replies`,
      {
        method: 'POST',

        body: JSON.stringify({
          body,
        }),
      },
    );
  },
};

export function notifyAdminInteractionsChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_INTERACTIONS_CHANGED_EVENT));
}
