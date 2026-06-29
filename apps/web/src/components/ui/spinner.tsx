import { cn } from '@/lib/utils/cn';
import type { ComponentPropsWithoutRef } from 'react';

const spinnerSizeClasses = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-7',
  xl: 'size-9',
} as const;

const spinnerToneClasses = {
  brand: 'text-brand',
  muted: 'text-foreground-muted',
  foreground: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  current: 'text-current',
} as const;

export type SpinnerSize = keyof typeof spinnerSizeClasses;
export type SpinnerTone = keyof typeof spinnerToneClasses;

export type SpinnerProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  size?: SpinnerSize;
  tone?: SpinnerTone;
  label?: string;
  showLabel?: boolean;
  labelClassName?: string;
};

export function Spinner({
  size = 'md',
  tone = 'brand',
  label = 'در حال بارگذاری',
  showLabel = false,
  labelClassName,
  className,
  role,
  'aria-live': ariaLive,
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      role={role ?? 'status'}
      aria-live={ariaLive ?? 'polite'}
      className={cn('inline-flex items-center gap-2', className)}
    >
      <svg
        aria-hidden='true'
        viewBox='0 0 24 24'
        fill='none'
        className={cn('animate-spin', spinnerSizeClasses[size], spinnerToneClasses[tone])}
      >
        <circle cx='12' cy='12' r='9' stroke='currentColor' strokeWidth='3' opacity='0.22' />

        <path d='M12 3a9 9 0 0 1 9 9' stroke='currentColor' strokeWidth='3' strokeLinecap='round' />
      </svg>

      {showLabel ? (
        <span className={cn('text-sm text-foreground-secondary', labelClassName)}>{label}</span>
      ) : (
        <span className='sr-only'>{label}</span>
      )}
    </span>
  );
}
