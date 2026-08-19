import { apiErrorResponse } from '@/lib/api/route-response';

import { ADMIN_INTERACTIONS_API_PATH, adminNestApi } from '@/lib/server/admin-api';

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          message: 'فایل CSV ارسال نشده است',
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.arrayBuffer();

    const result = await adminNestApi(`${ADMIN_INTERACTIONS_API_PATH}/import/preview`, {
      method: 'POST',

      headers: {
        'Content-Type': contentType,
      },

      body,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
