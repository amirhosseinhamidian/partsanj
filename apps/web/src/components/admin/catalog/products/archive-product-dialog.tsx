'use client';

import type { AdminProductDetail } from '@/lib/admin/catalog/product.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Archive, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

type ArchiveProductDialogProps = {
  product: AdminProductDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (product: AdminProductDetail) => Promise<void>;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'آرشیو محصول با خطا مواجه شد';
}

export function ArchiveProductDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: ArchiveProductDialogProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setIsArchiving(false);
  }, [open, product?.id]);

  async function handleArchive() {
    if (!product || isArchiving) {
      return;
    }

    setIsArchiving(true);
    setError(null);

    try {
      await onConfirm(product);
      onOpenChange(false);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isArchiving) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className='max-w-md' showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>آرشیو محصول</DialogTitle>

          <DialogDescription>محصول از فروشگاه و ترب خارج می‌شود</DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-4'>
          {product ? (
            <>
              <div className='rounded-control border border-border bg-surface-muted p-4'>
                <p className='font-bold text-foreground'>{product.name}</p>

                <p dir='ltr' className='mt-1 text-sm text-foreground-muted'>
                  SKU: {product.sku}
                </p>
              </div>

              <div className='flex gap-3 rounded-control border border-warning/30 bg-warning-soft p-4 text-warning'>
                <AlertTriangle className='mt-0.5 size-5 shrink-0' />

                <p className='text-sm leading-6'>
                  با آرشیو کردن محصول، وضعیت آن به آرشیو تغییر می‌کند و نمایش عمومی و ارسال به ترب
                  نیز غیرفعال خواهد شد
                </p>
              </div>
            </>
          ) : null}

          {error ? (
            <div
              role='alert'
              className='rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger'
            >
              {error}
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline' disabled={isArchiving}>
              انصراف
            </Button>
          </DialogClose>

          <Button
            type='button'
            variant='danger'
            iconStart={<Archive />}
            isLoading={isArchiving}
            disabled={isArchiving}
            onClick={() => void handleArchive()}
          >
            آرشیو محصول
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
