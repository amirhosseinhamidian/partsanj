'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils/cn';
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

type SortDirection = 'asc' | 'desc';

export type DataTableSort = {
  key: string;
  direction: SortDirection;
};

type SortValue = string | number | boolean | Date | null | undefined;

export type DataTableColumn<TData> = {
  key: string;
  header: ReactNode;

  cell: (row: TData, rowIndex: number) => ReactNode;

  sortable?: boolean;
  sortValue?: (row: TData) => SortValue;

  width?: string;
  minWidth?: string;
  align?: 'start' | 'center' | 'end';

  headerClassName?: string;
  cellClassName?: string;
};

export type DataTablePagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export type DataTableProps<TData> = {
  data: readonly TData[];
  columns: readonly DataTableColumn<TData>[];
  getRowId: (row: TData) => string;

  loading?: boolean;
  loadingRows?: number;

  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;

  selectable?: boolean;
  selectedRowIds?: readonly string[];
  onSelectedRowIdsChange?: (rowIds: string[]) => void;

  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  clientSort?: boolean;

  pagination?: DataTablePagination;

  rowActions?: (row: TData) => ReactNode;
  onRowClick?: (row: TData) => void;

  className?: string;
  tableClassName?: string;
  rowClassName?: string | ((row: TData) => string);
};

function compareSortValues(a: SortValue, b: SortValue): number {
  const normalizedA = a instanceof Date ? a.getTime() : a;
  const normalizedB = b instanceof Date ? b.getTime() : b;

  if (normalizedA === normalizedB) {
    return 0;
  }

  if (normalizedA === null || normalizedA === undefined) {
    return 1;
  }

  if (normalizedB === null || normalizedB === undefined) {
    return -1;
  }

  if (typeof normalizedA === 'number' && typeof normalizedB === 'number') {
    return normalizedA - normalizedB;
  }

  return String(normalizedA).localeCompare(String(normalizedB), 'fa-IR', {
    numeric: true,
    sensitivity: 'base',
  });
}

function getAlignClass(align: DataTableColumn<unknown>['align']) {
  if (align === 'center') {
    return 'text-center';
  }

  if (align === 'end') {
    return 'text-left';
  }

  return 'text-right';
}

function getNextSort(currentSort: DataTableSort | null, columnKey: string): DataTableSort | null {
  if (!currentSort || currentSort.key !== columnKey) {
    return {
      key: columnKey,
      direction: 'asc',
    };
  }

  if (currentSort.direction === 'asc') {
    return {
      key: columnKey,
      direction: 'desc',
    };
  }

  return null;
}

function SortIcon({ active, direction }: { active: boolean; direction?: SortDirection }) {
  if (!active) {
    return <ChevronsUpDown className='size-3.5' />;
  }

  if (direction === 'asc') {
    return <ArrowUp className='size-3.5' />;
  }

  return <ArrowDown className='size-3.5' />;
}

