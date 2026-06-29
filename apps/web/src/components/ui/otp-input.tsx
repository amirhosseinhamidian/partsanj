'use client';

import { cn } from '@/lib/utils/cn';
import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

const otpSizeClasses = {
  sm: {
    wrapper: 'gap-2',
    slot: 'size-10 text-lg',
  },
  md: {
    wrapper: 'gap-3',
    slot: 'size-12 text-2xl',
  },
  lg: {
    wrapper: 'gap-3',
    slot: 'size-14 text-3xl',
  },
} as const;

type OtpInputSize = keyof typeof otpSizeClasses;

export type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;

  length?: 4;
  size?: OtpInputSize;

  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;

  className?: string;
  slotClassName?: string;

  onComplete?: (value: string) => void;
};

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/\D/g, '');
}

function toPersianDigits(value: string): string {
  return value.replace(/\d/g, (digit) => {
    return PERSIAN_DIGITS[Number(digit)];
  });
}

export function OtpInput({
  value,
  onChange,
  length = 4,
  size = 'md',
  disabled = false,
  error = false,
  autoFocus = false,
  className,
  slotClassName,
  onComplete,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedValue = toEnglishDigits(value).slice(0, length);

  const digits = Array.from({ length }, (_, index) => normalizedValue[index] ?? '');

  function focusSlot(index: number) {
    requestAnimationFrame(() => {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    });
  }

  function emitValue(nextValue: string) {
    const normalized = toEnglishDigits(nextValue).slice(0, length);

    onChange(normalized);

    if (normalized.length === length) {
      onComplete?.(normalized);
    }
  }

  function handleChange(index: number, rawValue: string) {
    const enteredDigits = toEnglishDigits(rawValue);

    if (!enteredDigits) {
      const nextDigits = [...digits];
      nextDigits[index] = '';

      emitValue(nextDigits.join(''));
      return;
    }

    const nextDigits = [...digits];

    enteredDigits
      .slice(0, length - index)
      .split('')
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });

    const nextValue = nextDigits.join('').slice(0, length);

    emitValue(nextValue);

    const nextIndex = Math.min(index + enteredDigits.length, length - 1);

    focusSlot(nextIndex);
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const pastedDigits = toEnglishDigits(event.clipboardData.getData('text')).slice(
      0,
      length - index,
    );

    if (!pastedDigits) {
      return;
    }

    const nextDigits = [...digits];

    pastedDigits.split('').forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });

    emitValue(nextDigits.join('').slice(0, length));

    focusSlot(Math.min(index + pastedDigits.length, length - 1));
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      focusSlot(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusSlot(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusSlot(index + 1);
    }
  }

  return (
    <div
      dir='ltr'
      role='group'
      aria-label='کد تأیید'
      className={cn('flex items-center justify-center', otpSizeClasses[size].wrapper, className)}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type='text'
          inputMode='numeric'
          pattern='[0-9۰-۹٠-٩]*'
          maxLength={length}
          autoFocus={autoFocus && index === 0}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          disabled={disabled}
          value={toPersianDigits(digit)}
          onChange={(event) => handleChange(index, event.target.value)}
          onPaste={(event) => handlePaste(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          aria-label={`رقم ${index + 1} از ${length}`}
          aria-invalid={error || undefined}
          className={cn(
            'rounded-control border bg-surface text-center font-bold text-foreground outline-none',
            'transition-[background-color,border-color,box-shadow,color]',
            'placeholder:text-foreground-muted',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted',
            'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus-ring',
            error
              ? 'border-danger bg-danger-soft focus-visible:border-danger focus-visible:ring-danger/20'
              : 'border-border hover:border-border-strong',
            otpSizeClasses[size].slot,
            slotClassName,
          )}
        />
      ))}
    </div>
  );
}
