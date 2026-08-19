import { apiErrorResponse } from '@/lib/api/route-response';

import { ADMIN_INTERACTIONS_API_PATH, adminNestApi } from '@/lib/server/admin-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const csv = await adminNestApi<string>(`${ADMIN_INTERACTIONS_API_PATH}/import/template`, {
      method: 'GET',
    });

    return new Response(csv, {
      status: 200,

      headers: {
        'Content-Type': 'text/csv; charset=utf-8',

        'Content-Disposition': 'attachment; filename="partsanj-interactions-template.csv"',

        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
