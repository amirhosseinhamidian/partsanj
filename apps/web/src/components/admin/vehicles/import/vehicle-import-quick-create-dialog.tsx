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
import { Select } from '@/components/ui/select';
import type { AdminVehicleMakeListItem } from '@/lib/admin/vehicles/vehicle-management.types';
import type { VehicleQuickCreateReference } from '@/lib/admin/vehicles/vehicle-import.types';
import { CarFront, Route } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

type Props = {
  reference: VehicleQuickCreateReference | null;
  makes: AdminVehicleMakeListItem[];
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (input: {
    kind: 'make' | 'model';
    name: string;
    slug: string;
    makeSlug?: string;
  }) => Promise<void>;
};

export function VehicleImportQuickCreateDialog({
  reference,
  makes,
  isSubmitting,
  onClose,
  onCreate,
}: Props) {
  const [name, setName] = useState('');
  const [makeSlug, setMakeSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(reference?.suggestedName ?? '');
    setMakeSlug(reference?.kind === 'model' ? reference.makeSlug : '');
    setError(null);
  }, [reference]);

  const makeOptions = makes.map((make) => ({
    label: `${make.name} — ${make.slug}`,
    value: make.slug,
  }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reference) return;
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError('نام را وارد کنید');
      return;
    }
    if (reference.kind === 'model' && !makeSlug) {
      setError('برند خودرو را انتخاب کنید');
      return;
    }

    try {
      setError(null);
      await onCreate({
        kind: reference.kind,
        name: normalizedName,
        slug: reference.slug,
        makeSlug: reference.kind === 'model' ? makeSlug : undefined,
      });
    } catch (createError) {
      setError(
        createError instanceof Error && createError.message.trim()
          ? createError.message
          : 'ساخت مورد جدید با خطا مواجه شد',
      );
    }
  }

  const isModel = reference?.kind === 'model';

  return (
    <Dialog
      open={Boolean(reference)}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className='w-[calc(100%-2rem)] max-w-lg'>
        <DialogHeader className='text-start'>
          <div className='flex items-start gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              {isModel ? <Route className='size-5' /> : <CarFront className='size-5' />}
            </span>
            <div>
              <DialogTitle>
                {isModel ? 'ساخت مدل خودرو' : 'ساخت برند خودرو'}
              </DialogTitle>
              <DialogDescription className='mt-1'>
                پس از ساخت، فایل CSV به‌صورت خودکار دوباره بررسی می‌شود.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit}>
          <DialogBody className='space-y-5'>
            <label className='block space-y-2'>
              <span className='text-sm font-bold text-foreground'>نام</span>
              <Input
                value={name}
                disabled={isSubmitting}
                autoFocus
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
              />
            </label>

            <label className='block space-y-2'>
              <span className='text-sm font-bold text-foreground'>Slug</span>
              <Input dir='ltr' value={reference?.slug ?? ''} disabled />
            </label>

            {isModel ? (
              <Select
                id='vehicle-import-model-make'
                label='برند خودرو'
                value={makeSlug}
                options={makeOptions}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  setMakeSlug(value);
                  setError(null);
                }}
              />
            ) : null}

            {error ? (
              <p className='rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger'>
                {error}
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter className='gap-3'>
            <Button type='button' variant='outline' disabled={isSubmitting} onClick={onClose}>
              انصراف
            </Button>
            <Button type='submit' isLoading={isSubmitting} loadingLabel='در حال ساخت'>
              {isModel ? 'ساخت مدل' : 'ساخت برند'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
