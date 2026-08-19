import { apiErrorResponse } from '@/lib/api/route-response';

import { ADMIN_INTERACTIONS_API_PATH, adminNestApi } from '@/lib/server/admin-api';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    type: string;
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { type, id } = await context.params;

    const body = await request.text();

    const result = await adminNestApi(
      `${ADMIN_INTERACTIONS_API_PATH}/${encodeURIComponent(type)}/${encodeURIComponent(id)}/replies`,
      {
        method: 'POST',

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
