import type { AdminUserListResponse } from '@/lib/admin/users/admin-user.types';
import { apiErrorResponse } from '@/lib/api/route-response';
import {
  ADMIN_USERS_API_PATH,
  adminNestApi,
  createAdminUsersListApiPath,
} from '@/lib/server/admin-user-api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const result = await adminNestApi<AdminUserListResponse>(
      createAdminUsersListApiPath(url.searchParams),
      {
        method: 'GET',
      },
    );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST() {
  return NextResponse.json(
    {
      message: 'Method not allowed',
    },
    {
      status: 405,
    },
  );
}
