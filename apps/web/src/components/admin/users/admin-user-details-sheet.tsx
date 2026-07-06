'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CarFront,
  CircleAlert,
  Clock3,
  LockKeyhole,
  MapPinned,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, type SelectOption } from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type {
  AdminUserDetail,
  AdminUserRole,
  UpdateAdminUserInput,
} from '@/lib/admin/users/admin-user.types';
import { useAdminUserDetails } from '@/lib/admin/users/use-admin-user-details';
import { toPersianDigits } from '@/lib/utils/digits';

type UserEditDraft = {
  role: AdminUserRole;
  isActive: boolean;
};

type AdminUserDetailsSheetProps = {
  open: boolean;
  userId: string | null;

  onClose: () => void;

  onUpdated?: (user: AdminUserDetail) => void;
};

const editableRoleOptions: SelectOption[] = [
  {
    value: 'CUSTOMER',
    label: 'مشتری',
  },
  {
    value: 'SUPPORT',
    label: 'پشتیبان',
  },
];

const statusOptions: SelectOption[] = [
  {
    value: 'true',
    label: 'فعال',
  },
  {
    value: 'false',
    label: 'غیرفعال',
  },
];

function formatDateTime(value: string | null) {
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getUserDisplayName(user: AdminUserDetail) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return fullName || 'بدون نام';
}

function getVehicleTitle(vehicle: AdminUserDetail['customerVehicles'][number]) {
  return [
    vehicle.vehicleVariant.model.make.name,
    vehicle.vehicleVariant.model.name,
    vehicle.vehicleVariant.name,
  ]
    .filter(Boolean)
    .join(' ');
}

function getVehicleMeta(vehicle: AdminUserDetail['customerVehicles'][number]) {
  const { engineCode, engineName, yearFrom, yearTo } = vehicle.vehicleVariant;

  const items: string[] = [];

  if (engineName) {
    items.push(engineName);
  }

  if (engineCode) {
    items.push(`کد موتور: ${engineCode}`);
  }

  if (yearFrom !== null && yearTo !== null) {
    items.push(`${toPersianDigits(String(yearFrom))} تا ${toPersianDigits(String(yearTo))}`);
  }

  return items.join(' · ');
}

function RoleBadge({ role }: { role: AdminUserRole }) {
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant='success' dot>
      فعال
    </Badge>
  ) : (
    <Badge variant='danger' dot>
      غیرفعال
    </Badge>
  );
}

