import { requestStorefrontApi } from '@/lib/api/storefront-web-client';

import type {
  StorefrontContentReportReason,
  StorefrontContentReportResponse,
  StorefrontContentReportTargetType,
} from '@/lib/storefront/interactions/content-report.types';

export const storefrontContentReportApi = {
  create(input: {
    targetType: StorefrontContentReportTargetType;

    targetId: string;

    reason: StorefrontContentReportReason;

    details?: string | null;
  }) {
    return requestStorefrontApi<StorefrontContentReportResponse>('/api/interactions/reports', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify(input),
    });
  },
};
