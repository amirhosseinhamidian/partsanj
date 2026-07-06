'use client';

import { useCallback, useState, useTransition } from 'react';

import { AdminUsersTable } from './admin-users-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CircleAlert, RefreshCw, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAdminUserRole, type AdminUserRole } from '@/lib/admin/users/admin-user.types';
import { useAdminUsers } from '@/lib/admin/users/use-admin-users';

import { AdminUsersFilterBar, type AdminUsersFiltersDraft } from './admin-users-filter-bar';
import type { AdminUserListItem } from '@/lib/admin/users/admin-user.types';
import { AdminUserDetailsSheet } from './admin-user-details-sheet';

const USERS_PER_PAGE = 20;

type AdminUsersQueryPatch = {
  q?: string | null;
  role?: AdminUserRole | null;
  isActive?: boolean | null;
  page?: number | null;
};

function parsePage(value: string | null) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseStatus(value: string | null) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function createFiltersDraft(input: {
  q: string;
  role?: AdminUserRole;
  isActive?: boolean;
}): AdminUsersFiltersDraft {
  return {
    q: input.q,
    role: input.role ?? '',
    isActive: input.isActive === undefined ? '' : (String(input.isActive) as 'true' | 'false'),
  };
}

export function AdminUsersPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, startTransition] = useTransition();

  const searchQuery = searchParams.get('q') ?? '';

  const roleParam = searchParams.get('role');

  const selectedRole = isAdminUserRole(roleParam) ? roleParam : undefined;

  const selectedStatus = parseStatus(searchParams.get('isActive'));

  const currentPage = parsePage(searchParams.get('page'));

  const [draftFilters, setDraftFilters] = useState<AdminUsersFiltersDraft>(() =>
    createFiltersDraft({
      q: searchQuery,
      role: selectedRole,
      isActive: selectedStatus,
    }),
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleOpenUserDetails = useCallback((user: AdminUserListItem) => {
    setSelectedUserId(user.id);
  }, []);

  const handleCloseUserDetails = useCallback(() => {
    setSelectedUserId(null);
  }, []);

  const { users, meta, isLoading, error, refresh, clearError } = useAdminUsers({
    q: searchQuery || undefined,
    role: selectedRole,
    isActive: selectedStatus,
    page: currentPage,
    limit: USERS_PER_PAGE,
  });

  const hasActiveFilters = Boolean(searchQuery || selectedRole || selectedStatus !== undefined);

  const updateUrl = useCallback(
    (patch: AdminUsersQueryPatch) => {
      const params = new URLSearchParams(searchParams.toString());

      function setOrDelete(key: string, value: string | null | undefined) {
        if (!value) {
          params.delete(key);

          return;
        }

        params.set(key, value);
      }

      if (patch.q !== undefined) {
        setOrDelete('q', patch.q?.trim());
      }

      if (patch.role !== undefined) {
        setOrDelete('role', patch.role);
      }

      if (patch.isActive !== undefined) {
        setOrDelete('isActive', patch.isActive === null ? null : String(patch.isActive));
      }

      if (patch.page !== undefined) {
        const nextPage = patch.page ?? 1;

        if (nextPage <= 1) {
          params.delete('page');
        } else {
          params.set('page', String(nextPage));
        }
      }

      const nextQuery = params.toString();

      startTransition(() => {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  function resetFilters() {
    setDraftFilters({
      q: '',
      role: '',
      isActive: '',
    });

    updateUrl({
      q: null,
      role: null,
      isActive: null,
      page: null,
    });
  }

  function applyFilters() {
    updateUrl({
      q: draftFilters.q.trim() || null,
      role: draftFilters.role || null,
      isActive: draftFilters.isActive === '' ? null : draftFilters.isActive === 'true',
      page: 1,
    });
  }

  return (
    <>
      <main className='mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8'>
        <div className='space-y-6'>
          <header className='flex flex-col justify-between gap-4 lg:flex-row lg:items-end'>
            <div>
              <div className='flex items-center gap-2 text-brand'>
                <UsersRound className='size-5' />
                <span className='text-sm font-bold'>مدیریت عملیات کاربران</span>
              </div>

              <h1 className='mt-2 text-2xl font-extrabold text-foreground'>کاربران</h1>

              <p className='mt-2 max-w-2xl text-sm leading-7 text-foreground-secondary'>
                جست‌وجو، بررسی وضعیت حساب و مدیریت نقش کاربران فروشگاه
              </p>
            </div>

            <Button
              type='button'
              variant='outline'
              size='sm'
              iconStart={<RefreshCw className='size-4' />}
              disabled={isLoading || isNavigating}
              loadingLabel='در حال به‌روزرسانی'
              onClick={() => void refresh()}
            >
              به‌روزرسانی
            </Button>
          </header>

          <AdminUsersFilterBar
            draft={draftFilters}
            loading={isLoading || isNavigating}
            onDraftChange={(patch) => {
              setDraftFilters((current) => ({
                ...current,
                ...patch,
              }));
            }}
            onApply={applyFilters}
            onReset={resetFilters}
          />

          {error ? (
            <section
              role='alert'
              className='flex flex-col gap-4 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='flex items-start gap-2 text-danger'>
                <CircleAlert className='mt-0.5 size-5 shrink-0' />

                <p className='text-sm font-semibold'>{error}</p>
              </div>

              <div className='flex gap-2'>
                <Button type='button' size='sm' variant='outline' onClick={clearError}>
                  بستن
                </Button>

                <Button
                  type='button'
                  size='sm'
                  iconStart={<RefreshCw />}
                  onClick={() => void refresh()}
                >
                  تلاش مجدد
                </Button>
              </div>
            </section>
          ) : null}

          <AdminUsersTable
            users={users}
            loading={isLoading}
            page={meta?.page ?? currentPage}
            pageSize={meta?.limit ?? USERS_PER_PAGE}
            totalItems={meta?.total ?? 0}
            onPageChange={(nextPage) => {
              updateUrl({
                page: nextPage,
              });
            }}
            onOpenDetails={handleOpenUserDetails}
          />
        </div>
      </main>
      <AdminUserDetailsSheet
        open={Boolean(selectedUserId)}
        userId={selectedUserId}
        onClose={handleCloseUserDetails}
        onUpdated={() => {
          void refresh();
        }}
      />
    </>
  );
}
