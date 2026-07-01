export type AdminAuditEntityType =
  | 'PRODUCT'
  | 'BRAND'
  | 'CATEGORY'
  | 'VEHICLE_MAKE'
  | 'VEHICLE_MODEL'
  | 'VEHICLE_VARIANT';

export type AdminAuditAction = 'CREATED' | 'UPDATED' | 'ARCHIVED' | 'COMPATIBILITIES_UPDATED';

export type AdminAuditActor = {
  id: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

export type AdminAuditLog = {
  id: string;
  entityType: AdminAuditEntityType;
  entityId: string;
  entityLabel: string | null;
  action: AdminAuditAction;
  changes: unknown;
  createdAt: string;
  actorUser: AdminAuditActor;
};

export type AdminAuditLogsMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AdminAuditLogsResponse = {
  data: AdminAuditLog[];
  meta: AdminAuditLogsMeta;
};

export type FindAdminAuditLogsParams = {
  entityType?: AdminAuditEntityType;
  action?: AdminAuditAction;
  actorUserId?: string;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
};

export const adminAuditEntityTypeOptions = [
  {
    value: 'PRODUCT',
    label: 'محصول',
  },
  {
    value: 'BRAND',
    label: 'برند قطعه',
  },
  {
    value: 'CATEGORY',
    label: 'دسته‌بندی',
  },
  {
    value: 'VEHICLE_MAKE',
    label: 'برند خودرو',
  },
  {
    value: 'VEHICLE_MODEL',
    label: 'مدل خودرو',
  },
  {
    value: 'VEHICLE_VARIANT',
    label: 'تیپ / موتور خودرو',
  },
] as const;

export const adminAuditActionOptions = [
  {
    value: 'CREATED',
    label: 'ایجاد',
  },
  {
    value: 'UPDATED',
    label: 'ویرایش',
  },
  {
    value: 'ARCHIVED',
    label: 'آرشیو',
  },
  {
    value: 'COMPATIBILITIES_UPDATED',
    label: 'تغییر سازگاری خودرو',
  },
] as const;

export function getAdminAuditEntityTypeLabel(entityType: AdminAuditEntityType): string {
  return (
    adminAuditEntityTypeOptions.find((option) => option.value === entityType)?.label ?? entityType
  );
}

export function getAdminAuditActionLabel(action: AdminAuditAction): string {
  return adminAuditActionOptions.find((option) => option.value === action)?.label ?? action;
}
