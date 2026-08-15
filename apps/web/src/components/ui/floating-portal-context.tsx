'use client';

import { createContext, useContext, type ReactNode } from 'react';

const FloatingPortalContainerContext = createContext<HTMLElement | null>(null);

type FloatingPortalContainerProviderProps = {
  container: HTMLElement | null;
  children: ReactNode;
};

export function FloatingPortalContainerProvider({
  container,
  children,
}: FloatingPortalContainerProviderProps) {
  return (
    <FloatingPortalContainerContext.Provider value={container}>
      {children}
    </FloatingPortalContainerContext.Provider>
  );
}

export function useFloatingPortalContainer() {
  return useContext(FloatingPortalContainerContext);
}
