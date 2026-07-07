import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  isAdminUserRole,
  type AdminUserDetailResponse,
  type UpdateAdminUserInput,
} from '@/lib/admin/users/admin-user.types';
import { adminUserApiPath } from '@/lib/server/admin-user-api';
import { adminNestApi } from '@/lib/server/admin-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readUpdatePayload(request: Request): Promise<UpdateAdminUserInput> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiRequestError('بدنه درخواست معتبر نیست', 400, 'INVALID_ADMIN_USER_REQUEST_BODY');
  }

  if (!isPlainObject(payload)) {
    throw new ApiRequestError('اطلاعات کاربر معتبر نیست', 400, 'INVALID_ADMIN_USER_INPUT');
  }

  const role = payload.role;
  const isActive = payload.isActive;

  if (role === undefined && isActive === undefined) {
    throw new ApiRequestError(
      'حداقل یکی از اطلاعات کاربر باید تغییر کند',
      400,
      'EMPTY_ADMIN_USER_UPDATE',
    );
  }

  if (role !== undefined && !isAdminUserRole(role)) {
    throw new ApiRequestError('نقش کاربر معتبر نیست', 400, 'INVALID_ADMIN_USER_ROLE');
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw new ApiRequestError('وضعیت حساب کاربر معتبر نیست', 400, 'INVALID_ADMIN_USER_STATUS');
  }

  return {
    ...(role !== undefined ? { role } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;

    const result = await adminNestApi<AdminUserDetailResponse>(adminUserApiPath(userId), {
      method: 'GET',
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;

    const payload = await readUpdatePayload(request);

    const result = await adminNestApi<AdminUserDetailResponse>(adminUserApiPath(userId), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
