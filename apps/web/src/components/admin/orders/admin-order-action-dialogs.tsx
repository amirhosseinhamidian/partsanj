'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState, type FormEvent } from 'react';

type ConfirmOrderActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;

  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
};

export function ConfirmOrderActionDialog({
  open,
  title,
  description,
  confirmLabel,
  loading = false,
  onOpenChange,
  onConfirm,
}: ConfirmOrderActionDialogProps) {
  async function handleConfirm() {
    const completed = await onConfirm();

    if (completed) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className='w-[calc(100%-2rem)] max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{title}</DialogTitle>

          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className='justify-end gap-3'>
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
            isLoading={loading}
            loadingLabel='در حال ثبت'
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type CancelOrderDialogProps = {
  open: boolean;
  orderNumber: string;
  loading?: boolean;

  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
};

export function CancelOrderDialog({
  open,
  orderNumber,
  loading = false,
  onOpenChange,
  onConfirm,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      return;
    }

    const completed = await onConfirm(normalizedReason);

    if (completed) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className='w-[calc(100%-2rem)] max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>لغو سفارش {orderNumber}</DialogTitle>

          <DialogDescription>
            این عملیات فقط برای سفارش‌های پرداخت‌نشده یا ناموفق مجاز است
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
            <label className='space-y-2'>
              <span className='text-sm font-bold text-foreground'>دلیل لغو</span>

              <Textarea
                value={reason}
                rows={5}
                disabled={loading}
                placeholder='دلیل لغو سفارش را ثبت کنید'
                onChange={(event) => {
                  setReason(event.target.value);
                }}
              />
            </label>
          </DialogBody>

          <DialogFooter className='mt-5 justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button
              type='submit'
              disabled={!reason.trim()}
              isLoading={loading}
              loadingLabel='در حال لغو'
              className='bg-danger text-white hover:bg-danger/90'
            >
              لغو سفارش
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
