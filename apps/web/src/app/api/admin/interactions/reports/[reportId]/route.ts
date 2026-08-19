import { apiErrorResponse } from '@/lib/api/route-response';

import { ADMIN_INTERACTIONS_API_PATH, adminNestApi } from '@/lib/server/admin-api';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { reportId } = await context.params;

    const body = await request.text();

    const result = await adminNestApi(
      `${ADMIN_INTERACTIONS_API_PATH}/reports/${encodeURIComponent(reportId)}`,
      {
        method: 'PATCH',

        headers: {
          'Content-Type': 'application/json',
        },

        body,
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
