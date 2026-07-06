import { createCustomerProfileProxyResponse, customerProfileNestApi } from './customer-profile-api';

export const ADMIN_USERS_API_PATH = '/api/v1/admin/users';

const ADMIN_USERS_QUERY_KEYS = ['q', 'role', 'isActive', 'page', 'limit'] as const;

export const adminUserNestApi = customerProfileNestApi;

export const createAdminUserProxyResponse = createCustomerProfileProxyResponse;

export function createAdminUsersListApiPath(searchParams: URLSearchParams) {
  const params = new URLSearchParams();

  for (const key of ADMIN_USERS_QUERY_KEYS) {
    const value = searchParams.get(key);

    if (value !== null && value !== '') {
      params.set(key, value);
    }
  }

  const query = params.toString();

  return query ? `${ADMIN_USERS_API_PATH}?${query}` : ADMIN_USERS_API_PATH;
}

export function adminUserApiPath(userId: string) {
  return `${ADMIN_USERS_API_PATH}/${encodeURIComponent(userId)}`;
}
