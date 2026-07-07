import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

type PublicBlogPageShellProps = {
  children: ReactNode;
  width?: 'wide' | 'reading';
  className?: string;
};

export function PublicBlogPageShell({
  children,
  width = 'wide',
  className,
}: PublicBlogPageShellProps) {
  return (
    <main
      className={cn(
        'mx-auto w-full px-4 py-10 sm:px-6 lg:px-8 lg:py-14',
        width === 'wide' ? 'max-w-7xl' : 'max-w-4xl',
        className,
      )}
    >
      {children}
    </main>
  );
}
