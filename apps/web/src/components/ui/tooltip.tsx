'use client';

import { cn } from '@/lib/utils/cn';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactElement, ReactNode } from 'react';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
type TooltipAlign = 'start' | 'center' | 'end';

export type TooltipProps = {
  children: ReactElement;
  content: ReactNode;

  side?: TooltipSide;
  align?: TooltipAlign;
  sideOffset?: number;

  disabled?: boolean;
  showArrow?: boolean;

  className?: string;
  contentClassName?: string;
};

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  disabled = false,
  showArrow = true,
  className,
  contentClassName,
}: TooltipProps) {
  if (disabled || !content) {
    return children;
  }

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
          className={cn(
            'z-[100] max-w-64 rounded-[10px] border border-border bg-surface-inverse px-3 py-2',
            'text-xs leading-5 font-medium text-foreground-inverse shadow-floating',
            'select-none',
            'data-[state=delayed-open]:animate-[tooltip-in_140ms_ease-out]',
            'data-[side=bottom]:origin-top data-[side=top]:origin-bottom',
            'data-[side=left]:origin-right data-[side=right]:origin-left',
            className,
            contentClassName,
          )}
        >
          {content}

          {showArrow ? (
            <TooltipPrimitive.Arrow width={12} height={7} className='fill-surface-inverse' />
          ) : null}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
