'use client';

import { Toast, type ToastAction } from '@/components/ui/toast';
import type { AlertVariant } from '@/components/ui/alert';
import { cn } from '@/lib/utils/cn';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

const TOAST_EXIT_DURATION = 190;

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

type ToastInput = {
  variant?: AlertVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ToastAction;
  duration?: number;
  position?: ToastPosition;
};

type ToastItem = ToastInput & {
  id: string;
  duration: number;
  position: ToastPosition;
  isExiting: boolean;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

type ToastProviderProps = PropsWithChildren<{
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  maxVisible?: number;
}>;

const ToastContext = createContext<ToastContextValue | null>(null);

const positions: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const viewportClasses: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start sm:top-6 sm:left-6',

  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center sm:top-6',

  'top-right': 'top-4 right-4 items-end sm:top-6 sm:right-6',

  'bottom-left': 'bottom-4 left-4 items-start sm:bottom-6 sm:left-6',

  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center sm:bottom-6',

  'bottom-right': 'bottom-4 right-4 items-end sm:bottom-6 sm:right-6',
};

function createToastId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ManagedToast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (item.duration <= 0 || item.isExiting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onDismiss(item.id);
    }, item.duration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [item.duration, item.id, item.isExiting, onDismiss]);

  return (
    <div
      data-position={item.position}
      className={cn('toast-motion w-full', item.isExiting ? 'toast-exit' : 'toast-enter')}
    >
      <Toast
        variant={item.variant}
        title={item.title}
        description={item.description}
        action={item.action}
        onDismiss={() => onDismiss(item.id)}
      />
    </div>
  );
}

export function ToastProvider({
  children,
  defaultDuration = 5000,
  defaultPosition = 'bottom-left',
  maxVisible = 4,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const exitTimeouts = useRef<Map<string, ReturnType<typeof window.setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      exitTimeouts.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });

      exitTimeouts.current.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.map((toast) =>
        toast.id === id && !toast.isExiting
          ? {
              ...toast,
              isExiting: true,
            }
          : toast,
      ),
    );

    if (exitTimeouts.current.has(id)) {
      return;
    }

    const exitDuration = prefersReducedMotion() ? 1 : TOAST_EXIT_DURATION;

    const timeoutId = window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));

      exitTimeouts.current.delete(id);
    }, exitDuration);

    exitTimeouts.current.set(id, timeoutId);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts((currentToasts) => {
      currentToasts.forEach((toast) => {
        if (!toast.isExiting) {
          window.setTimeout(() => {
            setToasts((items) => items.filter((item) => item.id !== toast.id));
          }, TOAST_EXIT_DURATION);
        }
      });

      return currentToasts.map((toast) => ({
        ...toast,
        isExiting: true,
      }));
    });
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = createToastId();

      const nextToast: ToastItem = {
        ...input,
        id,
        duration: input.duration ?? defaultDuration,
        position: input.position ?? defaultPosition,
        isExiting: false,
      };

      setToasts((currentToasts) => {
        const visibleLimit = Math.max(1, maxVisible);

        return [...currentToasts, nextToast].slice(-visibleLimit);
      });

      return id;
    },
    [defaultDuration, defaultPosition, maxVisible],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      dismissAll,
    }),
    [toast, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {positions.map((position) => {
        const positionToasts = toasts.filter((toast) => toast.position === position);

        if (positionToasts.length === 0) {
          return null;
        }

        const isBottomPosition = position.startsWith('bottom');

        return (
          <div
            key={position}
            aria-live='polite'
            aria-relevant='additions text'
            className={cn(
              'pointer-events-none fixed z-[100] flex w-[calc(100vw-2rem)] max-w-sm gap-3',
              isBottomPosition ? 'flex-col-reverse' : 'flex-col',
              viewportClasses[position],
            )}
          >
            {positionToasts.map((item) => (
              <ManagedToast key={item.id} item={item} onDismiss={dismiss} />
            ))}
          </div>
        );
      })}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
