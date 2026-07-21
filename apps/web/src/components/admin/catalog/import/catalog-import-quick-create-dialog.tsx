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
import { Input } from '@/components/ui/input';
import type { AdminCategory } from '@/lib/admin/catalog/category.types';
import type {
  QuickCreateCatalogReference,
  QuickCreateCatalogReferenceInput,
} from '@/lib/admin/catalog/catalog-import.types';
import { FolderPlus, Tags } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Select } from '@/components/ui/select';

type CatalogImportQuickCreateDialogProps = {
  reference: QuickCreateCatalogReference | null;
  categories: AdminCategory[];
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (input: QuickCreateCatalogReferenceInput) => Promise<void>;
};

const ROOT_CATEGORY_VALUE = '__ROOT_CATEGORY__';

export function CatalogImportQuickCreateDialog({
  reference,
  categories,
  isSubmitting,
  onClose,
  onCreate,
}: CatalogImportQuickCreateDialogProps) {
  const [name, setName] = useState('');
  const [parentSlug, setParentSlug] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const parentCategoryOptions = [
    {
      label: 'دسته اصلی بدون والد',
      value: ROOT_CATEGORY_VALUE,
    },
    ...categories.map((category) => ({
      label: `${category.name} — ${category.slug}`,
      value: category.slug,
    })),
  ] satisfies Array<{
    label: string;
    value: string;
  }>;

  useEffect(() => {
    setName(reference?.suggestedName ?? '');

    setParentSlug(reference?.kind === 'category' ? reference.suggestedParentSlug : '');

    setFormError(null);
  }, [reference]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reference) {
      return;
    }

    const normalizedName = name.trim();

    if (!normalizedName) {
      setFormError('نام را وارد کنید');
      return;
    }

    if (
      reference.kind === 'category' &&
      parentSlug &&
      !categories.some((category) => category.slug === parentSlug)
    ) {
      setFormError('دسته‌بندی والد انتخاب‌شده در دیتابیس وجود ندارد');
      return;
    }

    setFormError(null);

    try {
      await onCreate({
        kind: reference.kind,
        name: normalizedName,
        slug: reference.slug,
        parentSlug: reference.kind === 'category' ? parentSlug || undefined : undefined,
      });
    } catch (error) {
      setFormError(
        error instanceof Error && error.message.trim()
          ? error.message
          : 'ساخت مورد جدید با خطا مواجه شد',
      );
    }
  }

  const isCategory = reference?.kind === 'category';

  return (
    <Dialog
      open={Boolean(reference)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent className='w-[calc(100%-2rem)] max-w-lg'>
        <DialogHeader className='text-start'>
          <div className='flex items-start gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              {isCategory ? <FolderPlus className='size-5' /> : <Tags className='size-5' />}
            </span>

            <div className='min-w-0'>
              <DialogTitle className='text-lg font-extrabold text-foreground'>
                {isCategory ? 'ساخت دسته‌بندی گمشده' : 'ساخت برند گمشده'}
              </DialogTitle>

              <DialogDescription className='mt-1 text-xs leading-6 text-foreground-secondary'>
                بعد از ساخت، فایل CSV به‌صورت خودکار دوباره بررسی می‌شود.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className='space-y-5'>
            <label className='block space-y-2'>
              <span className='text-sm font-bold text-foreground'>نام</span>

              <Input
                value={name}
                disabled={isSubmitting}
                autoFocus
                placeholder={isCategory ? 'نام دسته‌بندی' : 'نام برند'}
                onChange={(event) => {
                  setName(event.target.value);
                  setFormError(null);
                }}
              />
            </label>

            <label className='block space-y-2'>
              <span className='text-sm font-bold text-foreground'>Slug</span>

              <Input dir='ltr' value={reference?.slug ?? ''} disabled className='text-left' />

              <span className='block text-xs leading-5 text-foreground-muted'>
                Slug قابل تغییر نیست؛ چون محصول داخل CSV با همین مقدار به آن ارجاع داده است.
              </span>
            </label>

            {isCategory ? (
              <Select
                id='catalog-import-parent-category'
                label='دسته‌بندی والد'
                value={parentSlug || ROOT_CATEGORY_VALUE}
                options={parentCategoryOptions}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  setParentSlug(value === ROOT_CATEGORY_VALUE ? '' : value);

                  setFormError(null);
                }}
              />
            ) : null}

            {formError ? (
              <p className='rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger'>
                {formError}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter className='gap-3'>
            <Button type='button' variant='outline' disabled={isSubmitting} onClick={onClose}>
              انصراف
            </Button>

            <Button
              type='submit'
              isLoading={isSubmitting}
              loadingLabel='در حال ساخت'
              iconStart={
                isCategory ? <FolderPlus className='size-4' /> : <Tags className='size-4' />
              }
            >
              {isCategory ? 'ساخت دسته‌بندی' : 'ساخت برند'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
