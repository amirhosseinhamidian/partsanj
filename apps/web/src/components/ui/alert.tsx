'use client';

import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils/cn';
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const alertVariantConfig = {
  info: {
    container: 'border-info/30 bg-info-soft',
    icon: 'text-info',
    Icon: Info,
  },
  success: {
    container: 'border-success/30 bg-success-soft',
    icon: 'text-success',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'border-warning/30 bg-warning-soft',
    icon: 'text-warning',
    Icon: TriangleAlert,
  },
  danger: {
    container: 'border-danger/30 bg-danger-soft',
    icon: 'text-danger',
    Icon: CircleAlert,
  },
} as const;

export type AlertVariant = keyof typeof alertVariantConfig;

export type AlertProps = {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  onClose?: () => void;
  dismissible?: boolean;
  dismissLabel?: string;

  className?: string;
};

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  open,
  defaultOpen = true,
  onOpenChange,
  onClose,
  dismissible,
  dismissLabel = 'بستن پیام',
  className,
}: AlertProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const canDismiss = dismissible ?? Boolean(onClose || onOpenChange);

  const config = alertVariantConfig[variant];
  const DefaultIcon: LucideIcon = config.Icon;

  function handleClose() {
    if (!isControlled) {
      setInternalOpen(false);
    }

    onOpenChange?.(false);
    onClose?.();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-3 rounded-card border px-4 py-3.5',
        config.container,
        className,
      )}
    >
      <span
        aria-hidden='true'
        className={cn('mt-0.5 grid size-5 shrink-0 place-items-center [&>svg]:size-5', config.icon)}
      >
        {icon ?? <DefaultIcon />}
      </span>

      <div className='min-w-0 flex-1'>
        {title ? <p className='text-sm font-bold text-foreground'>{title}</p> : null}

        {children ? (
          <div className={cn('text-sm leading-6 text-foreground-secondary', title && 'mt-1')}>
            {children}
          </div>
        ) : null}
      </div>

      {canDismiss ? (
        <IconButton
          type='button'
          variant='ghost'
          size='sm'
          aria-label={dismissLabel}
          title={dismissLabel}
          icon={<X />}
          onClick={handleClose}
          className='-me-1 -mt-1 text-foreground-muted hover:bg-surface/70 hover:text-foreground'
        />
      ) : null}
    </div>
  );
}
