'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Home, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import type { AdminVehicleModelListItem } from '@/lib/admin/vehicles/vehicle-management.types';
import { adminVehiclesApi } from '@/lib/api/admin-vehicles-client';

type VehicleModelHomeSettingsSheetProps = {
  open: boolean;
  model: AdminVehicleModelListItem | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
};

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره تنظیمات صفحه اصلی با خطا مواجه شد';
}

export function VehicleModelHomeSettingsSheet({
  open,
  model,
  onOpenChange,
  onSaved,
}: VehicleModelHomeSettingsSheetProps) {
  const [showOnHome, setShowOnHome] = useState(false);
  const [homeSortOrder, setHomeSortOrder] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setShowOnHome(model?.showOnHome ?? false);
    setHomeSortOrder(String(model?.homeSortOrder ?? 0));
    setError(null);
    setIsSaving(false);
  }, [model, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!model) {
      return;
    }

    const normalizedOrder = toEnglishDigits(homeSortOrder).trim();
    const order = normalizedOrder ? Number(normalizedOrder) : 0;

    if (!Number.isSafeInteger(order) || order < 0) {
      setError('ترتیب نمایش باید یک عدد صحیح صفر یا بزرگ‌تر باشد');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await adminVehiclesApi.updateModelHomeSettings(model.id, {
        showOnHome,
        homeSortOrder: order,
      });

      await onSaved();
      onOpenChange(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSaving) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <SheetContent className='w-full sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>نمایش در صفحه اصلی</SheetTitle>
          <SheetDescription>
            تعیین کنید این مدل خودرو در ردیف «خرید قطعه بر اساس خودرو» نمایش داده شود یا نه
          </SheetDescription>
        </SheetHeader>

        <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
          <SheetBody className='space-y-5'>
            {model ? (
              <div className='flex items-center gap-3 rounded-card border border-border bg-surface-muted/40 p-4'>
                <span className='grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                  <Home className='size-5' />
                </span>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-extrabold text-foreground'>
                    {model.make.name} {model.name}
                  </p>
                  <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
                    /vehicles/{model.slug}
                  </p>
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                role='alert'
                className='rounded-control border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger'
              >
                {error}
              </div>
            ) : null}

            <FormField
              label='نمایش در صفحه اصلی'
              helperText='فقط مدل‌های فعال و دارای حداقل یک تیپ فعال در هوم نمایش داده می‌شوند'
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Switch
                  id={id}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving}
                  checked={showOnHome}
                  onCheckedChange={setShowOnHome}
                />
              )}
            </FormField>

            <FormField
              label='ترتیب نمایش در هوم'
              helperText='عدد کوچک‌تر زودتر نمایش داده می‌شود؛ مثال: ۰، ۱۰، ۲۰'
            >
              {({ id, labelId, describedBy, invalid }) => (
                <Input
                  id={id}
                  dir='ltr'
                  inputMode='numeric'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  disabled={isSaving || !showOnHome}
                  value={homeSortOrder}
                  onChange={(event) => {
                    setHomeSortOrder(toEnglishDigits(event.target.value).replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder='0'
                />
              )}
            </FormField>
          </SheetBody>

          <SheetFooter>
            <Button
              type='button'
              variant='outline'
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type='submit' iconStart={<Save />} isLoading={isSaving} disabled={!model}>
              ذخیره تنظیمات هوم
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
