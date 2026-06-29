'use client';

import { cn } from '@/lib/utils/cn';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { forwardRef, useId, type ReactNode } from 'react';

const selectSizeClasses = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-3.5 text-sm',
  lg: 'h-12 px-4 text-sm',
} as const;

type SelectSize = keyof typeof selectSizeClasses;

export type SelectOption = {
  value: string;
  label: string;

  description?: string;
  meta?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;

  className?: string;
};

export type SelectProps = {
  id?: string;
  name?: string;

  value?: string;
  defaultValue?: string;

  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;

  options: readonly SelectOption[];

  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  placeholder?: string;
  startIcon?: ReactNode;

  size?: SelectSize;
  disabled?: boolean;
  required?: boolean;

  className?: string;
  wrapperClassName?: string;
  contentClassName?: string;
  optionClassName?: string;

  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    id,
    name,
    value,
    defaultValue,
    onValueChange,
    onOpenChange,
    options,
    label,
    helperText,
    error,
    placeholder = 'انتخاب کنید',
    startIcon,
    size = 'md',
    disabled = false,
    required = false,
    className,
    wrapperClassName,
    contentClassName,
    optionClassName,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const messageId = error || helperText ? `${selectId}-message` : undefined;

  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;

  return (
    <div dir='rtl' className={cn('w-full space-y-1.5', wrapperClassName)}>
      {label ? (
        <label htmlFor={selectId} className='block text-sm font-semibold text-foreground'>
          {label}

          {required ? (
            <span aria-hidden='true' className='ms-1 text-danger'>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <SelectPrimitive.Root
        dir='rtl'
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
        disabled={disabled}
        required={required}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          id={selectId}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'group flex w-full items-center gap-3 rounded-control border bg-surface text-right text-foreground outline-none',
            'transition-[background-color,border-color,box-shadow,color]',
            'data-placeholder:text-foreground-muted',
            'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted',
            'focus:border-brand focus:shadow-panel focus:ring-2 focus:ring-focus-ring',
            'data-[state=open]:border-brand data-[state=open]:shadow-panel data-[state=open]:ring-2 data-[state=open]:ring-focus-ring',
            error
              ? 'border-danger bg-danger-soft focus-visible:border-danger focus-visible:ring-danger/20'
              : 'border-border hover:border-border-strong',
            selectSizeClasses[size],
            className,
          )}
        >
          {startIcon ? (
            <span
              aria-hidden='true'
              className='grid size-5 shrink-0 place-items-center text-foreground-muted [&>svg]:size-5'
            >
              {startIcon}
            </span>
          ) : null}

          <SelectPrimitive.Value placeholder={placeholder} />

          <SelectPrimitive.Icon asChild>
            <ChevronDown className='ms-auto size-4 shrink-0 text-foreground-muted transition-transform duration-200 group-data-[state=open]:rotate-180' />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position='popper'
            side='bottom'
            align='start'
            sideOffset={8}
            collisionPadding={12}
            className={cn(
              'z-90 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-card border border-border bg-surface-elevated p-1 shadow-floating',
              contentClassName,
            )}
          >
            <SelectPrimitive.Viewport className='max-h-72 overflow-y-auto p-1'>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  textValue={option.label}
                  className={cn(
                    'relative flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 pe-10 text-right text-sm text-foreground outline-none select-none',
                    'transition-colors',
                    'data-highlighted:bg-surface-muted',
                    'data-[state=checked]:bg-brand-soft data-[state=checked]:text-brand',
                    'data-disabled:pointer-events-none data-disabled:opacity-45',
                    optionClassName,
                    option.className,
                  )}
                >
                  {option.icon ? (
                    <span
                      aria-hidden='true'
                      className='grid size-8 shrink-0 place-items-center rounded-[9px] bg-surface-muted text-foreground-secondary [&>svg]:size-4'
                    >
                      {option.icon}
                    </span>
                  ) : null}

                  <div className='min-w-0 flex-1'>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>

                    {option.description ? (
                      <p className='mt-0.5 truncate text-xs text-foreground-muted'>
                        {option.description}
                      </p>
                    ) : null}
                  </div>

                  {option.meta ? (
                    <span className='shrink-0 text-xs text-foreground-muted'>{option.meta}</span>
                  ) : null}

                  <SelectPrimitive.ItemIndicator className='absolute inset-e-3 grid size-5 place-items-center text-brand'>
                    <Check className='size-4' />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

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
  );
});

Select.displayName = 'Select';
