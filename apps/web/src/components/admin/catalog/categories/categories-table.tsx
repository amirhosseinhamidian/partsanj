'use client';

import type { AdminCategory } from '@/lib/admin/catalog/category.types';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';

type CategoriesTableProps = {
  categories: AdminCategory[];
  loading: boolean;

  sort: DataTableSort | null;
  onSortChange: (sort: DataTableSort | null) => void;

  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;

  onCreate: () => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function CategoriesTable({
  categories,
  loading,
  sort,
  onSortChange,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onCreate,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  const columns = useMemo<DataTableColumn<AdminCategory>[]>(
    () => [
      {
        key: 'name',
        header: 'دسته‌بندی',
        sortable: true,
        sortValue: (row) => row.name,
        minWidth: '250px',
        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-bold text-foreground'>{row.name}</p>

            <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
              {row.slug}
            </p>
          </div>
        ),
      },
      {
        key: 'parent',
        header: 'دسته والد',
        sortable: true,
        sortValue: (row) => row.parent?.name ?? '',
        minWidth: '170px',
        cell: (row) =>
          row.parent ? (
            <div>
              <p className='font-semibold text-foreground-secondary'>{row.parent.name}</p>

              <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
                {row.parent.slug}
              </p>
            </div>
          ) : (
            <span className='text-sm text-foreground-muted'>دسته اصلی</span>
          ),
      },
      {
        key: 'relations',
        header: 'وابستگی‌ها',
        align: 'center',
        minWidth: '150px',
        cell: (row) => (
          <div className='flex justify-center gap-1.5'>
            <Badge size='sm' variant='neutral'>
              {toPersianDigits(row._count.children)} زیر‌دسته
            </Badge>

            <Badge size='sm' variant='info'>
              {toPersianDigits(row._count.products)} محصول
            </Badge>
          </div>
        ),
      },
      {
        key: 'sortOrder',
        header: 'ترتیب',
        sortable: true,
        sortValue: (row) => row.sortOrder,
        align: 'center',
        minWidth: '90px',
        cell: (row) => (
          <span className='numeric font-semibold text-foreground'>
            {toPersianDigits(row.sortOrder)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'وضعیت',
        sortable: true,
        sortValue: (row) => row.isActive,
        align: 'center',
        minWidth: '110px',
        cell: (row) =>
          row.isActive ? (
            <Badge variant='success' dot>
              فعال
            </Badge>
          ) : (
            <Badge variant='neutral' dot>
              غیرفعال
            </Badge>
          ),
      },
      {
        key: 'updatedAt',
        header: 'آخرین ویرایش',
        sortable: true,
        sortValue: (row) => new Date(row.updatedAt),
        minWidth: '150px',
        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatDate(row.updatedAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={categories}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      clientSort={false}
      onRowClick={onEdit}
      rowActions={(row) => {
        const canDelete = row._count.children === 0 && row._count.products === 0;

        const deleteTooltip = canDelete
          ? 'حذف دسته‌بندی'
          : row._count.children > 0 && row._count.products > 0
            ? 'این دسته‌بندی دارای محصول و زیر‌دسته وابسته است'
            : row._count.children > 0
              ? 'ابتدا زیر‌دسته‌های وابسته را منتقل یا حذف کنید'
              : 'ابتدا محصولات وابسته را منتقل یا حذف کنید';

        return (
          <div className='flex justify-end'>
            <Tooltip content='ویرایش دسته‌بندی'>
              <span className='inline-flex'>
                <IconButton
                  aria-label={`ویرایش ${row.name}`}
                  icon={<Edit />}
                  variant='ghost'
                  size='sm'
                  onClick={() => onEdit(row)}
                />
              </span>
            </Tooltip>

            <Tooltip content={deleteTooltip}>
              <span className='inline-flex'>
                <IconButton
                  aria-label={`حذف ${row.name}`}
                  icon={<Trash2 />}
                  variant='ghost'
                  size='sm'
                  disabled={!canDelete}
                  onClick={() => onDelete(row)}
                />
              </span>
            </Tooltip>
          </div>
        );
      }}
      emptyTitle='هنوز دسته‌بندی ثبت نشده'
      emptyDescription='اولین دسته‌بندی کاتالوگ را ایجاد کنید'
      emptyAction={
        <Button iconStart={<Plus />} onClick={onCreate}>
          افزودن دسته‌بندی
        </Button>
      }
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
    />
  );
}
