'use client';

import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils/cn';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
} from 'react';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export type SheetSide = 'right' | 'left' | 'top' | 'bottom';

const sheetSideClasses: Record<SheetSide, string> = {
  right: [
    'inset-y-0 right-0 h-dvh w-full max-w-md',
    'rounded-l-dialog rounded-r-none border-y-0 border-r-0',
    'data-[state=open]:animate-[sheet-in-right_220ms_cubic-bezier(0.16,1,0.3,1)]',
    'data-[state=closed]:animate-[sheet-out-right_160ms_ease-in]',
  ].join(' '),

  left: [
    'inset-y-0 left-0 h-dvh w-full max-w-md',
    'rounded-r-dialog rounded-l-none border-y-0 border-l-0',
    'data-[state=open]:animate-[sheet-in-left_220ms_cubic-bezier(0.16,1,0.3,1)]',
    'data-[state=closed]:animate-[sheet-out-left_160ms_ease-in]',
  ].join(' '),

  top: [
    'inset-x-0 top-0 w-full max-h-[90dvh]',
    'rounded-b-dialog rounded-t-none border-x-0 border-t-0',
    'data-[state=open]:animate-[sheet-in-top_220ms_cubic-bezier(0.16,1,0.3,1)]',
    'data-[state=closed]:animate-[sheet-out-top_160ms_ease-in]',
  ].join(' '),

  bottom: [
    'inset-x-0 bottom-0 w-full max-h-[90dvh]',
    'rounded-t-dialog rounded-b-none border-x-0 border-b-0',
    'data-[state=open]:animate-[sheet-in-bottom_220ms_cubic-bezier(0.16,1,0.3,1)]',
    'data-[state=closed]:animate-[sheet-out-bottom_160ms_ease-in]',
  ].join(' '),
};

export type SheetContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: SheetSide;
  showCloseButton?: boolean;
};

export const SheetContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(function SheetContent(
  { side = 'right', showCloseButton = true, className, children, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-[70] bg-overlay backdrop-blur-[2px]',
          'data-[state=open]:animate-[dialog-overlay-in_160ms_ease-out]',
          'data-[state=closed]:animate-[dialog-overlay-out_120ms_ease-in]',
        )}
      />

      <DialogPrimitive.Content
        {...props}
        ref={ref}
        className={cn(
          'fixed z-80 flex flex-col overflow-hidden border bg-surface p-5 text-right text-foreground shadow-floating outline-none sm:p-6',
          sheetSideClasses[side],
          className,
        )}
      >
        {children}

        {showCloseButton ? (
          <DialogPrimitive.Close asChild>
            <IconButton
              aria-label='بستن پنجره'
              icon={<X />}
              variant='ghost'
              size='sm'
              className='absolute end-3 top-3'
            />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

SheetContent.displayName = 'SheetContent';

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('space-y-1.5 pe-10', className)} />;
}

export const SheetTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SheetTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      {...props}
      ref={ref}
      className={cn('type-section-title text-foreground', className)}
    />
  );
});

SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function SheetDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      {...props}
      ref={ref}
      className={cn('type-body text-foreground-secondary', className)}
    />
  );
});

SheetDescription.displayName = 'SheetDescription';

export function SheetBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-6 min-h-0 flex-1 overflow-y-auto', className)} />;
}

export function SheetFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end',
        className,
      )}
    />
  );
}
