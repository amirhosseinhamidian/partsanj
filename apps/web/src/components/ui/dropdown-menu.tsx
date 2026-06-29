'use client';

import { cn } from '@/lib/utils/cn';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';

type DropdownMenuProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>;

export function DropdownMenu({ dir = 'rtl', modal = true, ...props }: DropdownMenuProps) {
  return <DropdownMenuPrimitive.Root dir={dir} modal={modal} {...props} />;
}

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuGroup = DropdownMenuPrimitive.Group;

export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

type DropdownMenuContentProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuContentProps
>(function DropdownMenuContent(
  { className, sideOffset = 8, align = 'end', collisionPadding = 12, ...props },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={cn(
          'z-50 min-w-52 overflow-hidden rounded-card border border-border bg-surface-elevated p-1.5 text-foreground shadow-floating outline-none',
          'origin-[--radix-dropdown-menu-content-transform-origin]',
          'max-h-[var(--radix-dropdown-menu-content-available-height)]',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

type DropdownMenuLabelProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>;

export const DropdownMenuLabel = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Label>,
  DropdownMenuLabelProps
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn('px-3 py-2 text-xs font-semibold text-foreground-secondary', className)}
      {...props}
    />
  );
});

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
});

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

type DropdownMenuItemVariant = 'default' | 'danger';

type DropdownMenuItemProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  shortcut?: ReactNode;
  inset?: boolean;
  variant?: DropdownMenuItemVariant;
};

const itemVariantClasses = {
  default: [
    'text-foreground',
    'data-[highlighted]:bg-surface-muted',
    'data-[highlighted]:text-foreground',
  ].join(' '),

  danger: [
    'text-danger',
    'data-[highlighted]:bg-danger-soft',
    'data-[highlighted]:text-danger',
  ].join(' '),
} as const;

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem(
  {
    className,
    children,
    startIcon,
    endIcon,
    shortcut,
    inset = false,
    variant = 'default',
    ...props
  },
  ref,
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex min-h-10 cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium outline-none select-none',
        'transition-[background-color,color]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
        inset && 'ps-11',
        itemVariantClasses[variant],
        className,
      )}
      {...props}
    >
      {startIcon ? (
        <span
          aria-hidden='true'
          className='grid size-5 shrink-0 place-items-center text-current [&>svg]:size-4'
        >
          {startIcon}
        </span>
      ) : null}

      <span className='min-w-0 flex-1 truncate'>{children}</span>

      {shortcut ? (
        <span className='ms-auto shrink-0 text-xs text-foreground-muted'>{shortcut}</span>
      ) : null}

      {endIcon ? (
        <span
          aria-hidden='true'
          className='grid size-5 shrink-0 place-items-center text-foreground-muted [&>svg]:size-4'
        >
          {endIcon}
        </span>
      ) : null}
    </DropdownMenuPrimitive.Item>
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';
