'use client';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import type { AlertVariant } from '@/components/ui/alert';
import { cn } from '@/lib/utils/cn';
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const toastVariantConfig = {
  info: {
    icon: 'text-info',
    Icon: Info,
  },
  success: {
    icon: 'text-success',
    Icon: CheckCircle2,
  },
  warning: {
    icon: 'text-warning',
    Icon: TriangleAlert,
  },
  danger: {
    icon: 'text-danger',
    Icon: CircleAlert,
  },
} as const;

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastProps = {
  variant?: AlertVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ToastAction;
  onDismiss: () => void;
  className?: string;
};

export function Toast({
  variant = 'info',
  title,
  description,
  action,
  onDismiss,
  className,
}: ToastProps) {
  const config = toastVariantConfig[variant];
  const DefaultIcon: LucideIcon = config.Icon;

  function handleActionClick() {
    action?.onClick();
    onDismiss();
  }

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-floating',
        className,
      )}
    >
      <span
        aria-hidden='true'
        className={cn('mt-0.5 grid size-5 shrink-0 place-items-center [&>svg]:size-5', config.icon)}
      >
        <DefaultIcon />
      </span>

      <div className='min-w-0 flex-1'>
        <p className='text-sm font-bold text-foreground'>{title}</p>

        {description ? (
          <p className='mt-1 text-sm leading-6 text-foreground-secondary'>{description}</p>
        ) : null}

        {action ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleActionClick}
            className='mt-3 h-8 px-2 text-xs text-brand hover:bg-brand-soft hover:text-brand'
          >
            {action.label}
          </Button>
        ) : null}
      </div>

      <IconButton
        type='button'
        variant='ghost'
        size='sm'
        aria-label='بستن پیام'
        title='بستن پیام'
        icon={<X />}
        onClick={onDismiss}
        className='-me-1 -mt-1 text-foreground-muted hover:bg-surface-muted hover:text-foreground'
      />
    </div>
  );
}
