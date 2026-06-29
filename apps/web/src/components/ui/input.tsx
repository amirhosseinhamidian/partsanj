'use client';

import { cn } from '@/lib/utils/cn';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

const inputSizeClasses = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-3.5 text-sm',
  lg: 'h-12 px-4 text-sm',
} as const;

type InputSize = keyof typeof inputSizeClasses;

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  size?: InputSize;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    size = 'md',
    className,
    startIcon,
    endIcon,
    invalid = false,
    disabled,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const hasError =
    invalid ||
    ariaInvalid === true ||
    ariaInvalid === 'true' ||
    ariaInvalid === 'grammar' ||
    ariaInvalid === 'spelling';

  return (
    <div className='w-full'>
      <div className='relative flex items-center'>
        {startIcon ? (
          <span
            aria-hidden='true'
            className='pointer-events-none absolute inset-s-3 grid size-5 place-items-center text-foreground-muted [&>svg]:size-5'
          >
            {startIcon}
          </span>
        ) : null}

        <input
          {...props}
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={ariaInvalid ?? (hasError || undefined)}
          className={cn(
            'w-full rounded-control border bg-surface text-foreground outline-none',
            'placeholder:text-foreground-muted',
            'transition-[background-color,border-color,box-shadow,color]',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted',
            'read-only:bg-surface-muted',
            'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus-ring',
            hasError
              ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
              : 'border-border hover:border-border-strong',
            inputSizeClasses[size],
            startIcon && 'ps-10',
            endIcon && 'pe-10',
            className,
          )}
        />

        {endIcon ? (
          <span
            aria-hidden='true'
            className='pointer-events-none absolute inset-e-3 grid size-5 place-items-center text-foreground-muted [&>svg]:size-5'
          >
            {endIcon}
          </span>
        ) : null}
      </div>
    </div>
  );
});

Input.displayName = 'Input';
