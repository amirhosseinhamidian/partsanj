import type {
  SiteSettingsResponse,
  UpdateSiteSettingsPayload,
} from '@/lib/admin/settings/site-settings.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import { adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

const ADMIN_SETTINGS_API_PATH = '/api/v1/admin/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await adminNestApi<SiteSettingsResponse>(ADMIN_SETTINGS_API_PATH, {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateSiteSettingsPayload;

    const result = await adminNestApi<SiteSettingsResponse>(ADMIN_SETTINGS_API_PATH, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
