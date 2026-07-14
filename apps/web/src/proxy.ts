import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  createRequestId,
  REQUEST_ID_HEADER,
} from '@/lib/api/request-id';

const ACCESS_COOKIE = 'partsanj_admin_access_token';
const ADMIN_PREFIX = '/admin';
const API_PREFIX = '/api';
const ADMIN_LOGIN_PATH = '/admin/login';
const MAINTENANCE_PATH = '/maintenance';

type PublicSettingsResponse = {
  data?: {
    storeEnabled?: boolean;
  };
};

function getApiBaseUrl(): string {
  const apiUrl = process.env.PARTSANJ_API_URL?.trim();

  if (!apiUrl) {
    throw new Error('PARTSANJ_API_URL is not configured');
  }

  return apiUrl.replace(/\/+$/, '');
}

/**
 * بررسی می‌کند pathname دقیقاً خود مسیر باشد
 * یا یکی از زیرمسیرهای آن.
 *
 * /admin → true
 * /admin/products → true
 * /administrator → false
 */
function isPathWithin(
  pathname: string,
  basePath: string,
): boolean {
  return (
    pathname === basePath ||
    pathname.startsWith(`${basePath}/`)
  );
}

/**
 * برای هر درخواست BFF یک شناسه جدید می‌سازیم.
 *
 * شناسه ورودی کاربر عمداً overwrite می‌شود تا client نتواند
 * correlation id دلخواه یا تکراری وارد logهای سیستم کند.
 */
function createApiRequestIdResponse(
  request: NextRequest,
): NextResponse {
  const requestId = createRequestId();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}

/**
 * وضعیت فعال بودن فروشگاه را از API دریافت می‌کند.
 *
 * Fail-open:
 * اگر API تنظیمات در دسترس نباشد، سایت را فعال
 * در نظر می‌گیریم تا اختلال API کل سایت را نبندد.
 */
async function getStoreEnabled(): Promise<boolean> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/v1/settings`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(1500),
      },
    );

    if (!response.ok) {
      return true;
    }

    const result =
      (await response.json()) as PublicSettingsResponse;

    return result.data?.storeEnabled !== false;
  } catch {
    return true;
  }
}

function handleAdminAuthentication(
  request: NextRequest,
): NextResponse {
  const { pathname, search } = request.nextUrl;

  /**
   * صفحه ورود ادمین برای کاربر بدون توکن باز است.
   */
  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  const hasAccessToken = Boolean(
    request.cookies.get(ACCESS_COOKIE)?.value,
  );

  if (hasAccessToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();

  loginUrl.pathname = ADMIN_LOGIN_PATH;
  loginUrl.search = '';
  loginUrl.searchParams.set(
    'next',
    `${pathname}${search}`,
  );

  return NextResponse.redirect(loginUrl);
}

/**
 * محتوای صفحه /maintenance را با حفظ URL فعلی نمایش می‌دهد.
 */
function createMaintenanceRewrite(
  request: NextRequest,
): NextResponse {
  const maintenanceUrl = request.nextUrl.clone();

  maintenanceUrl.pathname = MAINTENANCE_PATH;
  maintenanceUrl.search = '';

  return NextResponse.rewrite(maintenanceUrl, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      /**
       * به خزنده‌ها و کلاینت‌ها پیشنهاد می‌کند
       * یک ساعت بعد دوباره درخواست بدهند.
       */
      'Retry-After': '3600',

      /**
       * پاسخ تعمیرات نباید cache شود.
       */
      'Cache-Control':
        'no-store, no-cache, must-revalidate, max-age=0',

      /**
       * حتی اگر متادیتای صفحه بارگذاری نشود،
       * پاسخ HTTP به موتور جست‌وجو noindex می‌دهد.
       */
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Maintenance-Mode': 'true',
    },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * درخواست‌های BFF:
   * شناسه در request داخلی Next قرار می‌گیرد و در response
   * نیز برای خطایابی از DevTools قابل مشاهده است.
   */
  if (isPathWithin(pathname, API_PREFIX)) {
    return createApiRequestIdResponse(request);
  }

  /**
   * پنل ادمین در حالت تعمیرات همچنان باز می‌ماند
   * تا مدیر بتواند فروشگاه را دوباره فعال کند.
   */
  if (isPathWithin(pathname, ADMIN_PREFIX)) {
    return handleAdminAuthentication(request);
  }

  /**
   * جلوگیری از حلقه rewrite:
   * خود صفحه maintenance دوباره به خودش rewrite نشود.
   */
  if (pathname === MAINTENANCE_PATH) {
    return NextResponse.next();
  }

  /**
   * فقط درخواست‌های صفحه‌ای GET و HEAD بررسی می‌شوند.
   *
   * درخواست‌های API در ابتدای تابع مدیریت شده‌اند و
   * درخواست‌های POST مانند Server Action وارد تعمیرات نمی‌شوند.
   */
  if (
    request.method === 'GET' ||
    request.method === 'HEAD'
  ) {
    const storeEnabled = await getStoreEnabled();

    if (!storeEnabled) {
      return createMaintenanceRewrite(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /**
     * تمام Route Handlerهای BFF برای ایجاد Request ID.
     */
    '/api/:path*',

    /**
     * تمام صفحات به‌جز:
     *
     * - API؛ چون matcher جداگانه بالا دارد
     * - فایل‌های داخلی Next.js
     * - Image Optimization
     * - metadata files
     * - فایل‌های public دارای پسوند
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
  ],
};
