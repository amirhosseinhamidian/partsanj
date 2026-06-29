'use client';

import { cn } from '@/lib/utils/cn';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from 'react';

const switchSizeClasses = {
  sm: {
    root: 'h-5 w-9',
    thumb: 'size-4 data-[state=checked]:translate-x-4',
  },
  md: {
    root: 'h-6 w-11',
    thumb: 'size-5 data-[state=checked]:translate-x-5',
  },
  lg: {
    root: 'h-7 w-[52px]',
    thumb: 'size-6 data-[state=checked]:translate-x-6',
  },
} as const;

type SwitchSize = keyof typeof switchSizeClasses;

export type SwitchProps = Omit<
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
  'checked' | 'defaultChecked' | 'onCheckedChange'
> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;

  size?: SwitchSize;

  wrapperClassName?: string;
  labelClassName?: string;
  switchClassName?: string;
};

export const Switch = forwardRef<ComponentRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  function Switch(
    {
      id,
      label,
      helperText,
      error,
      checked,
      defaultChecked,
      onCheckedChange,
      size = 'md',
      disabled,
      required,
      className,
      wrapperClassName,
      labelClassName,
      switchClassName,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const switchId = id ?? generatedId;

    const messageId = error || helperText ? `${switchId}-message` : undefined;

    const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        <div className='flex items-start gap-3'>
          <SwitchPrimitive.Root
            {...props}
            ref={ref}
            id={switchId}
            dir='ltr'
            checked={checked}
            defaultChecked={defaultChecked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            required={required}
            aria-invalid={ariaInvalid ?? Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'mt-0.5 inline-flex shrink-0 cursor-pointer items-center rounded-full border p-0.5 outline-none',
              'transition-[background-color,border-color,box-shadow,color]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:border-brand focus:shadow-panel focus:ring-2 focus:ring-focus-ring',
              error
                ? [
                    'border-danger bg-danger-soft',
                    'data-[state=checked]:border-danger data-[state=checked]:bg-danger',
                  ].join(' ')
                : [
                    'border-border bg-surface-muted hover:border-border-strong',
                    'data-[state=checked]:border-brand data-[state=checked]:bg-brand',
                  ].join(' '),
              switchSizeClasses[size].root,
              className,
              switchClassName,
            )}
          >
            <SwitchPrimitive.Thumb
              className={cn(
                'block shrink-0 rounded-full bg-brand-foreground shadow-sm',
                'translate-x-0 will-change-transform',
                'transition-transform duration-200 ease-out',
                switchSizeClasses[size].thumb,
              )}
            />
          </SwitchPrimitive.Root>

          <div className='min-w-0 flex-1 space-y-1'>
            {label ? (
              <label
                htmlFor={switchId}
                className={cn(
                  'block text-sm font-semibold text-foreground',
                  disabled ? 'cursor-not-allowed text-foreground-muted' : 'cursor-pointer',
                  labelClassName,
                )}
              >
                {label}

                {required ? (
                  <span aria-hidden='true' className='ms-1 text-danger'>
                    *
                  </span>
                ) : null}
              </label>
            ) : null}

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
        </div>
      </div>
    );
  },
);

Switch.displayName = 'Switch';
