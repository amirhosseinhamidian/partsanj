import { apiErrorResponse } from '@/lib/api/route-response';
import {
  adminUserNestApi,
  createAdminUserProxyResponse,
  createAdminUsersListApiPath,
} from '@/lib/server/admin-user-api';
import type { AdminUserListResponse } from '@/lib/admin/users/admin-user.types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const result = await adminUserNestApi<AdminUserListResponse>(
      createAdminUsersListApiPath(url.searchParams),
    );

    return createAdminUserProxyResponse(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
