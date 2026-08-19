import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import type {
  SiteSettingsResponse,
  UpdateSiteSettingsPayload,
} from '@/lib/admin/settings/site-settings.types';

import { apiErrorResponse } from '@/lib/api/route-response';
import { adminNestApi } from '@/lib/server/admin-api';

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

    /*
     * تنظیمات عمومی سایت در بخش‌های مختلف Storefront
     * با tag زیر cache شده‌اند.
     */
    revalidateTag('site-settings', {
      expire: 0,
    });

    /*
     * تغییر noIndexSite مستقیماً روی sitemap اثر دارد.
     * بنابراین sitemap نیز باید در درخواست بعدی
     * دوباره ساخته شود.
     */
    revalidatePath('/sitemap.xml');

    revalidateTag('site-settings', 'max');

    revalidatePath('/products/[slug]', 'page');

    revalidatePath('/blog/[slug]', 'page');

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
