import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes, ReactNode } from 'react';

const badgeVariantClasses = {
  neutral: ['border-border bg-surface-muted text-foreground-secondary'].join(' '),

  brand: ['border-brand/20 bg-brand-soft text-brand'].join(' '),

  success: ['border-success/20 bg-success-soft text-success'].join(' '),

  warning: ['border-warning/20 bg-warning-soft text-warning'].join(' '),

  danger: ['border-danger/20 bg-danger-soft text-danger'].join(' '),

  info: ['border-info/20 bg-info-soft text-info'].join(' '),
} as const;

const badgeSizeClasses = {
  sm: 'min-h-5 px-2 text-[11px]',
  md: 'min-h-6 px-2.5 text-xs',
  lg: 'min-h-7 px-3 text-sm',
} as const;

const badgeDotClasses = {
  neutral: 'bg-foreground-muted',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
} as const;

type BadgeVariant = keyof typeof badgeVariantClasses;
type BadgeSize = keyof typeof badgeSizeClasses;

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  startIcon,
  endIcon,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex w-fit items-center justify-center gap-1.5 rounded-full border leading-none font-semibold whitespace-nowrap',
        badgeVariantClasses[variant],
        badgeSizeClasses[size],
        className,
      )}
    >
      {dot ? (
        <span
          aria-hidden='true'
          className={cn('size-1.5 shrink-0 rounded-full', badgeDotClasses[variant])}
        />
      ) : null}

      {startIcon ? (
        <span aria-hidden='true' className='grid shrink-0 place-items-center [&>svg]:size-3.5'>
          {startIcon}
        </span>
      ) : null}

      <span>{children}</span>

      {endIcon ? (
        <span aria-hidden='true' className='grid shrink-0 place-items-center [&>svg]:size-3.5'>
          {endIcon}
        </span>
      ) : null}
    </span>
  );
}
