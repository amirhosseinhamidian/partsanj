import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';

type PublicBlogPaginationProps = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  const windowSize = 5;

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - windowSize + 1));

  const end = Math.min(totalPages, start + windowSize - 1);

  return Array.from(
    {
      length: end - start + 1,
    },
    (_, index) => start + index,
  );
}

export function PublicBlogPagination({ page, totalPages, hrefForPage }: PublicBlogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav aria-label='صفحه‌بندی مقالات' className='flex flex-wrap items-center justify-center gap-2'>
      <Link
        href={hrefForPage(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          'grid size-10 place-items-center rounded-control border transition-colors',
          page === 1
            ? 'pointer-events-none border-border bg-surface-muted text-foreground-muted'
            : 'border-border bg-surface text-foreground-secondary hover:border-brand hover:text-brand',
        )}
      >
        <ChevronRight className='size-4' />
      </Link>

      {visiblePages.map((currentPage) => (
        <Link
          key={currentPage}
          href={hrefForPage(currentPage)}
          aria-current={currentPage === page ? 'page' : undefined}
          className={cn(
            'grid size-10 place-items-center rounded-control border text-sm font-bold transition-colors',
            currentPage === page
              ? 'border-brand bg-brand text-brand-foreground'
              : 'border-border bg-surface text-foreground-secondary hover:border-brand hover:text-brand',
          )}
        >
          {toPersianDigits(String(currentPage))}
        </Link>
      ))}

      <Link
        href={hrefForPage(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn(
          'grid size-10 place-items-center rounded-control border transition-colors',
          page === totalPages
            ? 'pointer-events-none border-border bg-surface-muted text-foreground-muted'
            : 'border-border bg-surface text-foreground-secondary hover:border-brand hover:text-brand',
        )}
      >
        <ChevronLeft className='size-4' />
      </Link>
    </nav>
  );
}
