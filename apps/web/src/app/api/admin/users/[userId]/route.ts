import { ApiRequestError } from '@/lib/api/api-error';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  adminUserApiPath,
  adminUserNestApi,
  createAdminUserProxyResponse,
} from '@/lib/server/admin-user-api';
import {
  isAdminUserRole,
  type AdminUserDetailResponse,
  type UpdateAdminUserInput,
} from '@/lib/admin/users/admin-user.types';

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

    const result = await adminUserNestApi<AdminUserDetailResponse>(adminUserApiPath(userId));

    return createAdminUserProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId } = await context.params;

    const payload = await readUpdatePayload(request);

    const result = await adminUserNestApi<AdminUserDetailResponse>(adminUserApiPath(userId), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return createAdminUserProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
