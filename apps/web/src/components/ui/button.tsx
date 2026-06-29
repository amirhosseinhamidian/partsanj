import { cn } from '@/lib/utils/cn';
import {
  buttonBaseClasses,
  buttonSizeClasses,
  buttonVariantClasses,
  iconGlyphSizeClasses,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/ui/button.styles';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

function ButtonSpinner() {
  return (
    <span
      aria-hidden='true'
      className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent'
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    iconStart,
    iconEnd,
    fullWidth = false,
    isLoading = false,
    loadingLabel = 'در حال پردازش',
    className,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const leadingContent = isLoading ? <ButtonSpinner /> : iconStart;

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? 'true' : undefined}
      className={cn(
        buttonBaseClasses,
        buttonVariantClasses[variant],
        buttonSizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {leadingContent ? (
        <span
          aria-hidden='true'
          className={cn('grid shrink-0 place-items-center', iconGlyphSizeClasses[size])}
        >
          {leadingContent}
        </span>
      ) : null}

      <span className='truncate'>{children}</span>

      {iconEnd ? (
        <span
          aria-hidden='true'
          className={cn('grid shrink-0 place-items-center', iconGlyphSizeClasses[size])}
        >
          {iconEnd}
        </span>
      ) : null}

      {isLoading ? <span className='sr-only'>{loadingLabel}</span> : null}
    </button>
  );
});

Button.displayName = 'Button';
