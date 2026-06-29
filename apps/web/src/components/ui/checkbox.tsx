'use client';

import { cn } from '@/lib/utils/cn';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from 'react';

const checkboxSizeClasses = {
  sm: {
    box: 'size-4',
    icon: 'size-3',
  },
  md: {
    box: 'size-5',
    icon: 'size-3.5',
  },
  lg: {
    box: 'size-6',
    icon: 'size-4',
  },
} as const;

type CheckboxSize = keyof typeof checkboxSizeClasses;

type CheckedState = boolean | 'indeterminate';

export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'checked' | 'defaultChecked' | 'onCheckedChange' | 'children'
> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;

  size?: CheckboxSize;

  wrapperClassName?: string;
  labelClassName?: string;
  checkboxClassName?: string;
};

export const Checkbox = forwardRef<ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  function Checkbox(
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
      checkboxClassName,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    const messageId = error || helperText ? `${checkboxId}-message` : undefined;

    const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        <div className='flex items-start gap-3'>
          <CheckboxPrimitive.Root
            {...props}
            ref={ref}
            id={checkboxId}
            checked={checked}
            defaultChecked={defaultChecked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            required={required}
            aria-invalid={ariaInvalid ?? Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'mt-0.5 inline-flex shrink-0 items-center justify-center rounded-[7px] border outline-none',
              'transition-[background-color,border-color,box-shadow,color]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus:border-brand focus:shadow-panel focus:ring-2 focus:ring-focus-ring',
              error
                ? [
                    'border-danger bg-danger-soft',
                    'data-[state=checked]:border-danger data-[state=checked]:bg-danger data-[state=checked]:text-brand-foreground',
                    'data-[state=indeterminate]:border-danger data-[state=indeterminate]:bg-danger data-[state=indeterminate]:text-brand-foreground',
                  ].join(' ')
                : [
                    'border-border bg-surface text-brand-foreground',
                    'hover:border-border-strong',
                    'data-[state=checked]:border-brand data-[state=checked]:bg-brand',
                    'data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand',
                  ].join(' '),
              checkboxSizeClasses[size].box,
              className,
              checkboxClassName,
            )}
          >
            <CheckboxPrimitive.Indicator className='grid place-items-center'>
              <Check
                aria-hidden='true'
                className={cn(checkboxSizeClasses[size].icon, 'data-[state=indeterminate]:hidden')}
              />

              <Minus
                aria-hidden='true'
                className={cn(
                  'hidden data-[state=indeterminate]:block',
                  checkboxSizeClasses[size].icon,
                )}
              />
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>

          <div className='min-w-0 flex-1 space-y-1'>
            {label ? (
              <label
                htmlFor={checkboxId}
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

Checkbox.displayName = 'Checkbox';
