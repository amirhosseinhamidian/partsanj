'use client';

import { useToast } from '@/components/providers/toast-provider';

import { useStorefrontCustomerAuth } from '@/components/storefront/customer-auth/storefront-customer-auth-provider';

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

import { RadioGroup } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

import { storefrontContentReportApi } from '@/lib/api/storefront-content-report-client';

import { ClientApiError } from '@/lib/api/web-client';

import type {
  StorefrontContentReportReason,
  StorefrontContentReportTargetType,
} from '@/lib/storefront/interactions/content-report.types';

import { CircleAlert, Flag, ShieldAlert } from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

type StorefrontContentReportButtonProps = {
  targetType: StorefrontContentReportTargetType;

  targetId: string;

  className?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ثبت گزارش با خطا مواجه شد';
}

export function StorefrontContentReportButton({
  targetType,
  targetId,
  className,
}: StorefrontContentReportButtonProps) {
  const { status, openLogin } = useStorefrontCustomerAuth();

  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);

  const [pendingAfterLogin, setPendingAfterLogin] = useState(false);

  const [reason, setReason] = useState<StorefrontContentReportReason | null>(null);

  const [details, setDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [hasReported, setHasReported] = useState(false);

  const options = useMemo(
    () => [
      {
        value: 'SPAM',
        label: 'هرزنامه یا تبلیغات',
      },

      {
        value: 'ABUSE',
        label: 'محتوای نامناسب یا توهین‌آمیز',
      },

      {
        value: 'MISLEADING',
        label: 'اطلاعات گمراه‌کننده',
      },

      {
        value: 'PERSONAL_INFO',
        label: 'انتشار اطلاعات شخصی',
      },

      {
        value: 'OTHER',
        label: 'سایر',
      },
    ],
    [],
  );

  function handleOpen() {
    if (hasReported) {
      toast({
        position: 'top-left',
        variant: 'success',
        title: 'گزارش شما قبلاً ثبت شده است',
      });

      return;
    }

    if (status !== 'authenticated') {
      setPendingAfterLogin(true);

      openLogin();

      return;
    }

    setIsOpen(true);
  }

  useEffect(() => {
    if (status !== 'authenticated' || !pendingAfterLogin) {
      return;
    }

    setPendingAfterLogin(false);

    setIsOpen(true);
  }, [pendingAfterLogin, status]);

  async function submit() {
    if (!reason) {
      toast({
        position: 'top-left',
        variant: 'warning',
        title: 'دلیل گزارش را انتخاب کنید',
      });

      return;
    }

    const normalizedDetails = details.trim();

    if (reason === 'OTHER' && normalizedDetails.length < 3) {
      toast({
        position: 'top-left',
        variant: 'warning',
        title: 'لطفاً توضیح کوتاهی درباره گزارش بنویسید',
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await storefrontContentReportApi.create({
        targetType,

        targetId,

        reason,

        details: normalizedDetails || null,
      });

      setHasReported(true);

      setIsOpen(false);

      setReason(null);

      setDetails('');

      toast({
        position: 'top-left',

        variant: 'success',

        title: response.message ?? 'گزارش شما ثبت شد',
      });
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type='button'
        size='sm'
        variant='ghost'
        iconStart={<Flag />}
        disabled={hasReported}
        className={className}
        onClick={handleOpen}
      >
        {hasReported ? 'گزارش شد' : 'گزارش'}
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) {
            setIsOpen(nextOpen);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <span className='grid size-11 shrink-0 place-items-center rounded-control bg-danger-soft text-danger'>
                <ShieldAlert className='size-5' />
              </span>

              <div className='min-w-0'>
                <DialogTitle>گزارش محتوا</DialogTitle>

                <DialogDescription className='mt-1'>
                  اگر این محتوا نامناسب، گمراه‌کننده یا مزاحم است، دلیل گزارش را مشخص کنید.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className='space-y-5'>
            <RadioGroup
              value={reason ?? undefined}
              options={options}
              variant='card'
              size='sm'
              onValueChange={(value) => setReason(value as StorefrontContentReportReason)}
            />

            <div className='space-y-2'>
              <label className='block text-sm font-semibold text-foreground'>
                توضیحات
                {reason === 'OTHER' ? (
                  <span className='ms-1 text-danger'>*</span>
                ) : (
                  <span className='ms-1 font-normal text-foreground-muted'>(اختیاری)</span>
                )}
              </label>

              <Textarea
                value={details}
                rows={3}
                maxLength={1000}
                placeholder='در صورت نیاز توضیح بیشتری بنویسید...'
                onChange={(event) => setDetails(event.target.value)}
              />
            </div>

            <div className='flex gap-2 rounded-control border border-info/20 bg-info-soft p-3'>
              <CircleAlert className='mt-0.5 size-4 shrink-0 text-info' />

              <p className='text-xs leading-6 text-foreground-secondary'>
                گزارش باعث حذف خودکار محتوا نمی‌شود؛ ابتدا توسط پارت‌سنج بررسی خواهد شد.
              </p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isSubmitting}
              onClick={() => setIsOpen(false)}
            >
              انصراف
            </Button>

            <Button
              type='button'
              variant='danger'
              disabled={!reason}
              isLoading={isSubmitting}
              loadingLabel='در حال ثبت'
              iconStart={<Flag />}
              onClick={() => void submit()}
            >
              ثبت گزارش
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
