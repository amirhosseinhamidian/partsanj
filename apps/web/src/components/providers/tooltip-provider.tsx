'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { PropsWithChildren } from 'react';

export function TooltipProvider({ children }: PropsWithChildren) {
  return (
    <TooltipPrimitive.Provider delayDuration={350} skipDelayDuration={150}>
      {children}
    </TooltipPrimitive.Provider>
  );
}
