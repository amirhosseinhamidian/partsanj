import type { AdminUploadImageResponse } from '@/lib/admin/uploads/upload.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_UPLOADS_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_REQUEST_TIMEOUT_MS = 60_000;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const result = await adminNestApi<AdminUploadImageResponse>(
      `${ADMIN_UPLOADS_API_PATH}/images`,
      {
        method: 'POST',
        body: formData,
        timeoutMs: UPLOAD_REQUEST_TIMEOUT_MS,
      },
    );

    return NextResponse.json(result, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
