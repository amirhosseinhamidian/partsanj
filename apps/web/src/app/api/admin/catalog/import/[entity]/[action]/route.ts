import { apiErrorResponse } from '@/lib/api/route-response';
import {
  ADMIN_CATALOG_API_PATH,
  adminNestApi,
} from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const IMPORT_ENTITIES = new Set([
  'products',
  'brands',
  'categories',
]);

const IMPORT_ACTIONS = new Set([
  'template',
  'preview',
  'execute',
]);

type RouteContext = {
  params: Promise<{
    entity: string;
    action: string;
  }>;
};

function isSupportedImportPath(
  entity: string,
  action: string,
): boolean {
  return (
    IMPORT_ENTITIES.has(entity) &&
    IMPORT_ACTIONS.has(action)
  );
}

function invalidImportPathResponse() {
  return NextResponse.json(
    {
      message: 'مسیر Import کاتالوگ معتبر نیست',
      code: 'INVALID_CATALOG_IMPORT_PATH',
    },
    {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

function methodNotAllowedResponse() {
  return NextResponse.json(
    {
      message: 'متد درخواست برای این عملیات مجاز نیست',
      code: 'METHOD_NOT_ALLOWED',
    },
    {
      status: 405,
      headers: {
        Allow: 'GET, POST',
        'Cache-Control': 'no-store',
      },
    },
  );
}

function getTemplateFilename(entity: string): string {
  return `${entity}-import-template.csv`;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { entity, action } = await context.params;

    if (!isSupportedImportPath(entity, action)) {
      return invalidImportPathResponse();
    }

    if (action !== 'template') {
      return methodNotAllowedResponse();
    }

    const result = await adminNestApi<string>(
      `${ADMIN_CATALOG_API_PATH}/import/${entity}/template`,
      {
        method: 'GET',
      },
    );

    const csvContent =
      typeof result === 'string'
        ? result
        : String(result);

    const csvWithBom = csvContent.startsWith('\uFEFF')
      ? csvContent
      : `\uFEFF${csvContent}`;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${getTemplateFilename(entity)}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { entity, action } = await context.params;

    if (!isSupportedImportPath(entity, action)) {
      return invalidImportPathResponse();
    }

    if (action !== 'preview' && action !== 'execute') {
      return methodNotAllowedResponse();
    }

    const contentType = request.headers.get('content-type');

    if (
      !contentType ||
      !contentType.toLowerCase().startsWith('multipart/form-data')
    ) {
      return NextResponse.json(
        {
          message: 'فایل باید با multipart/form-data ارسال شود',
          code: 'MULTIPART_FORM_DATA_REQUIRED',
        },
        {
          status: 415,
          headers: {
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const requestBody = Buffer.from(
      await request.arrayBuffer(),
    );

    const result = await adminNestApi<unknown>(
      `${ADMIN_CATALOG_API_PATH}/import/${entity}/${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
        },
        body: requestBody,
      },
    );

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
