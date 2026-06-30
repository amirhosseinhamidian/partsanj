'use client';

import { cn } from '@/lib/utils/cn';
import {
  forwardRef,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export type PriceUnit = 'rial' | 'toman';
export type PriceDigits = 'fa' | 'en';

export type PriceInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size' | 'inputMode' | 'name'
> & {
  name?: string;

  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;

  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  unit?: PriceUnit;
  digits?: PriceDigits;
  showConversion?: boolean;
  maxDigits?: number;

  wrapperClassName?: string;
  inputClassName?: string;
  unitClassName?: string;
};

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/\D/g, '');
}

function formatAmount(value: number, digits: PriceDigits, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(digits === 'fa' ? 'fa-IR' : 'en-US', {
    maximumFractionDigits,
  }).format(value);
}

function getUnitLabel(unit: PriceUnit): string {
  return unit === 'rial' ? 'ریال' : 'تومان';
}

function getConvertedUnit(unit: PriceUnit): PriceUnit {
  return unit === 'rial' ? 'toman' : 'rial';
}

function convertPrice(value: number, fromUnit: PriceUnit): number {
  return fromUnit === 'rial' ? value / 10 : value * 10;
}

function assignRef<T>(ref: Ref<T>, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

function restoreCaretPosition(input: HTMLInputElement | null, digitsBeforeCaret: number): void {
  if (!input) {
    return;
  }

  if (digitsBeforeCaret <= 0) {
    input.setSelectionRange(0, 0);
    return;
  }

  const value = input.value;
  let foundDigits = 0;
  let position = value.length;

  for (let index = 0; index < value.length; index += 1) {
    if (/[0-9۰-۹٠-٩]/.test(value[index] ?? '')) {
      foundDigits += 1;

      if (foundDigits >= digitsBeforeCaret) {
        position = index + 1;
        break;
      }
    }
  }

  input.setSelectionRange(position, position);
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(function PriceInput(
  {
    id,
    name,
    value,
    defaultValue = null,
    onValueChange,
    label,
    helperText,
    error,
    unit = 'rial',
    digits = 'fa',
    showConversion = true,
    maxDigits = 15,
    wrapperClassName,
    inputClassName,
    unitClassName,
    className,
    disabled,
    required,
    placeholder,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const internalValueRef = useRef<number | null>(defaultValue);

  const isControlled = value !== undefined;

  const currentValue = isControlled ? (value ?? null) : internalValueRef.current;

  const messageId = error || helperText ? `${inputId}-message` : undefined;

  const conversionId =
    showConversion && currentValue !== null && !error ? `${inputId}-conversion` : undefined;

  const describedBy =
    [ariaDescribedBy, messageId, conversionId].filter(Boolean).join(' ') || undefined;

  const safeMaxDigits = Math.min(Math.max(maxDigits, 1), 15);

  const displayValue = currentValue === null ? '' : formatAmount(currentValue, digits);

  const convertedUnit = getConvertedUnit(unit);

  const convertedValue = currentValue === null ? null : convertPrice(currentValue, unit);

  const conversionText =
    convertedValue === null
      ? null
      : `معادل ${formatAmount(
          convertedValue,
          digits,
          Number.isInteger(convertedValue) ? 0 : 1,
        )} ${getUnitLabel(convertedUnit)}`;

  function emitValue(nextValue: number | null) {
    if (!isControlled) {
      internalValueRef.current = nextValue;
    }

    onValueChange?.(nextValue);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value;

    const cursorPosition = event.target.selectionStart ?? rawValue.length;

    const digitsBeforeCaret = toEnglishDigits(rawValue.slice(0, cursorPosition)).length;

    const normalizedDigits = toEnglishDigits(rawValue).slice(0, safeMaxDigits);

    const nextValue = normalizedDigits.length > 0 ? Number(normalizedDigits) : null;

    emitValue(nextValue);

    requestAnimationFrame(() => {
      restoreCaretPosition(inputRef.current, digitsBeforeCaret);
    });
  }

  return (
    <div className={cn('w-full space-y-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={inputId} className='block text-sm font-semibold text-foreground'>
          {label}

          {required ? (
            <span aria-hidden='true' className='ms-1 text-danger'>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {name ? (
        <input type='hidden' name={name} value={currentValue ?? ''} disabled={disabled} />
      ) : null}

      <div className='relative'>
        <input
          {...props}
          ref={(element) => {
            inputRef.current = element;
            assignRef(ref, element);
          }}
          id={inputId}
          type='text'
          dir='ltr'
          inputMode='numeric'
          value={displayValue}
          disabled={disabled}
          required={required}
          placeholder={placeholder ?? (digits === 'fa' ? '۰' : '0')}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          aria-describedby={describedBy}
          onChange={handleChange}
          className={cn(
            'w-full rounded-control border bg-surface px-3.5 py-3',
            'pl-16 text-right text-sm font-semibold text-foreground outline-none',
            'numeric placeholder:font-normal placeholder:text-foreground-muted',
            'transition-[background-color,border-color,box-shadow,color]',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted',
            'read-only:bg-surface-muted',
            'focus:border-brand focus:shadow-panel focus:ring-2 focus:ring-focus-ring',
            error
              ? 'border-danger bg-danger-soft focus:border-danger focus:ring-danger/20'
              : 'border-border hover:border-border-strong',
            className,
            inputClassName,
          )}
        />

        <span
          aria-hidden='true'
          className={cn(
            'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2',
            'text-xs font-semibold text-foreground-muted',
            unitClassName,
          )}
        >
          {getUnitLabel(unit)}
        </span>
      </div>

      {error || helperText || conversionText ? (
        <div className='flex items-start justify-between gap-4'>
          <div className='min-w-0 flex-1'>
            {error ? (
              <p id={messageId} role='alert' className='text-xs font-medium text-danger'>
                {error}
              </p>
            ) : helperText ? (
              <p id={messageId} className='text-xs text-foreground-muted'>
                {helperText}
              </p>
            ) : null}
          </div>

          {conversionText && !error ? (
            <span
              id={conversionId}
              className='shrink-0 text-xs font-medium text-foreground-secondary'
            >
              {conversionText}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

PriceInput.displayName = 'PriceInput';
