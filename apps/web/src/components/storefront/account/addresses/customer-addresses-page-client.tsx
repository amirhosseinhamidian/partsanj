'use client';

import {
  CustomerAddressFormSheet,
  type CustomerAddressFormSubmitValue,
} from '@/components/storefront/customer-address/customer-address-form-sheet';
import { useToast } from '@/components/providers/toast-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { storefrontCustomerAddressApi } from '@/lib/api/storefront-customer-address-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  CustomerAddressBaseInput,
  StorefrontCustomerAddress,
} from '@/lib/storefront/customer-address/customer-address.types';
import {
  Archive,
  CircleAlert,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStorefrontCustomerAuth } from '../../customer-auth/storefront-customer-auth-provider';
import { toPersianDigits } from '@/lib/utils/digits';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'عملیات مربوط به نشانی با خطا مواجه شد';
}

function getRecipientName(address: StorefrontCustomerAddress) {
  return [address.recipientFirstName, address.recipientLastName].filter(Boolean).join(' ');
}

function getLocationLabel(address: StorefrontCustomerAddress) {
  return [address.province, address.city, address.district].filter(Boolean).join('، ');
}

function getFullAddress(address: StorefrontCustomerAddress) {
  return [
    getLocationLabel(address),
    address.addressLine,
    address.plaque ? `پلاک ${address.plaque}` : null,
    address.floor ? `طبقه ${address.floor}` : null,
    address.unit ? `واحد ${address.unit}` : null,
  ]
    .filter(Boolean)
    .join('، ');
}

