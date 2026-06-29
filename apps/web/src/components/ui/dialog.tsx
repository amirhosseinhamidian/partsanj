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

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type DialogContentProps = ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
};

export const DialogContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, showCloseButton = true, ...props }, ref) {
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
          'fixed top-1/2 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-lg',
          'max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto',
          'rounded-dialog border border-border bg-surface p-5 text-right text-foreground shadow-floating sm:p-6',
          'outline-none',
          'data-[state=open]:animate-[dialog-content-in_180ms_ease-out]',
          'data-[state=closed]:animate-[dialog-content-out_140ms_ease-in]',
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

DialogContent.displayName = 'DialogContent';

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('space-y-1.5 pe-10', className)} />;
}

export const DialogTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      {...props}
      ref={ref}
      className={cn('type-section-title text-foreground', className)}
    />
  );
});

DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      {...props}
      ref={ref}
      className={cn('type-body text-foreground-secondary', className)}
    />
  );
});

DialogDescription.displayName = 'DialogDescription';

export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-6', className)} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
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
