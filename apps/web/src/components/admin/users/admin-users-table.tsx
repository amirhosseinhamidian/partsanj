'use client';

import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import type { AdminUserListItem, AdminUserRole } from '@/lib/admin/users/admin-user.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { Eye } from 'lucide-react';
import { useMemo } from 'react';

type AdminUsersTableProps = {
  users: AdminUserListItem[];
  loading: boolean;

  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;

  /**
   * در گام بعد به Sheet جزئیات کاربر وصل می‌شود
   */
  onOpenDetails?: (user: AdminUserListItem) => void;
};

const roleLabels: Record<AdminUserRole, string> = {
  CUSTOMER: 'مشتری',
  SUPPORT: 'پشتیبان',
  ADMIN: 'ادمین',
};

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function getUserDisplayName(user: AdminUserListItem) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return fullName || 'بدون نام';
}

function UserRoleBadge({ role }: { role: AdminUserRole }) {
  switch (role) {
    case 'ADMIN':
      return (
        <Badge variant='warning' dot>
          ادمین
        </Badge>
      );

    case 'SUPPORT':
      return (
        <Badge variant='brand' dot>
          پشتیبان
        </Badge>
      );

    default:
      return (
        <Badge variant='neutral' dot>
          مشتری
        </Badge>
      );
  }
}

function UserStatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge variant='success' dot>
        فعال
      </Badge>
    );
  }

  return (
    <Badge variant='danger' dot>
      غیرفعال
    </Badge>
  );
}

export function AdminUsersTable({
  users,
  loading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onOpenDetails,
}: AdminUsersTableProps) {
  const columns = useMemo<DataTableColumn<AdminUserListItem>[]>(
    () => [
      {
        key: 'user',
        header: 'کاربر',
        minWidth: '190px',
        cell: (row) => (
          <div>
            <p className='font-bold text-foreground'>{getUserDisplayName(row)}</p>

            <p className='mt-1 text-xs text-foreground-muted'>
              {row.mobileVerifiedAt ? 'موبایل تأیید شده' : 'موبایل تأیید نشده'}
            </p>
          </div>
        ),
      },
      {
        key: 'mobile',
        header: 'شماره موبایل',
        minWidth: '155px',
        cell: (row) => (
          <p dir='ltr' className='numeric text-sm font-semibold text-foreground-secondary'>
            {toPersianDigits(row.mobile)}
          </p>
        ),
      },
      {
        key: 'role',
        header: 'نقش',
        minWidth: '120px',
        align: 'center',
        cell: (row) => <UserRoleBadge role={row.role} />,
      },
      {
        key: 'status',
        header: 'وضعیت حساب',
        minWidth: '130px',
        align: 'center',
        cell: (row) => <UserStatusBadge isActive={row.isActive} />,
      },
      {
        key: 'customerData',
        header: 'اطلاعات مشتری',
        minWidth: '160px',
        align: 'center',
        cell: (row) => (
          <div className='space-y-1 text-sm text-foreground-secondary'>
            <p>{toPersianDigits(String(row._count.customerVehicles))} خودرو</p>

            <p className='text-xs text-foreground-muted'>
              {toPersianDigits(String(row._count.addresses))} آدرس
            </p>
          </div>
        ),
      },
      {
        key: 'lastLoginAt',
        header: 'آخرین ورود',
        minWidth: '135px',
        align: 'center',
        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatDate(row.lastLoginAt)}</span>
        ),
      },
      {
        key: 'createdAt',
        header: 'تاریخ عضویت',
        minWidth: '135px',
        align: 'center',
        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatDate(row.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={users}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingRows={10}
      tableClassName='min-w-[1180px]'
      emptyTitle='کاربری پیدا نشد'
      emptyDescription='جست‌وجو یا فیلترهای انتخاب‌شده را تغییر دهید'
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
      onRowClick={onOpenDetails}
      rowActions={
        onOpenDetails
          ? (row) => (
              <Tooltip content='مشاهده جزئیات کاربر'>
                <span className='inline-flex'>
                  <IconButton
                    aria-label={`مشاهده جزئیات ${getUserDisplayName(row)}`}
                    icon={<Eye />}
                    variant='ghost'
                    size='sm'
                    onClick={(event) => {
                      event.stopPropagation();

                      onOpenDetails(row);
                    }}
                  />
                </span>
              </Tooltip>
            )
          : undefined
      }
    />
  );
}
