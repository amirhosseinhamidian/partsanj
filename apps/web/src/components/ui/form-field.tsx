'use client';

import { cn } from '@/lib/utils/cn';
import { useId, type ReactNode } from 'react';

export type FormFieldRenderProps = {
  id: string;
  labelId?: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
};

export type FormFieldProps = {
  id?: string;
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  required?: boolean;

  children: (field: FormFieldRenderProps) => ReactNode;

  className?: string;
  labelClassName?: string;
  messageClassName?: string;
};

function hasContent(value: ReactNode): boolean {
  return value !== null && value !== undefined && value !== false && value !== '';
}

export function FormField({
  id,
  label,
  helperText,
  error,
  required = false,
  children,
  className,
  labelClassName,
  messageClassName,
}: FormFieldProps) {
  const generatedId = useId();

  const controlId = id ?? `field-${generatedId.replace(/:/g, '')}`;

  const hasLabel = hasContent(label);
  const hasError = hasContent(error);
  const hasHelperText = hasContent(helperText);

  const labelId = hasLabel ? `${controlId}-label` : undefined;

  const messageId = hasError || hasHelperText ? `${controlId}-message` : undefined;

  const message = hasError ? error : helperText;

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {hasLabel ? (
        <label
          id={labelId}
          htmlFor={controlId}
          className={cn('type-label block text-foreground', labelClassName)}
        >
          {label}

          {required ? (
            <>
              <span aria-hidden='true' className='ms-1 text-danger'>
                *
              </span>

              <span className='sr-only'> الزامی</span>
            </>
          ) : null}
        </label>
      ) : null}

      {children({
        id: controlId,
        labelId,
        describedBy: messageId,
        invalid: hasError,
        required,
      })}

      {message ? (
        <p
          id={messageId}
          role={hasError ? 'alert' : undefined}
          aria-live={hasError ? 'assertive' : 'polite'}
          className={cn(
            'type-caption',
            hasError ? 'font-medium text-danger' : 'text-foreground-muted',
            messageClassName,
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
