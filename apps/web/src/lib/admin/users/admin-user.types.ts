export const ADMIN_USER_ROLES = ['CUSTOMER', 'SUPPORT', 'ADMIN'] as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];

export type AdminUserCounts = {
  addresses: number;
  customerVehicles: number;
  orders: number;
};

export type AdminUserListItem = {
  id: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
  role: AdminUserRole;
  isActive: boolean;
  mobileVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: AdminUserCounts;
};

export type AdminUserVehicle = {
  id: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;

  vehicleVariant: {
    id: string;
    name: string;
    slug: string;
    engineCode: string | null;
    engineName: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    yearCalendar: string | null;

    model: {
      id: string;
      name: string;
      slug: string;

      make: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
      };
    };
  };
};

export type AdminUserDetail = AdminUserListItem & {
  customerVehicles: AdminUserVehicle[];
};

export type AdminUserListResponse = {
  data: AdminUserListItem[];

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminUserDetailResponse = {
  data: AdminUserDetail;
};

export type UpdateAdminUserInput = {
  role?: AdminUserRole;
  isActive?: boolean;
};

export type AdminUserListQuery = {
  q?: string;
  role?: AdminUserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export function isAdminUserRole(value: unknown): value is AdminUserRole {
  return typeof value === 'string' && ADMIN_USER_ROLES.includes(value as AdminUserRole);
}
