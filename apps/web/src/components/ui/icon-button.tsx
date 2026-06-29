import { cn } from '@/lib/utils/cn';
import {
  buttonBaseClasses,
  buttonVariantClasses,
  iconButtonSizeClasses,
  iconGlyphSizeClasses,
  type ButtonVariant,
  type IconButtonSize,
} from '@/components/ui/button.styles';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'aria-label'
> {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  'aria-label': string;
}

function IconButtonSpinner() {
  return (
    <span
      aria-hidden='true'
      className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent'
    />
  );
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    icon,
    variant = 'outline',
    size = 'md',
    isLoading = false,
    className,
    disabled,
    type = 'button',
    title,
    'aria-label': ariaLabel,
    ...props
  },
  ref,
) {
  const visibleIcon = isLoading ? <IconButtonSpinner /> : icon;

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      title={title}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      data-loading={isLoading ? 'true' : undefined}
      disabled={disabled || isLoading}
      className={cn(
        buttonBaseClasses,
        buttonVariantClasses[variant],
        iconButtonSizeClasses[size],
        'shrink-0 p-0',
        className,
      )}
    >
      <span
        aria-hidden='true'
        className={cn('grid place-items-center', iconGlyphSizeClasses[size])}
      >
        {visibleIcon}
      </span>

      {isLoading ? <span className='sr-only'>در حال پردازش</span> : null}
    </button>
  );
});

IconButton.displayName = 'IconButton';
