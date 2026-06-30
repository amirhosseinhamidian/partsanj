'use client';

import { cn } from '@/lib/utils/cn';
import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

const resizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  both: 'resize',
} as const;

type TextareaResize = keyof typeof resizeClasses;

function getTextValue(
  value: TextareaHTMLAttributes<HTMLTextAreaElement>['value'] | undefined,
): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join('');
  }

  return String(value);
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;
  resize?: TextareaResize;
  showCharacterCount?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    label,
    helperText,
    error,
    resize = 'vertical',
    showCharacterCount,
    className,
    disabled,
    required,
    rows = 4,
    maxLength,
    value,
    defaultValue,
    onChange,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  const [currentLength, setCurrentLength] = useState(
    () => getTextValue(value ?? defaultValue).length,
  );

  useEffect(() => {
    if (value !== undefined) {
      setCurrentLength(getTextValue(value).length);
    }
  }, [value]);

  const hasMessage = Boolean(error || helperText);

  const showCount = showCharacterCount ?? (typeof maxLength === 'number' && maxLength >= 0);

  const messageId = hasMessage ? `${textareaId}-message` : undefined;
  const countId = showCount ? `${textareaId}-count` : undefined;

  const describedBy = [ariaDescribedBy, messageId, countId].filter(Boolean).join(' ') || undefined;

  return (
    <div className='w-full space-y-1.5'>
      {label ? (
        <label htmlFor={textareaId} className='block text-sm font-semibold text-foreground'>
          {label}

          {required ? (
            <span aria-hidden='true' className='ms-1 text-danger'>
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <textarea
        {...props}
        ref={ref}
        id={textareaId}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        aria-invalid={ariaInvalid ?? Boolean(error)}
        aria-describedby={describedBy}
        onChange={(event) => {
          setCurrentLength(event.target.value.length);
          onChange?.(event);
        }}
        className={cn(
          'w-full rounded-control border bg-surface px-3.5 py-3 text-sm leading-7 text-foreground outline-none',
          'placeholder:text-foreground-muted',
          'transition-[background-color,border-color,box-shadow,color]',
          'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-foreground-muted',
          'read-only:bg-surface-muted',
          'focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-focus-ring',
          error
            ? 'border-danger bg-danger-soft focus-visible:border-danger focus-visible:ring-danger/20'
            : 'border-border hover:border-border-strong',
          resizeClasses[resize],
          className,
        )}
      />

      {hasMessage || showCount ? (
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

          {showCount && typeof maxLength === 'number' ? (
            <span id={countId} className='shrink-0 text-xs text-foreground-muted'>
              {currentLength.toLocaleString('fa-IR')} / {maxLength.toLocaleString('fa-IR')}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';
