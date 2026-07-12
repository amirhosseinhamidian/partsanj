import { cn } from '@/lib/utils/cn';
import { Plus } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

const pageHeaderVariantClasses = {
  plain: 'py-1',
  surface: 'rounded-card border border-border bg-surface px-4 py-5 shadow-panel sm:px-6',
} as const;

type PageHeaderVariant = keyof typeof pageHeaderVariantClasses;

export type PageHeaderProps = Omit<HTMLAttributes<HTMLElement>, 'title' | 'children'> & {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: ReactNode;

  /**
   * Custom actions beside add button
   */
  actions?: ReactNode;

  /**
   * Header icon
   */
  icon?: ReactNode;

  /**
   * Add button
   */
  addButtonLabel?: string;
  onAddClick?: () => void;

  variant?: PageHeaderVariant;

  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  icon,
  addButtonLabel,
  onAddClick,
  variant = 'plain',
  titleClassName,
  descriptionClassName,
  className,
  ...props
}: PageHeaderProps) {
  const showAddButton = addButtonLabel && onAddClick;

  return (
    <header
      {...props}
      className={cn(
        'flex flex-wrap items-start justify-between gap-4',
        pageHeaderVariantClasses[variant],
        className,
      )}
    >
      <div className='flex min-w-0 items-start gap-3'>
        {icon ? (
          <span
            aria-hidden='true'
            className='grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand lg:size-16'
          >
            {icon}
          </span>
        ) : null}

        <div className='min-w-0'>
          {breadcrumbs ? (
            <div className='mb-2 text-xs text-foreground-muted'>{breadcrumbs}</div>
          ) : null}

          <h1 className={cn('text-xl font-extrabold text-foreground lg:text-3xl', titleClassName)}>
            {title}
          </h1>

          {description ? (
            <p className={cn('mt-1 text-sm text-foreground-secondary', descriptionClassName)}>
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className='flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end'>
        {actions}

        {showAddButton ? (
          <Button type='button' iconStart={<Plus className='size-4' />} onClick={onAddClick}>
            {addButtonLabel}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
