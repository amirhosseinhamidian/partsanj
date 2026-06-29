import { cn } from '@/lib/utils/cn';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

const cardVariantClasses = {
  default: 'border-border bg-surface',
  muted: 'border-border bg-surface-muted',
  elevated: 'border-border bg-surface shadow-panel',
  outline: 'border-border bg-transparent',
} as const;

const cardPaddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
} as const;

export type CardVariant = keyof typeof cardVariantClasses;
export type CardPadding = keyof typeof cardPaddingClasses;

export type CardProps = ComponentPropsWithoutRef<'div'> & {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', padding = 'md', interactive = false, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        'overflow-hidden rounded-card border',
        cardVariantClasses[variant],
        cardPaddingClasses[padding],
        interactive &&
          [
            'transition-[border-color,box-shadow,transform] duration-200',
            'hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel',
            'focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-focus-ring',
          ].join(' '),
        className,
      )}
    />
  );
});

Card.displayName = 'Card';

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cn('flex min-w-0 flex-col gap-1.5', className)} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithoutRef<'h3'>) {
  return <h3 {...props} className={cn('type-card-title text-foreground', className)} />;
}

export function CardDescription({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
  return <p {...props} className={cn('text-sm leading-6 text-foreground-secondary', className)} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cn('min-w-0', className)} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cn('mt-5 flex flex-wrap items-center gap-3', className)} />;
}