export function AdminUserDetailsSheet({
  open,
  userId,
  onClose,
  onUpdated,
}: AdminUserDetailsSheetProps) {
  const { user, isLoading, isSaving, error, saveError, refresh, save, clearError, clearSaveError } =
    useAdminUserDetails(open ? userId : null);

  const [draft, setDraft] = useState<UserEditDraft | null>(null);

  useEffect(() => {
    if (!user) {
      setDraft(null);

      return;
    }

    setDraft({
      role: user.role,
      isActive: user.isActive,
    });
  }, [user?.id, user?.role, user?.isActive]);

  const isAdminAccount = user?.role === 'ADMIN';

  const hasChanges = useMemo(() => {
    if (!user || !draft) {
      return false;
    }

    return draft.role !== user.role || draft.isActive !== user.isActive;
  }, [draft, user]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isSaving) {
      onClose();
    }
  }

  async function handleSave() {
    if (!user || !draft || !hasChanges || isAdminAccount) {
      return;
    }

    const payload: UpdateAdminUserInput = {};

    if (draft.role !== user.role) {
      payload.role = draft.role;
    }

    if (draft.isActive !== user.isActive) {
      payload.isActive = draft.isActive;
    }

    const updatedUser = await save(payload);

    if (updatedUser) {
      onUpdated?.(updatedUser);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side='right'
        className='max-w-2xl'
        showCloseButton={!isSaving}
        onEscapeKeyDown={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
      >
        <SheetHeader className='border-b border-border pb-5'>
          <SheetTitle>جزئیات کاربر</SheetTitle>

          <SheetDescription>
            مشاهده اطلاعات حساب، خودروهای ذخیره‌شده و مدیریت نقش یا وضعیت کاربر
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {isLoading ? (
            <AdminUserDetailsSkeleton />
          ) : error ? (
            <div
              role='alert'
              className='rounded-card border border-danger/30 bg-danger-soft p-5 text-center'
            >
              <CircleAlert className='mx-auto size-7 text-danger' />

              <p className='mt-3 text-sm font-bold text-danger'>{error}</p>

              <div className='mt-4 flex justify-center gap-2'>
                <Button type='button' variant='outline' size='sm' onClick={clearError}>
                  بستن
                </Button>

                <Button
                  type='button'
                  size='sm'
                  iconStart={<RefreshCw />}
                  onClick={() => {
                    void refresh();
                  }}
                >
                  تلاش مجدد
                </Button>
              </div>
            </div>
          ) : user ? (
            <div className='space-y-6'>
              <section className='bg-card rounded-card border border-border p-4'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div className='flex min-w-0 items-start gap-3'>
                    <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand'>
                      <UserRound className='size-5' />
                    </span>

                    <div className='min-w-0'>
                      <h3 className='truncate text-base font-extrabold text-foreground'>
                        {getUserDisplayName(user)}
                      </h3>

                      <p dir='ltr' className='numeric mt-1 text-sm text-foreground-secondary'>
                        {toPersianDigits(user.mobile)}
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <RoleBadge role={user.role} />
                    <StatusBadge isActive={user.isActive} />
                  </div>
                </div>

                <div className='mt-5 grid gap-3 sm:grid-cols-2'>
                  <AdminUserInfoItem
                    icon={<ShieldCheck />}
                    label='وضعیت تأیید موبایل'
                    value={user.mobileVerifiedAt ? 'تأیید شده' : 'تأیید نشده'}
                  />

                  <AdminUserInfoItem
                    icon={<Clock3 />}
                    label='آخرین ورود'
                    value={formatDateTime(user.lastLoginAt)}
                  />

                  <AdminUserInfoItem
                    icon={<CalendarDays />}
                    label='تاریخ عضویت'
                    value={formatDateTime(user.createdAt)}
                  />

                  <AdminUserInfoItem
                    icon={<Phone />}
                    label='شماره موبایل'
                    value={toPersianDigits(user.mobile)}
                    ltr
                  />
                </div>
              </section>

              <section>
                <h3 className='text-sm font-extrabold text-foreground'>خلاصه فعالیت</h3>

                <div className='mt-3 grid gap-3 sm:grid-cols-3'>
                  <AdminUserCountCard
                    icon={<CarFront />}
                    label='خودرو'
                    value={user._count.customerVehicles}
                  />

                  <AdminUserCountCard
                    icon={<MapPinned />}
                    label='آدرس'
                    value={user._count.addresses}
                  />

                  <AdminUserCountCard
                    icon={<ShoppingBag />}
                    label='سفارش'
                    value={user._count.orders}
                  />
                </div>
              </section>

              <section>
                <div className='flex items-center justify-between gap-3'>
                  <h3 className='text-sm font-extrabold text-foreground'>خودروهای ذخیره‌شده</h3>

                  <span className='text-xs text-foreground-muted'>
                    {toPersianDigits(String(user.customerVehicles.length))} خودرو
                  </span>
                </div>

                {user.customerVehicles.length > 0 ? (
                  <div className='mt-3 space-y-3'>
                    {user.customerVehicles.map((vehicle) => (
                      <article
                        key={vehicle.id}
                        className='bg-card rounded-control border border-border p-3'
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-bold text-foreground'>
                              {vehicle.label || getVehicleTitle(vehicle)}
                            </p>

                            {vehicle.label ? (
                              <p className='mt-1 truncate text-xs text-foreground-secondary'>
                                {getVehicleTitle(vehicle)}
                              </p>
                            ) : null}

                            {getVehicleMeta(vehicle) ? (
                              <p className='mt-2 text-xs leading-5 text-foreground-muted'>
                                {getVehicleMeta(vehicle)}
                              </p>
                            ) : null}
                          </div>

                          {vehicle.isDefault ? (
                            <Badge size='sm' variant='brand'>
                              پیش‌فرض
                            </Badge>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className='mt-3 rounded-control border border-dashed border-border p-5 text-center text-sm text-foreground-muted'>
                    خودرویی برای این کاربر ثبت نشده است
                  </div>
                )}
              </section>

              <section className='bg-card rounded-card border border-border p-4'>
                <div className='flex items-start gap-3'>
                  <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand'>
                    <ShieldCheck className='size-4' />
                  </span>

                  <div>
                    <h3 className='text-sm font-extrabold text-foreground'>مدیریت دسترسی حساب</h3>

                    <p className='mt-1 text-xs leading-5 text-foreground-secondary'>
                      نقش و وضعیت حساب فقط برای کاربران Customer و Support قابل تغییر است
                    </p>
                  </div>
                </div>

                {isAdminAccount ? (
                  <div className='mt-4 flex items-start gap-2 rounded-control border border-warning/30 bg-warning-soft p-3 text-sm text-warning'>
                    <LockKeyhole className='mt-0.5 size-4 shrink-0' />

                    <p>مدیریت حساب‌های ادمین از این پنل محدود شده است</p>
                  </div>
                ) : draft ? (
                  <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                    <Select
                      id='admin-user-role'
                      label='نقش کاربر'
                      value={draft.role}
                      options={editableRoleOptions}
                      disabled={isSaving}
                      onValueChange={(value) => {
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                role: value as AdminUserRole,
                              }
                            : current,
                        );
                      }}
                    />

                    <Select
                      id='admin-user-status'
                      label='وضعیت حساب'
                      value={String(draft.isActive)}
                      options={statusOptions}
                      disabled={isSaving}
                      onValueChange={(value) => {
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                isActive: value === 'true',
                              }
                            : current,
                        );
                      }}
                    />
                  </div>
                ) : null}

                {saveError ? (
                  <div
                    role='alert'
                    className='mt-4 flex items-start justify-between gap-3 rounded-control border border-danger/30 bg-danger-soft p-3 text-sm text-danger'
                  >
                    <p>{saveError}</p>

                    <button
                      type='button'
                      onClick={clearSaveError}
                      className='shrink-0 text-xs font-bold hover:opacity-70'
                    >
                      بستن
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}
        </SheetBody>

        <SheetFooter>
          <Button type='button' variant='outline' disabled={isSaving} onClick={onClose}>
            بستن
          </Button>

          {!isAdminAccount ? (
            <Button
              type='button'
              disabled={!user || !draft || !hasChanges || isSaving}
              isLoading={isSaving}
              loadingLabel='در حال ذخیره'
              iconStart={<Save />}
              onClick={() => {
                void handleSave();
              }}
            >
              ذخیره تغییرات
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function AdminUserInfoItem({
  icon,
  label,
  value,
  ltr = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className='bg-muted/50 flex items-start gap-2 rounded-control p-3'>
      <span className='mt-0.5 text-foreground-muted'>{icon}</span>

      <div className='min-w-0'>
        <p className='text-xs text-foreground-muted'>{label}</p>

        <p
          dir={ltr ? 'ltr' : undefined}
          className='mt-1 truncate text-sm font-semibold text-foreground-secondary'
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function AdminUserCountCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className='bg-card rounded-card border border-border p-4'>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-foreground-muted'>{icon}</span>

        <p className='numeric text-lg font-extrabold text-foreground'>
          {toPersianDigits(String(value))}
        </p>
      </div>

      <p className='mt-3 text-sm text-foreground-secondary'>{label}</p>
    </div>
  );
}

function AdminUserDetailsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='animate-pulse rounded-card border border-border p-4'>
        <div className='bg-muted h-5 w-40 rounded' />
        <div className='bg-muted mt-3 h-4 w-28 rounded' />

        <div className='mt-6 grid gap-3 sm:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='bg-muted h-16 rounded-control' />
          ))}
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='bg-muted h-24 animate-pulse rounded-card' />
        ))}
      </div>

      <div className='bg-muted h-40 animate-pulse rounded-card' />
    </div>
  );
}
