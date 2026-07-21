import { apiErrorResponse } from '@/lib/api/route-response';
import { ADMIN_CATALOG_API_PATH, adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const ENTITIES = new Set(['makes', 'models', 'variants']);
const ACTIONS = new Set(['template', 'preview', 'execute']);

type RouteContext = {
  params: Promise<{ entity: string; action: string }>;
};

function valid(entity: string, action: string) {
  return ENTITIES.has(entity) && ACTIONS.has(action);
}

function invalidPath() {
  return NextResponse.json(
    { message: 'مسیر Import خودرو معتبر نیست', code: 'INVALID_VEHICLE_IMPORT_PATH' },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { entity, action } = await context.params;
    if (!valid(entity, action)) return invalidPath();
    if (action !== 'template') {
      return NextResponse.json(
        { message: 'متد مجاز نیست', code: 'METHOD_NOT_ALLOWED' },
        { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } },
      );
    }

    const result = await adminNestApi<string>(
      `${ADMIN_CATALOG_API_PATH}/vehicles/import/${entity}/template`,
      { method: 'GET' },
    );
    const csv = typeof result === 'string' ? result : String(result);
    const withBom = csv.startsWith('\uFEFF') ? csv : `\uFEFF${csv}`;

    return new Response(withBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vehicle-${entity}-import-template.csv"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { entity, action } = await context.params;
    if (!valid(entity, action)) return invalidPath();
    if (action !== 'preview' && action !== 'execute') {
      return NextResponse.json(
        { message: 'متد مجاز نیست', code: 'METHOD_NOT_ALLOWED' },
        { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } },
      );
    }

    const contentType = request.headers.get('content-type');
    if (!contentType?.toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json(
        { message: 'فایل باید با multipart/form-data ارسال شود', code: 'MULTIPART_FORM_DATA_REQUIRED' },
        { status: 415, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const result = await adminNestApi<unknown>(
      `${ADMIN_CATALOG_API_PATH}/vehicles/import/${entity}/${action}`,
      {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: Buffer.from(await request.arrayBuffer()),
      },
    );

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
