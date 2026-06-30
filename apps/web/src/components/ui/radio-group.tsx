'use client';

import { cn } from '@/lib/utils/cn';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from 'react';

const radioGroupSizeClasses = {
  sm: {
    item: 'min-h-9 gap-2 px-2.5 py-2 text-xs',
    control: 'size-4',
    indicator: 'size-1.5',
    icon: 'size-7 rounded-[8px] [&>svg]:size-3.5',
  },

  md: {
    item: 'min-h-11 gap-3 px-3 py-2.5 text-sm',
    control: 'size-5',
    indicator: 'size-2',
    icon: 'size-8 rounded-[9px] [&>svg]:size-4',
  },

  lg: {
    item: 'min-h-13 gap-3 px-4 py-3 text-base',
    control: 'size-6',
    indicator: 'size-2.5',
    icon: 'size-10 rounded-control [&>svg]:size-5',
  },
} as const;

const radioVariantClasses = {
  radio: [
    'border border-transparent bg-transparent',
    'hover:bg-surface-muted',
    'data-[state=checked]:bg-brand-soft',
  ].join(' '),

  card: [
    'border border-border bg-surface',
    'hover:border-border-strong hover:bg-surface-elevated',
    'data-[state=checked]:border-brand',
    'data-[state=checked]:bg-brand-soft',
  ].join(' '),
} as const;

type RadioGroupSize = keyof typeof radioGroupSizeClasses;
type RadioGroupVariant = keyof typeof radioVariantClasses;
type RadioGroupOrientation = 'horizontal' | 'vertical';

export type RadioGroupOption = {
  value: string;
  label: ReactNode;

  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;

  disabled?: boolean;
  className?: string;
};

export type RadioGroupProps = Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  'children' | 'value' | 'defaultValue' | 'onValueChange' | 'orientation'
> & {
  options: readonly RadioGroupOption[];

  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;

  orientation?: RadioGroupOrientation;
  variant?: RadioGroupVariant;
  size?: RadioGroupSize;

  wrapperClassName?: string;
  labelClassName?: string;
  optionClassName?: string;
};

export const RadioGroup = forwardRef<
  ComponentRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(function RadioGroup(
  {
    id,
    name,
    options,
    label,
    helperText,
    error,
    value,
    defaultValue,
    onValueChange,
    orientation = 'vertical',
    variant = 'radio',
    size = 'md',
    disabled,
    required,
    className,
    wrapperClassName,
    labelClassName,
    optionClassName,
    'aria-describedby': ariaDescribedBy,
    'aria-labelledby': ariaLabelledBy,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const groupId = id ?? generatedId;

  const labelId = label ? `${groupId}-label` : undefined;

  const messageId = error || helperText ? `${groupId}-message` : undefined;

  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;

  const labelledBy = [ariaLabelledBy, labelId].filter(Boolean).join(' ') || undefined;

  const isVertical = orientation === 'vertical';

  return (
    <div className={cn('w-full space-y-1.5', wrapperClassName)}>
      {label ? (
        <div id={labelId} className={cn('text-sm font-semibold text-foreground', labelClassName)}>
          {label}

          {required ? (
            <span aria-hidden='true' className='ms-1 text-danger'>
              *
            </span>
          ) : null}
        </div>
      ) : null}

      <RadioGroupPrimitive.Root
        {...props}
        ref={ref}
        id={groupId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        orientation={orientation}
        disabled={disabled}
        required={required}
        aria-invalid={ariaInvalid ?? Boolean(error)}
        aria-describedby={describedBy}
        aria-labelledby={labelledBy}
        className={cn(
          'flex',
          isVertical ? 'flex-col gap-2' : 'flex-row flex-wrap gap-2',
          className,
        )}
      >
        {options.map((option) => {
          const optionDisabled = disabled || option.disabled;

          return (
            <RadioGroupPrimitive.Item
              key={option.value}
              value={option.value}
              disabled={optionDisabled}
              className={cn(
                'group inline-flex min-w-0 items-center text-right outline-none',
                'transition-[background-color,border-color,box-shadow,color]',
                'focus-visible:border-brand focus-visible:shadow-panel focus-visible:ring-2 focus-visible:ring-focus-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isVertical ? 'w-full' : 'min-w-40 flex-1',
                radioVariantClasses[variant],
                radioGroupSizeClasses[size].item,
                error
                  ? 'border-danger bg-danger-soft data-[state=checked]:border-danger data-[state=checked]:bg-danger-soft'
                  : '',
                optionClassName,
                option.className,
              )}
            >
              <span
                aria-hidden='true'
                className={cn(
                  'grid shrink-0 place-items-center rounded-full border',
                  'transition-[background-color,border-color,box-shadow,color]',
                  error
                    ? [
                        'border-danger bg-surface',
                        'group-data-[state=checked]:border-danger',
                        'group-data-[state=checked]:bg-danger',
                      ].join(' ')
                    : [
                        'border-border bg-surface',
                        'group-data-[state=checked]:border-brand',
                        'group-data-[state=checked]:bg-brand',
                      ].join(' '),
                  radioGroupSizeClasses[size].control,
                )}
              >
                <RadioGroupPrimitive.Indicator className='grid place-items-center'>
                  <span
                    className={cn(
                      'rounded-full bg-brand-foreground',
                      radioGroupSizeClasses[size].indicator,
                    )}
                  />
                </RadioGroupPrimitive.Indicator>
              </span>

              {option.icon ? (
                <span
                  aria-hidden='true'
                  className={cn(
                    'grid shrink-0 place-items-center bg-surface-muted text-foreground-secondary',
                    'group-data-[state=checked]:bg-surface group-data-[state=checked]:text-brand',
                    radioGroupSizeClasses[size].icon,
                  )}
                >
                  {option.icon}
                </span>
              ) : null}

              <span className='min-w-0 flex-1'>
                <span className='block truncate font-semibold text-foreground'>{option.label}</span>

                {option.description ? (
                  <span className='mt-0.5 block text-xs leading-5 font-normal text-foreground-muted'>
                    {option.description}
                  </span>
                ) : null}
              </span>

              {option.meta ? (
                <span className='shrink-0 text-xs font-medium text-foreground-muted'>
                  {option.meta}
                </span>
              ) : null}
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>

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

RadioGroup.displayName = 'RadioGroup';
