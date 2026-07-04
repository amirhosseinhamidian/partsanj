'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { MarkOrderShippedInput } from '@/lib/admin/orders/admin-order.types';
import { Truck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

type ShipmentFormState = {
  shippingCarrier: string;
  trackingCode: string;
  shipmentNote: string;
};

type AdminOrderShipmentSheetProps = {
  open: boolean;
  orderNumber: string;
  loading?: boolean;

  initialValue: ShipmentFormState;

  onOpenChange: (open: boolean) => void;
  onSubmit: (input: MarkOrderShippedInput) => Promise<boolean>;
};

const EMPTY_FORM: ShipmentFormState = {
  shippingCarrier: '',
  trackingCode: '',
  shipmentNote: '',
};

export function AdminOrderShipmentSheet({
  open,
  orderNumber,
  loading = false,
  initialValue,
  onOpenChange,
  onSubmit,
}: AdminOrderShipmentSheetProps) {
  const [form, setForm] = useState<ShipmentFormState>(EMPTY_FORM);

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(initialValue);
    setFormError(null);
  }, [initialValue, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const shippingCarrier = form.shippingCarrier.trim();
    const trackingCode = form.trackingCode.trim();
    const shipmentNote = form.shipmentNote.trim();

    if (!shippingCarrier || !trackingCode) {
      setFormError('شرکت حمل و کد رهگیری برای ثبت ارسال الزامی هستند');
      return;
    }

    setFormError(null);

    const completed = await onSubmit({
      shippingCarrier,
      trackingCode,
      shipmentNote: shipmentNote || undefined,
    });

    if (completed) {
      onOpenChange(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <SheetContent className='w-full sm:max-w-xl'>
        <SheetHeader>
          <div className='flex items-center gap-2'>
            <Truck className='size-5 text-brand' />

            <div>
              <h2 className='font-extrabold text-foreground'>ثبت ارسال سفارش {orderNumber}</h2>

              <p className='mt-1 text-sm text-foreground-secondary'>
                اطلاعات ارسال پس از ثبت قابل مشاهده برای مشتری خواهد بود
              </p>
            </div>
          </div>
        </SheetHeader>

        <form className='flex min-h-0 flex-1 flex-col' onSubmit={handleSubmit}>
          <SheetBody className='space-y-5'>
            <FormField
              label='شرکت حمل'
              required
              error={formError && !form.shippingCarrier.trim() ? formError : undefined}
            >
              {({ id, labelId, describedBy, invalid, required }) => (
                <Input
                  id={id}
                  value={form.shippingCarrier}
                  required={required}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  placeholder='مثلاً پست پیشتاز یا تیپاکس'
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      shippingCarrier: event.target.value,
                    }));
                  }}
                />
              )}
            </FormField>

            <FormField
              label='کد رهگیری'
              required
              error={formError && !form.trackingCode.trim() ? formError : undefined}
            >
              {({ id, labelId, describedBy, invalid, required }) => (
                <Input
                  id={id}
                  value={form.trackingCode}
                  required={required}
                  dir='ltr'
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  placeholder='کد رهگیری مرسوله'
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      trackingCode: event.target.value,
                    }));
                  }}
                />
              )}
            </FormField>

            <FormField label='یادداشت ارسال'>
              {({ id, labelId, describedBy }) => (
                <Textarea
                  id={id}
                  value={form.shipmentNote}
                  rows={4}
                  aria-labelledby={labelId}
                  aria-describedby={describedBy}
                  placeholder='توضیحات تکمیلی برای ارسال سفارش'
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      shipmentNote: event.target.value,
                    }));
                  }}
                />
              )}
            </FormField>

            {formError ? <p className='text-sm font-semibold text-danger'>{formError}</p> : null}
          </SheetBody>

          <SheetFooter>
            <Button
              type='button'
              variant='outline'
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button type='submit' isLoading={loading} loadingLabel='در حال ثبت ارسال'>
              ثبت ارسال
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
