import { Badge } from '@/components/ui/badge';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import { RotateCcw } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

const filterFieldWidthClasses = {
  sm: 'w-full sm:w-40',
  md: 'w-full sm:w-52',
  lg: 'w-full sm:w-64',
  xl: 'w-full sm:w-80',
  auto: 'w-full sm:w-auto',
  full: 'w-full',
} as const;

type FilterFieldWidth = keyof typeof filterFieldWidthClasses;

type FilterBarLayout = 'inline' | 'stacked';

export type FilterBarProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;

  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;

  layout?: FilterBarLayout;
};

export function FilterBar({
  children,
  className,
  title,
  description,
  icon,
  layout = 'inline',
  ...props
}: FilterBarProps) {
  const hasHeader = Boolean(title || description || icon);

  return (
    <section
      {...props}
      aria-label={props['aria-label'] ?? 'فیلترها'}
      className={cn('rounded-card border border-border bg-surface p-4 shadow sm:p-5', className)}
    >
      {hasHeader ? (
        <header className='mb-5 flex items-center gap-2'>
          {icon ? (
            <span className='grid size-5 shrink-0 place-items-center text-brand [&>svg]:size-4'>
              {icon}
            </span>
          ) : null}

          <div className='min-w-0'>
            {title ? <h2 className='font-extrabold text-foreground'>{title}</h2> : null}

            {description ? (
              <p className='mt-1 text-sm text-foreground-secondary'>{description}</p>
            ) : null}
          </div>
        </header>
      ) : null}

      <div
        className={
          layout === 'stacked' ? 'space-y-5' : 'flex flex-col gap-3 xl:flex-row xl:items-end'
        }
      >
        {children}
      </div>
    </section>
  );
}

export type FilterBarContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FilterBarContent({ children, className, ...props }: FilterBarContentProps) {
  return (
    <div {...props} className={cn('grid gap-4 lg:grid-cols-12', className)}>
      {children}
    </div>
  );
}

export type FilterBarSearchProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FilterBarSearch({ children, className, ...props }: FilterBarSearchProps) {
  return (
    <div {...props} className={cn('w-full shrink-0 xl:w-88', className)}>
      {children}
    </div>
  );
}

export type FilterBarFiltersProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FilterBarFilters({ children, className, ...props }: FilterBarFiltersProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end',
        className,
      )}
    >
      {children}
    </div>
  );
}

export type FilterBarFieldProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  width?: FilterFieldWidth;
};

export function FilterBarField({
  children,
  width = 'md',
  className,
  ...props
}: FilterBarFieldProps) {
  return (
    <div {...props} className={cn('min-w-0', filterFieldWidthClasses[width], className)}>
      {children}
    </div>
  );
}

export type FilterBarActionsProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  position?: 'inline' | 'footer';
};

export function FilterBarActions({
  children,
  className,
  position = 'inline',
  ...props
}: FilterBarActionsProps) {
  return (
    <div
      {...props}
      className={cn(
        position === 'footer'
          ? 'flex w-full flex-wrap items-center justify-end gap-3 border-t border-border pt-4'
          : 'flex w-full shrink-0 flex-wrap items-center gap-2 xl:w-auto xl:justify-end',
        className,
      )}
    >
      {children}
    </div>
  );
}

export type FilterBarClearButtonProps = Omit<
  ButtonProps,
  'children' | 'type' | 'variant' | 'size' | 'iconStart'
> & {
  activeFilterCount?: number;
  label?: ReactNode;
  showWhenEmpty?: boolean;
};

export function FilterBarClearButton({
  activeFilterCount = 0,
  label = 'پاک‌سازی فیلترها',
  showWhenEmpty = false,
  className,
  ...props
}: FilterBarClearButtonProps) {
  if (!showWhenEmpty && activeFilterCount <= 0) {
    return null;
  }

  return (
    <Button
      {...props}
      type='button'
      variant='outline'
      size='sm'
      iconStart={<RotateCcw className='size-4' />}
      className={cn('shrink-0', className)}
    >
      <span>{label}</span>

      {activeFilterCount > 0 ? (
        <Badge variant='brand' size='sm' className='ms-1 min-h-5 px-1.5'>
          {toPersianDigits(activeFilterCount)}
        </Badge>
      ) : null}
    </Button>
  );
}
