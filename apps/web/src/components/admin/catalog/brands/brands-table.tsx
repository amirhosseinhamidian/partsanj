'use client';

import type { AdminBrand } from '@/lib/admin/catalog/brand.types';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn, type DataTableSort } from '@/components/ui/data-table';
import { IconButton } from '@/components/ui/icon-button';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { Tooltip } from '@/components/ui/tooltip';
import { Edit } from 'lucide-react';
import { useMemo } from 'react';
import { toPersianDigits } from '@/lib/utils/digits';

type BrandsTableProps = {
  brands: AdminBrand[];
  loading: boolean;

  sort: DataTableSort | null;
  onSortChange: (sort: DataTableSort | null) => void;

  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;

  onEdit: (brand: AdminBrand) => void;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function BrandsTable({
  brands,
  loading,
  sort,
  onSortChange,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onEdit,
}: BrandsTableProps) {
  const columns = useMemo<DataTableColumn<AdminBrand>[]>(
    () => [
      {
        key: 'name',
        header: 'برند',
        sortable: true,
        sortValue: (row) => row.name,
        minWidth: '280px',
        cell: (row) => (
          <div className='flex min-w-0 items-center gap-3'>
            <ImageUrlPreview
              src={row.logoUrl}
              alt={`لوگوی ${row.name}`}
              emptyLabel=''
              className='size-11 shrink-0'
              imageClassName='object-contain p-1.5'
            />

            <div className='min-w-0'>
              <p className='truncate font-bold text-foreground'>{row.name}</p>

              <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
                {row.slug}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'products',
        header: 'محصولات',
        sortable: true,
        sortValue: (row) => row._count.products,
        align: 'center',
        minWidth: '120px',
        cell: (row) => (
          <Badge size='sm' variant={row._count.products > 0 ? 'info' : 'neutral'}>
            {toPersianDigits(row._count.products)} محصول
          </Badge>
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
      data={brands}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      clientSort={false}
      onRowClick={onEdit}
      rowActions={(row) => (
        <Tooltip content='ویرایش برند'>
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
      )}
      emptyTitle='هنوز برندی ثبت نشده'
      emptyDescription='برای ساخت محصول، ابتدا برندهای قطعات را ثبت کنید'
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
    />
  );
}