function DataTableSkeleton({
  columnsCount,
  rowsCount,
  selectable,
  hasActions,
}: {
  columnsCount: number;
  rowsCount: number;
  selectable: boolean;
  hasActions: boolean;
}) {
  const totalColumns = columnsCount + Number(selectable) + Number(hasActions);

  return (
    <>
      {Array.from({ length: rowsCount }).map((_, rowIndex) => (
        <tr key={rowIndex} className='border-b border-border last:border-b-0'>
          {Array.from({ length: totalColumns }).map((__, cellIndex) => (
            <td key={cellIndex} className='px-4 py-4'>
              <div className='h-4 w-full max-w-40 animate-pulse rounded-full bg-surface-muted' />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  loading = false,
  loadingRows = 6,
  emptyTitle = 'داده‌ای برای نمایش وجود ندارد',
  emptyDescription = 'پس از ثبت اطلاعات، آیتم‌ها در این جدول نمایش داده می‌شوند',
  emptyAction,
  selectable = false,
  selectedRowIds,
  onSelectedRowIdsChange,
  sort,
  defaultSort = null,
  onSortChange,
  clientSort = true,
  pagination,
  rowActions,
  onRowClick,
  className,
  tableClassName,
  rowClassName,
}: DataTableProps<TData>) {
  const [internalSelectedRowIds, setInternalSelectedRowIds] = useState<string[]>([]);

  const [internalSort, setInternalSort] = useState<DataTableSort | null>(defaultSort);

  const currentSelectedRowIds = selectedRowIds ?? internalSelectedRowIds;
  const currentSort = sort !== undefined ? sort : internalSort;

  const rowIds = useMemo(() => data.map(getRowId), [data, getRowId]);

  const selectedSet = useMemo(() => new Set(currentSelectedRowIds), [currentSelectedRowIds]);

  const selectedVisibleRowIds = rowIds.filter((rowId) => selectedSet.has(rowId));

  const allVisibleSelected = rowIds.length > 0 && selectedVisibleRowIds.length === rowIds.length;

  const someVisibleSelected =
    selectedVisibleRowIds.length > 0 && selectedVisibleRowIds.length < rowIds.length;

  const sortedData = useMemo(() => {
    if (!clientSort || !currentSort) {
      return [...data];
    }

    const sortableColumn = columns.find(
      (column) => column.key === currentSort.key && column.sortable,
    );

    if (!sortableColumn?.sortValue) {
      return [...data];
    }

    return [...data].sort((firstRow, secondRow) => {
      const result = compareSortValues(
        sortableColumn.sortValue?.(firstRow),
        sortableColumn.sortValue?.(secondRow),
      );

      return currentSort.direction === 'asc' ? result : result * -1;
    });
  }, [clientSort, columns, currentSort, data]);

  function updateSelectedRowIds(nextSelectedRowIds: string[]) {
    if (!selectedRowIds) {
      setInternalSelectedRowIds(nextSelectedRowIds);
    }

    onSelectedRowIdsChange?.(nextSelectedRowIds);
  }

  function toggleRow(rowId: string, checked: boolean) {
    const nextSelectedSet = new Set(currentSelectedRowIds);

    if (checked) {
      nextSelectedSet.add(rowId);
    } else {
      nextSelectedSet.delete(rowId);
    }

    updateSelectedRowIds([...nextSelectedSet]);
  }

  function toggleAllVisible(checked: boolean) {
    const nextSelectedSet = new Set(currentSelectedRowIds);

    rowIds.forEach((rowId) => {
      if (checked) {
        nextSelectedSet.add(rowId);
      } else {
        nextSelectedSet.delete(rowId);
      }
    });

    updateSelectedRowIds([...nextSelectedSet]);
  }

  function updateSort(column: DataTableColumn<TData>) {
    if (!column.sortable) {
      return;
    }

    const nextSort = getNextSort(currentSort, column.key);

    if (sort === undefined) {
      setInternalSort(nextSort);
    }

    onSortChange?.(nextSort);
  }

  const hasActions = Boolean(rowActions);
  const hasRows = sortedData.length > 0;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-card border border-border bg-surface shadow-panel',
        className,
      )}
    >
      <div className='overflow-x-auto'>
        <table className={cn('w-full min-w-max border-collapse text-sm', tableClassName)}>
          <thead className='bg-surface-muted'>
            <tr className='border-b border-border'>
              {selectable ? (
                <th className='w-12 px-4 py-3 text-right'>
                  <Checkbox
                    aria-label='انتخاب همه ردیف‌های قابل مشاهده'
                    checked={
                      allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false
                    }
                    onCheckedChange={(checked) => {
                      toggleAllVisible(checked === true);
                    }}
                    disabled={loading || rowIds.length === 0}
                    wrapperClassName='w-auto'
                  />
                </th>
              ) : null}

              {columns.map((column) => {
                const isSorted = currentSort?.key === column.key;

                return (
                  <th
                    key={column.key}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                    className={cn(
                      'px-4 py-3 text-xs font-bold text-foreground-muted',
                      getAlignClass(column.align),
                      column.headerClassName,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type='button'
                        onClick={() => updateSort(column)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-[8px] text-xs font-bold transition-colors',
                          'hover:text-foreground focus:ring-4 focus:ring-focus-ring focus:outline-none',
                          isSorted ? 'text-brand' : 'text-foreground-muted',
                          column.align === 'center' && 'justify-center',
                        )}
                      >
                        <span>{column.header}</span>

                        <SortIcon active={isSorted} direction={currentSort?.direction} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}

              {hasActions ? (
                <th className='w-16 px-4 py-3 text-left text-xs font-bold text-foreground-muted'>
                  عملیات
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <DataTableSkeleton
                columnsCount={columns.length}
                rowsCount={loadingRows}
                selectable={selectable}
                hasActions={hasActions}
              />
            ) : hasRows ? (
              sortedData.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const isSelected = selectedSet.has(rowId);

                const computedRowClassName =
                  typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;

                return (
                  <tr
                    key={rowId}
                    data-selected={isSelected ? 'true' : undefined}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b border-border transition-colors last:border-b-0',
                      'hover:bg-surface-muted/70',
                      isSelected && 'bg-brand-soft/60',
                      onRowClick && 'cursor-pointer',
                      computedRowClassName,
                    )}
                  >
                    {selectable ? (
                      <td className='w-12 px-4 py-3' onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          aria-label={`انتخاب ردیف ${rowIndex + 1}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            toggleRow(rowId, checked === true);
                          }}
                          wrapperClassName='w-auto'
                        />
                      </td>
                    ) : null}

                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3 text-foreground-secondary',
                          getAlignClass(column.align),
                          column.cellClassName,
                        )}
                      >
                        {column.cell(row, rowIndex)}
                      </td>
                    ))}

                    {hasActions ? (
                      <td
                        className='w-16 px-4 py-3 text-left'
                        onClick={(event) => event.stopPropagation()}
                      >
                        {rowActions?.(row)}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + Number(selectable) + Number(hasActions)}
                  className='px-6 py-14 text-center'
                >
                  <div className='mx-auto max-w-sm'>
                    <p className='type-card-title text-foreground'>{emptyTitle}</p>

                    <p className='type-body mt-2 text-foreground-muted'>{emptyDescription}</p>

                    {emptyAction ? (
                      <div className='mt-5 flex justify-center'>{emptyAction}</div>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination ? <DataTablePaginationControls pagination={pagination} /> : null}
    </div>
  );
}

function DataTablePaginationControls({ pagination }: { pagination: DataTablePagination }) {
  const totalPages = Math.max(Math.ceil(pagination.totalItems / pagination.pageSize), 1);

  const currentPage = Math.min(Math.max(pagination.page, 1), totalPages);

  const startItem = pagination.totalItems === 0 ? 0 : (currentPage - 1) * pagination.pageSize + 1;

  const endItem = Math.min(currentPage * pagination.pageSize, pagination.totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className='flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
      <p className='text-sm text-foreground-muted'>
        نمایش{' '}
        <span className='font-semibold text-foreground'>{startItem.toLocaleString('fa-IR')}</span>{' '}
        تا <span className='font-semibold text-foreground'>{endItem.toLocaleString('fa-IR')}</span>{' '}
        از{' '}
        <span className='font-semibold text-foreground'>
          {pagination.totalItems.toLocaleString('fa-IR')}
        </span>{' '}
        مورد
      </p>

      <div className='flex items-center gap-2'>
        <IconButton
          aria-label='صفحه قبلی'
          icon={<ChevronRight />}
          variant='outline'
          size='sm'
          disabled={!canGoPrevious}
          onClick={() => pagination.onPageChange(currentPage - 1)}
        />

        <span className='min-w-24 text-center text-sm font-semibold text-foreground'>
          صفحه {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
        </span>

        <IconButton
          aria-label='صفحه بعدی'
          icon={<ChevronLeft />}
          variant='outline'
          size='sm'
          disabled={!canGoNext}
          onClick={() => pagination.onPageChange(currentPage + 1)}
        />
      </div>
    </div>
  );
}
