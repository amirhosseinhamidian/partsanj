'use client';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils/cn';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

type PaginationVariant = 'card' | 'embedded';

type PaginationItem =
  | {
      type: 'page';
      page: number;
    }
  | {
      type: 'ellipsis';
      key: string;
    };

const paginationVariantClasses: Record<PaginationVariant, string> = {
  card: ['rounded-card border border-border bg-surface px-4 py-3 shadow-panel'].join(' '),

  embedded: ['border-t border-border bg-surface px-4 py-3'].join(' '),
};

export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;

  disabled?: boolean;
  loading?: boolean;

  showSummary?: boolean;
  hideWhenSinglePage?: boolean;

  siblingCount?: number;
  boundaryCount?: number;

  variant?: PaginationVariant;

  summarySuffix?: ReactNode;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getPaginationItems(
  totalPages: number,
  currentPage: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  const visiblePages = new Set<number>();

  for (let page = 1; page <= Math.min(boundaryCount, totalPages); page += 1) {
    visiblePages.add(page);
  }

  const siblingStart = Math.max(1, currentPage - siblingCount);

  const siblingEnd = Math.min(totalPages, currentPage + siblingCount);

  for (let page = siblingStart; page <= siblingEnd; page += 1) {
    visiblePages.add(page);
  }

  for (let page = Math.max(totalPages - boundaryCount + 1, 1); page <= totalPages; page += 1) {
    visiblePages.add(page);
  }

  const sortedPages = [...visiblePages].sort((first, second) => first - second);

  const items: PaginationItem[] = [];
  let previousPage = 0;

  sortedPages.forEach((page) => {
    const gap = page - previousPage;

    if (previousPage > 0 && gap > 1) {
      if (gap === 2) {
        items.push({
          type: 'page',
          page: previousPage + 1,
        });
      } else {
        items.push({
          type: 'ellipsis',
          key: `ellipsis-${previousPage}-${page}`,
        });
      }
    }

    items.push({
      type: 'page',
      page,
    });

    previousPage = page;
  });

  return items;
}

function formatNumber(value: number): string {
  return value.toLocaleString('fa-IR');
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  disabled = false,
  loading = false,
  showSummary = true,
  hideWhenSinglePage = false,
  siblingCount = 1,
  boundaryCount = 1,
  variant = 'card',
  summarySuffix = 'مورد',
  className,
  ...props
}: PaginationProps) {
  const safePageSize = Math.max(Math.floor(pageSize), 1);
  const safeTotalItems = Math.max(totalItems, 0);

  const totalPages = Math.max(Math.ceil(safeTotalItems / safePageSize), 1);

  const currentPage = clamp(page, 1, totalPages);

  const startItem = safeTotalItems === 0 ? 0 : (currentPage - 1) * safePageSize + 1;

  const endItem = Math.min(currentPage * safePageSize, safeTotalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const isDisabled = disabled || loading;

  const items = getPaginationItems(
    totalPages,
    currentPage,
    Math.max(siblingCount, 0),
    Math.max(boundaryCount, 0),
  );

  function changePage(nextPage: number) {
    if (isDisabled || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }

    onPageChange(nextPage);
  }

  if (hideWhenSinglePage && totalPages <= 1) {
    return null;
  }

  return (
    <nav
      {...props}
      aria-label={props['aria-label'] ?? 'صفحه‌بندی'}
      aria-busy={loading || undefined}
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        paginationVariantClasses[variant],
        className,
      )}
    >
      {showSummary ? (
        <p className='text-sm text-foreground-muted'>
          نمایش{' '}
          <span className='numeric font-semibold text-foreground'>{formatNumber(startItem)}</span>{' '}
          تا <span className='numeric font-semibold text-foreground'>{formatNumber(endItem)}</span>{' '}
          از{' '}
          <span className='numeric font-semibold text-foreground'>
            {formatNumber(safeTotalItems)}
          </span>{' '}
          {summarySuffix}
        </p>
      ) : (
        <span />
      )}

      <div className='flex max-w-full items-center gap-1 overflow-x-auto pb-1 sm:pb-0'>
        <IconButton
          aria-label='صفحه قبلی'
          icon={<ChevronRight />}
          variant='outline'
          size='sm'
          disabled={isDisabled || !canGoPrevious}
          onClick={() => changePage(currentPage - 1)}
        />

        {items.map((item) => {
          if (item.type === 'ellipsis') {
            return (
              <span
                key={item.key}
                aria-hidden='true'
                className='grid size-9 shrink-0 place-items-center text-foreground-muted'
              >
                <MoreHorizontal className='size-4' />
              </span>
            );
          }

          const isCurrentPage = item.page === currentPage;

          return (
            <Button
              key={item.page}
              type='button'
              size='sm'
              variant={isCurrentPage ? 'primary' : 'ghost'}
              disabled={isDisabled}
              aria-current={isCurrentPage ? 'page' : undefined}
              aria-label={`صفحه ${formatNumber(item.page)}`}
              onClick={() => changePage(item.page)}
              className='numeric h-9 w-9 shrink-0 px-0'
            >
              {formatNumber(item.page)}
            </Button>
          );
        })}

        <IconButton
          aria-label='صفحه بعدی'
          icon={<ChevronLeft />}
          variant='outline'
          size='sm'
          disabled={isDisabled || !canGoNext}
          onClick={() => changePage(currentPage + 1)}
        />
      </div>
    </nav>
  );
}
