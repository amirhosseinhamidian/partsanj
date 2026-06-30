'use client';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { DayPicker, faIR } from '@daypicker/persian';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { CalendarDays, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type AriaInvalidValue = boolean | 'true' | 'false' | 'grammar' | 'spelling';

export type JalaliDatePickerProps = {
  id?: string;
  name?: string;

  value: Date | null;
  onValueChange: (value: Date | null) => void;

  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;

  withTime?: boolean;
  minuteStep?: number;

  minDate?: Date;
  maxDate?: Date;
  defaultMonth?: Date;

  timeZone?: string;

  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;

  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: AriaInvalidValue;
  'aria-required'?: boolean | 'true' | 'false';
};

function isValidDate(value: Date | null | undefined): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function getStartOfDay(date: Date): Date {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function getTimeInputValue(date: Date | null): string {
  if (!isValidDate(date)) {
    return '';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0',
  )}`;
}

function formatJalaliDate(date: Date, withTime: boolean, timeZone?: string): string {
  const dateText = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(timeZone
      ? {
          timeZone,
        }
      : {}),
  }).format(date);

  if (!withTime) {
    return dateText;
  }

  const timeText = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(timeZone
      ? {
          timeZone,
        }
      : {}),
  }).format(date);

  return `${dateText}، ساعت ${timeText}`;
}

export function JalaliDatePicker({
  id,
  name,
  value,
  onValueChange,
  placeholder = 'انتخاب تاریخ شمسی',
  disabled = false,
  required = false,
  clearable = true,
  withTime = false,
  minuteStep = 5,
  minDate,
  maxDate,
  defaultMonth,
  timeZone,
  className,
  triggerClassName,
  popoverClassName,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
}: JalaliDatePickerProps) {
  const selectedDate = isValidDate(value) ? value : null;

  const [open, setOpen] = useState(false);

  const [month, setMonth] = useState<Date>(() => selectedDate ?? defaultMonth ?? new Date());

  const selectedTimestamp = selectedDate?.getTime();
  const defaultMonthTimestamp = defaultMonth?.getTime();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (selectedDate) {
      setMonth(selectedDate);
      return;
    }

    if (defaultMonth) {
      setMonth(defaultMonth);
      return;
    }

    setMonth(new Date());
  }, [defaultMonth, defaultMonthTimestamp, open, selectedDate, selectedTimestamp]);

  const displayValue = useMemo(() => {
    if (!selectedDate) {
      return placeholder;
    }

    return formatJalaliDate(selectedDate, withTime, timeZone);
  }, [placeholder, selectedDate, selectedTimestamp, timeZone, withTime]);

  const disabledDays = useMemo(() => {
    if (minDate && maxDate) {
      return [
        {
          before: getStartOfDay(minDate),
        },
        {
          after: getStartOfDay(maxDate),
        },
      ];
    }

    if (minDate) {
      return {
        before: getStartOfDay(minDate),
      };
    }

    if (maxDate) {
      return {
        after: getStartOfDay(maxDate),
      };
    }

    return undefined;
  }, [maxDate, minDate]);

  const normalizedMinuteStep = Math.min(Math.max(Math.round(minuteStep), 1), 60);

  function handleDateSelect(nextDate: Date | undefined) {
    if (!nextDate) {
      if (!required) {
        onValueChange(null);
      }

      return;
    }

    const nextValue = new Date(nextDate);

    if (withTime && selectedDate) {
      nextValue.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    } else if (withTime) {
      nextValue.setHours(0, 0, 0, 0);
    } else {
      // برای Date-only، ساعت ظهر از جابه‌جایی روز در تبدیل UTC جلوگیری می‌کند
      nextValue.setHours(12, 0, 0, 0);
    }

    onValueChange(nextValue);

    if (!withTime) {
      setOpen(false);
    }
  }

  function handleTimeChange(value: string) {
    const [hours, minutes] = value.split(':').map(Number);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
      return;
    }

    const nextValue = selectedDate ? new Date(selectedDate) : new Date();

    nextValue.setHours(hours, minutes, 0, 0);

    onValueChange(nextValue);
  }

  function handleToday() {
    const now = new Date();

    now.setSeconds(0, 0);

    onValueChange(now);
    setMonth(now);

    if (!withTime) {
      setOpen(false);
    }
  }

  function handleClear() {
    onValueChange(null);
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!disabled) {
          setOpen(nextOpen);
        }
      }}
    >
      <div className={cn('w-full', className)}>
        {name ? (
          <input type='hidden' name={name} value={selectedDate?.toISOString() ?? ''} />
        ) : null}

        <div
          className={cn(
            'flex min-h-11 items-center rounded-control border bg-surface transition-colors',
            'focus-within:ring-2 focus-within:ring-focus-ring',
            ariaInvalid ? 'border-danger' : 'border-border hover:border-border-strong',
            disabled && 'cursor-not-allowed opacity-60',
            triggerClassName,
          )}
        >
          <PopoverPrimitive.Trigger asChild>
            <button
              id={id}
              type='button'
              disabled={disabled}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={ariaDescribedBy}
              aria-invalid={ariaInvalid}
              aria-required={(ariaRequired ?? required) || undefined}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 px-3 text-start outline-none',
                disabled && 'cursor-not-allowed',
              )}
            >
              <CalendarDays className='size-4 shrink-0 text-foreground-muted' />

              <span
                className={cn(
                  'min-w-0 truncate text-sm',
                  selectedDate ? 'font-medium text-foreground' : 'text-foreground-muted',
                )}
              >
                {displayValue}
              </span>
            </button>
          </PopoverPrimitive.Trigger>

          {clearable && selectedDate && !disabled ? (
            <IconButton
              type='button'
              aria-label='پاک کردن تاریخ'
              icon={<X />}
              size='sm'
              variant='ghost'
              className='me-1 shrink-0'
              onClick={handleClear}
            />
          ) : null}
        </div>
      </div>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side='bottom'
          align='start'
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            'z-[90] w-[min(22rem,calc(100vw-2rem))] rounded-card border border-border bg-surface p-4 text-right shadow-floating outline-none',
            popoverClassName,
          )}
        >
          <DayPicker
            mode='single'
            dir='rtl'
            locale={faIR}
            timeZone={timeZone}
            month={month}
            onMonthChange={setMonth}
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
            required={required}
            disabled={disabledDays}
            showOutsideDays
            fixedWeeks
            classNames={{
              root: 'relative w-full',
              months: 'w-full',
              month: 'w-full',
              month_caption: 'relative flex h-10 items-center justify-center',
              caption_label: 'text-sm font-bold text-foreground',
              nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
              button_previous:
                'grid size-8 place-items-center rounded-control text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
              button_next:
                'grid size-8 place-items-center rounded-control text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
              month_grid: 'mt-2 w-full border-collapse',
              weekdays: 'border-b border-border',
              weekday: 'h-9 text-center align-middle text-xs font-medium text-foreground-muted',
              weeks: '',
              week: 'h-10',
              day: 'p-0 text-center align-middle',
              day_button:
                'inline-grid size-9 place-items-center rounded-full text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
              selected:
                'bg-brand text-brand-foreground [&_.rdp-day_button]:bg-brand [&_.rdp-day_button]:text-brand-foreground [&_.rdp-day_button]:shadow-sm',
              today:
                'font-extrabold text-brand [&_.rdp-day_button]:ring-1 [&_.rdp-day_button]:ring-brand',
              outside: 'opacity-35',
              disabled: 'pointer-events-none opacity-40',
              hidden: 'hidden',
            }}
          />

          {withTime ? (
            <div className='mt-4 border-t border-border pt-4'>
              <label
                htmlFor={`${id ?? 'jalali-date-picker'}-time`}
                className='mb-2 block text-sm font-semibold text-foreground'
              >
                ساعت
              </label>

              <Input
                id={`${id ?? 'jalali-date-picker'}-time`}
                dir='ltr'
                type='time'
                step={normalizedMinuteStep * 60}
                value={getTimeInputValue(selectedDate)}
                onChange={(event) => handleTimeChange(event.target.value)}
              />
            </div>
          ) : null}

          <div className='mt-4 flex items-center justify-between border-t border-border pt-4'>
            <Button type='button' variant='ghost' size='sm' onClick={handleToday}>
              امروز
            </Button>

            {withTime ? (
              <Button type='button' size='sm' onClick={() => setOpen(false)}>
                تأیید تاریخ
              </Button>
            ) : null}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
