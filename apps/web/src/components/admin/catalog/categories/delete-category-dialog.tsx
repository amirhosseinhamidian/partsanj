'use client';

import type { AdminCategory } from '@/lib/admin/catalog/category.types';
import { ClientApiError } from '@/lib/api/web-client';
import { Badge } from '@/components/ui/badge';
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
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';

type DeleteCategoryDialogProps = {
  open: boolean;
  category: AdminCategory | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (category: AdminCategory) => Promise<void>;
};

function getDeleteErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError && error.code === 'CATEGORY_HAS_DEPENDENCIES') {
    return 'این دسته‌بندی دارای محصول یا زیر‌دسته وابسته است و قابل حذف نیست';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'حذف دسته‌بندی با خطا مواجه شد';
}

export function DeleteCategoryDialog({
  open,
  category,
  onOpenChange,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dependencyState = useMemo(() => {
    const childrenCount = category?._count.children ?? 0;
    const productsCount = category?._count.products ?? 0;

    return {
      childrenCount,
      productsCount,
      canDelete: childrenCount === 0 && productsCount === 0,
    };
  }, [category]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    setIsDeleting(false);
  }, [open, category?.id]);

  async function handleDelete() {
    if (!category || !dependencyState.canDelete || isDeleting) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm(category);
      onOpenChange(false);
    } catch (error) {
      setError(getDeleteErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className='max-w-md' showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>حذف دسته‌بندی</DialogTitle>

          <DialogDescription>این عملیات قابل بازگشت نیست</DialogDescription>
        </DialogHeader>

        <DialogBody className='space-y-4'>
          {category ? (
            <>
              <div className='rounded-control border border-border bg-surface-muted p-4'>
                <p className='font-bold text-foreground'>{category.name}</p>

                <p dir='ltr' className='mt-1 text-sm text-foreground-muted'>
                  {category.slug}
                </p>
              </div>

              {dependencyState.canDelete ? (
                <div className='flex gap-3 rounded-control border border-warning/30 bg-warning-soft p-4 text-warning'>
                  <AlertTriangle className='mt-0.5 size-5 shrink-0' />

                  <p className='text-sm leading-6'>
                    با حذف این دسته‌بندی، اطلاعات آن برای همیشه حذف می‌شود و امکان بازیابی آن وجود
                    ندارد
                  </p>
                </div>
              ) : (
                <div
                  role='alert'
                  className='rounded-control border border-danger/30 bg-danger-soft p-4'
                >
                  <p className='font-semibold text-danger'>حذف این دسته‌بندی ممکن نیست</p>

                  <div className='mt-3 flex flex-wrap gap-2'>
                    {dependencyState.childrenCount > 0 ? (
                      <Badge variant='danger'>
                        {toPersianDigits(dependencyState.childrenCount)} زیر‌دسته وابسته
                      </Badge>
                    ) : null}

                    {dependencyState.productsCount > 0 ? (
                      <Badge variant='danger'>
                        {toPersianDigits(dependencyState.productsCount)} محصول وابسته
                      </Badge>
                    ) : null}
                  </div>

                  <p className='mt-3 text-sm leading-6 text-danger'>
                    ابتدا زیر‌دسته‌ها و محصولات وابسته را منتقل یا حذف کنید
                  </p>
                </div>
              )}
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
            <Button type='button' variant='outline' disabled={isDeleting}>
              انصراف
            </Button>
          </DialogClose>

          {dependencyState.canDelete ? (
            <Button
              type='button'
              variant='danger'
              iconStart={<Trash2 />}
              isLoading={isDeleting}
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              حذف نهایی
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
