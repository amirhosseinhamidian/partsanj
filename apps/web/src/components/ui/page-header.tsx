import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes, ReactNode } from 'react';

const pageHeaderVariantClasses = {
  plain: 'py-1',
  surface: 'rounded-card border border-border bg-surface px-4 py-5 shadow-panel sm:px-6',
} as const;

type PageHeaderVariant = keyof typeof pageHeaderVariantClasses;

export type PageHeaderProps = Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> & {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  leading?: ReactNode;

  variant?: PageHeaderVariant;

  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  leading,
  variant = 'plain',
  titleClassName,
  descriptionClassName,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      {...props}
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        pageHeaderVariantClasses[variant],
        className,
      )}
    >
      <div className='min-w-0 flex-1'>
        {breadcrumbs ? (
          <div className='mb-3 text-xs text-foreground-muted'>{breadcrumbs}</div>
        ) : null}

        <div className='flex min-w-0 items-start gap-3'>
          {leading ? (
            <div
              aria-hidden='true'
              className='grid size-11 shrink-0 place-items-center rounded-control border border-brand/20 bg-brand-soft text-brand [&>svg]:size-5'
            >
              {leading}
            </div>
          ) : null}

          <div className='min-w-0'>
            <h1 className={cn('type-page-title text-foreground', titleClassName)}>{title}</h1>

            {description ? (
              <div
                className={cn(
                  'type-body mt-2 max-w-3xl text-foreground-secondary',
                  descriptionClassName,
                )}
              >
                {description}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {actions ? (
        <div className='flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end'>
          {actions}
        </div>
      ) : null}
    </header>
  );
}