function AddressCard({
  address,
  pendingDefaultId,
  onEdit,
  onSetDefault,
  onArchive,
}: {
  address: StorefrontCustomerAddress;
  pendingDefaultId: string | null;
  onEdit: (address: StorefrontCustomerAddress) => void;
  onSetDefault: (address: StorefrontCustomerAddress) => void;
  onArchive: (address: StorefrontCustomerAddress) => void;
}) {
  const isSettingDefault = pendingDefaultId === address.id;

  return (
    <article className='rounded-card border border-border bg-surface p-5 shadow-panel'>
      <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
            <MapPin className='size-5' />
          </span>

          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='text-lg font-extrabold text-foreground'>{address.label}</h2>

              {address.isDefault ? (
                <Badge variant='success' dot>
                  نشانی پیش‌فرض
                </Badge>
              ) : null}
            </div>

            <p className='mt-2 text-sm font-bold text-foreground-secondary'>
              {getRecipientName(address)}
            </p>

            <p className='mt-1 text-sm text-foreground-secondary'>
              {toPersianDigits(address.recipientMobile)}
            </p>
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            iconStart={<Pencil className='size-4' />}
            onClick={() => onEdit(address)}
          >
            ویرایش
          </Button>

          {!address.isDefault ? (
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={isSettingDefault}
              isLoading={isSettingDefault}
              loadingLabel='در حال انتخاب'
              iconStart={<Star className='size-4' />}
              onClick={() => onSetDefault(address)}
            >
              انتخاب پیش‌فرض
            </Button>
          ) : null}

          <Button
            type='button'
            size='sm'
            variant='outline'
            className='border-danger/40 text-danger hover:bg-danger-soft'
            iconStart={<Trash2 className='size-4' />}
            onClick={() => onArchive(address)}
          >
            حذف
          </Button>
        </div>
      </div>

      <div className='mt-5 border-t border-border pt-5'>
        <p className='text-sm leading-7 text-foreground-secondary'>{getFullAddress(address)}</p>

        <div className='mt-4 grid gap-3 text-sm sm:grid-cols-2'>
          <div className='rounded-control border border-border bg-surface-muted p-3'>
            <p className='text-xs text-foreground-muted'>کد پستی</p>

            <p dir='ltr' className='mt-1 font-bold text-foreground-secondary'>
              {toPersianDigits(address.postalCode)}
            </p>
          </div>

          {address.deliveryNotes ? (
            <div className='rounded-control border border-border bg-surface-muted p-3'>
              <p className='text-xs text-foreground-muted'>توضیحات ارسال</p>

              <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                {address.deliveryNotes}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ArchiveAddressDialog({
  address,
  loading,
  onOpenChange,
  onConfirm,
}: {
  address: StorefrontCustomerAddress | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}) {
  async function handleConfirm() {
    const completed = await onConfirm();

    if (completed) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={Boolean(address)}
      onOpenChange={(nextOpen) => {
        if (!loading && !nextOpen) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className='w-[calc(100%-2rem)] max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>حذف نشانی {address?.label ?? ''}</DialogTitle>

          <DialogDescription>
            این نشانی از فهرست فعال شما حذف می‌شود و دیگر در مرحله ثبت سفارش قابل انتخاب نخواهد بود
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className='flex gap-3 rounded-control border border-danger/30 bg-danger-soft p-4'>
            <Archive className='mt-0.5 size-5 shrink-0 text-danger' />

            <p className='text-sm leading-7 text-foreground-secondary'>
              این عملیات قابل بازگردانی از پنل کاربری نیست
            </p>
          </div>
        </DialogBody>

        <DialogFooter className='gap-3'>
          <Button
            type='button'
            variant='outline'
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>

          <Button
            type='button'
            disabled={loading}
            isLoading={loading}
            loadingLabel='در حال حذف'
            className='bg-danger text-white hover:bg-danger/90'
            onClick={() => void handleConfirm()}
          >
            حذف نشانی
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='h-56 animate-pulse rounded-card bg-surface-muted' />
      ))}
    </div>
  );
}

export function CustomerAddressesPageClient() {
  const { toast } = useToast();

  const { status, openLogin } = useStorefrontCustomerAuth();

  const hasOpenedLoginRef = useRef(false);

  const [addresses, setAddresses] = useState<StorefrontCustomerAddress[] | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingAddress, setEditingAddress] = useState<StorefrontCustomerAddress | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [pendingDefaultId, setPendingDefaultId] = useState<string | null>(null);

  const [archiveCandidate, setArchiveCandidate] = useState<StorefrontCustomerAddress | null>(null);

  const [isArchiving, setIsArchiving] = useState(false);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await storefrontCustomerAddressApi.list();

      setAddresses(response.data);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        openLogin({
          returnTo: '/account/addresses',
        });

        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [openLogin]);

  useEffect(() => {
    if (status !== 'guest' || hasOpenedLoginRef.current) {
      return;
    }

    hasOpenedLoginRef.current = true;

    openLogin({
      returnTo: '/account/addresses',
    });
  }, [openLogin, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    void loadAddresses();
  }, [loadAddresses, status]);

  function openCreateForm() {
    setEditingAddress(null);
    setIsFormOpen(true);
  }

  function openEditForm(address: StorefrontCustomerAddress) {
    setEditingAddress(address);
    setIsFormOpen(true);
  }

  function handleFormOpenChange(nextOpen: boolean) {
    setIsFormOpen(nextOpen);

    if (!nextOpen) {
      setEditingAddress(null);
    }
  }

  async function handleSaveAddress(form: CustomerAddressFormSubmitValue) {
    setIsSaving(true);

    try {
      const { isDefault, ...addressInput } = form;

      const payload: CustomerAddressBaseInput = {
        ...addressInput,
      };

      if (editingAddress) {
        const response = await storefrontCustomerAddressApi.update(editingAddress.id, payload);

        if (isDefault && !response.data.isDefault) {
          await storefrontCustomerAddressApi.setDefault(response.data.id);
        }

        toast({
          position: 'top-left',
          variant: 'success',
          title: 'نشانی با موفقیت ویرایش شد',
        });
      } else {
        await storefrontCustomerAddressApi.create({
          ...payload,
          isDefault,
        });

        toast({
          position: 'top-left',
          variant: 'success',
          title: 'نشانی جدید با موفقیت ثبت شد',
        });
      }

      await loadAddresses();

      return true;
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: 'ذخیره نشانی انجام نشد',
        description: getErrorMessage(error),
      });

      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefault(address: StorefrontCustomerAddress) {
    setPendingDefaultId(address.id);

    try {
      await storefrontCustomerAddressApi.setDefault(address.id);

      await loadAddresses();

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'نشانی پیش‌فرض تغییر کرد',
      });
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: 'تغییر نشانی پیش‌فرض انجام نشد',
        description: getErrorMessage(error),
      });
    } finally {
      setPendingDefaultId(null);
    }
  }

  async function handleArchiveAddress() {
    if (!archiveCandidate) {
      return false;
    }

    setIsArchiving(true);

    try {
      await storefrontCustomerAddressApi.archive(archiveCandidate.id);

      await loadAddresses();

      toast({
        position: 'top-left',
        variant: 'success',
        title: 'نشانی حذف شد',
      });

      return true;
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: 'حذف نشانی انجام نشد',
        description: getErrorMessage(error),
      });

      return false;
    } finally {
      setIsArchiving(false);
    }
  }

  if (status === 'loading' || (status === 'authenticated' && isLoading && addresses === null)) {
    return <LoadingState />;
  }

  if (status === 'guest') {
    return (
      <section className='rounded-card border border-border bg-surface p-8 text-center shadow-panel'>
        <UserRound className='mx-auto size-10 text-brand' />

        <h1 className='mt-4 text-2xl font-extrabold text-foreground'>ورود به حساب کاربری</h1>

        <p className='mx-auto mt-3 max-w-xl text-sm leading-7 text-foreground-secondary'>
          برای مدیریت نشانی‌های ارسال، وارد حساب کاربری خود شوید
        </p>

        <Button
          className='mt-5'
          onClick={() => {
            openLogin({
              returnTo: '/account/addresses',
            });
          }}
        >
          ورود یا ثبت‌نام
        </Button>
      </section>
    );
  }

  const activeAddresses = addresses ?? [];

  return (
    <div className='space-y-6'>
      <section className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-brand'>حساب کاربری</p>

          <h1 className='type-page-title mt-1 text-foreground'>آدرس‌ها</h1>

          <p className='type-body mt-2 text-foreground-secondary'>
            نشانی‌های مورد استفاده برای ارسال سفارش‌ها را مدیریت کنید
          </p>
        </div>

        <Button iconStart={<Plus className='size-4' />} onClick={openCreateForm}>
          افزودن نشانی
        </Button>
      </section>

      {loadError ? (
        <section
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-5 sm:flex-row sm:items-center sm:justify-between'
        >
          <div className='flex items-start gap-3'>
            <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

            <p className='text-sm leading-7 font-semibold text-danger'>{loadError}</p>
          </div>

          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw className='size-4' />}
            onClick={() => void loadAddresses()}
          >
            تلاش مجدد
          </Button>
        </section>
      ) : null}

      {activeAddresses.length === 0 && !isLoading && !loadError ? (
        <section className='rounded-card border border-dashed border-border bg-surface p-10 text-center'>
          <MapPin className='mx-auto size-10 text-foreground-muted' />

          <h2 className='mt-4 text-lg font-extrabold text-foreground'>
            هنوز نشانی‌ای ثبت نکرده‌اید
          </h2>

          <p className='mx-auto mt-2 max-w-xl text-sm leading-7 text-foreground-secondary'>
            برای سرعت بیشتر در ثبت سفارش، نشانی محل تحویل را از همین حالا ثبت کنید
          </p>

          <Button className='mt-5' iconStart={<Plus className='size-4' />} onClick={openCreateForm}>
            ثبت اولین نشانی
          </Button>
        </section>
      ) : null}

      {activeAddresses.length > 0 ? (
        <div aria-busy={isLoading} className='space-y-4'>
          {activeAddresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              pendingDefaultId={pendingDefaultId}
              onEdit={openEditForm}
              onSetDefault={(selectedAddress) => {
                void handleSetDefault(selectedAddress);
              }}
              onArchive={setArchiveCandidate}
            />
          ))}
        </div>
      ) : null}

      <CustomerAddressFormSheet
        open={isFormOpen}
        address={editingAddress}
        initialDefault={!editingAddress && activeAddresses.length === 0}
        loading={isSaving}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleSaveAddress}
      />

      <ArchiveAddressDialog
        address={archiveCandidate}
        loading={isArchiving}
        onOpenChange={() => {
          setArchiveCandidate(null);
        }}
        onConfirm={handleArchiveAddress}
      />
    </div>
  );
}
