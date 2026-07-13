'use client';

import type {
  AdminProductListItem,
  ProductStatus,
  StockStatus,
} from '@/lib/admin/catalog/product.types';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { ImageOff } from 'lucide-react';
import { useMemo } from 'react';
import { Edit } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { toPersianDigits } from '@/lib/utils/digits';
import { formatPrice } from '@/lib/utils/price';

type ProductsTableProps = {
  products: AdminProductListItem[];
  loading: boolean;

  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;
  onEdit: (product: AdminProductListItem) => void;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge variant='success' dot>
          فعال
        </Badge>
      );

    case 'ARCHIVED':
      return (
        <Badge variant='neutral' dot>
          آرشیو
        </Badge>
      );

    default:
      return (
        <Badge variant='warning' dot>
          پیش‌نویس
        </Badge>
      );
  }
}

function StockStatusBadge({ stockStatus }: { stockStatus: StockStatus }) {
  switch (stockStatus) {
    case 'IN_STOCK':
      return (
        <Badge variant='success' dot>
          موجود
        </Badge>
      );

    case 'OUT_OF_STOCK':
      return (
        <Badge variant='danger' dot>
          ناموجود
        </Badge>
      );

    default:
      return (
        <Badge variant='warning' dot>
          نیازمند استعلام
        </Badge>
      );
  }
}

export function ProductsTable({
  products,
  loading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onEdit,
}: ProductsTableProps) {
  const columns = useMemo<DataTableColumn<AdminProductListItem>[]>(
    () => [
      {
        key: 'product',
        header: 'محصول',
        minWidth: '320px',
        cell: (row) => {
          const primaryImage = row.images[0];

          const primaryCode = row.codes.find((code) => code.type === 'OEM') ?? row.codes[0];

          return (
            <div className='flex min-w-0 items-center gap-3'>
              <div className='grid size-12 shrink-0 place-items-center overflow-hidden rounded-control border border-border bg-surface-muted'>
                {primaryImage ? (
                  <img
                    src={primaryImage.url}
                    alt={primaryImage.alt ?? row.name}
                    loading='lazy'
                    className='size-full object-cover'
                  />
                ) : (
                  <ImageOff className='size-5 text-foreground-muted' />
                )}
              </div>

              <div className='min-w-0'>
                <p className='truncate font-bold text-foreground'>{row.name}</p>

                <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted'>
                  <span dir='ltr' className='numeric'>
                    SKU: {row.sku}
                  </span>

                  {primaryCode ? (
                    <span dir='ltr' className='numeric'>
                      {primaryCode.type}: {primaryCode.value}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'brand',
        header: 'برند',
        minWidth: '150px',
        cell: (row) => (
          <div>
            <p className='font-semibold text-foreground-secondary'>{row.brand.name}</p>

            <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
              {row.brand.slug}
            </p>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'دسته‌بندی',
        minWidth: '150px',
        cell: (row) => (
          <div>
            <p className='font-semibold text-foreground-secondary'>{row.category.name}</p>

            <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
              {row.category.slug}
            </p>
          </div>
        ),
      },
      {
        key: 'price',
        header: 'قیمت فروش',
        minWidth: '170px',
        align: 'center',
        cell: (row) => {
          const hasActiveSale =
            row.isSaleActive && row.salePriceToman !== null && row.priceToman !== null;

          const primaryPrice = hasActiveSale ? row.salePriceToman : row.priceToman;

          if (primaryPrice === null) {
            return <span className='text-sm text-foreground-muted'>بدون قیمت</span>;
          }

          return (
            <div className='space-y-1.5'>
              <p className='numeric text-sm font-extrabold text-foreground'>
                {formatPrice(primaryPrice)}
              </p>

              {hasActiveSale ? (
                <div className='flex flex-wrap items-center justify-center gap-1.5'>
                  <span className='numeric text-xs text-foreground-muted line-through'>
                    {formatPrice(row.priceToman)}
                  </span>

                  {row.discountPercent > 0 ? (
                    <Badge size='sm' variant='brand'>
                      {toPersianDigits(row.discountPercent)}٪ تخفیف
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'stock',
        header: 'موجودی',
        minWidth: '80px',
        align: 'center',
        cell: (row) => {
          const isTracked = row.stockStatus !== 'CHECK_AVAILABILITY';

          const isLowStock =
            row.stockStatus === 'IN_STOCK' && row.stockQuantity <= row.lowStockThreshold;

          return (
            <div className='flex flex-col items-center gap-1.5'>
              <StockStatusBadge stockStatus={row.stockStatus} />

              {isTracked ? (
                <span className='text-xs font-bold text-foreground-secondary'>
                  {toPersianDigits(row.stockQuantity)} عدد
                </span>
              ) : null}

              {isLowStock ? (
                <span className='rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold text-warning'>
                  کم‌موجود
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'وضعیت',
        minWidth: '80px',
        align: 'center',
        cell: (row) => <ProductStatusBadge status={row.status} />,
      },
      {
        key: 'showOnHome',
        header: 'صفحه اصلی',
        minWidth: '80px',
        align: 'center',
        cell: (row) =>
          row.showOnHome ? (
            <div className='space-y-1'>
              <Badge variant='info' dot>
                محصولات ویژه
              </Badge>

              <p className='numeric text-xs text-foreground-muted'>
                ترتیب: {toPersianDigits(row.homeSortOrder)}
              </p>
            </div>
          ) : (
            <Badge variant='neutral' dot>
              عدم نمایش
            </Badge>
          ),
      },
      {
        key: 'visibility',
        header: 'نمایش',
        minWidth: '80px',
        align: 'center',
        cell: (row) => (
          <div className='flex flex-col items-center gap-1'>
            <Badge size='sm' variant={row.isPublished ? 'success' : 'neutral'}>
              {row.isPublished ? 'منتشرشده' : 'مخفی'}
            </Badge>

            {row.isTorobEnabled ? (
              <Badge size='sm' variant='brand'>
                ترب فعال
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        key: 'updatedAt',
        header: 'آخرین ویرایش',
        minWidth: '100px',
        align: 'center',
        cell: (row) => (
          <span className='text-sm text-foreground-secondary'>{formatDate(row.updatedAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={products}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingRows={10}
      tableClassName='min-w-[1320px]'
      emptyTitle='محصولی پیدا نشد'
      emptyDescription='فیلترها را تغییر دهید یا محصول جدیدی ثبت کنید'
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
      onRowClick={onEdit}
      rowActions={(row) => (
        <Tooltip content='ویرایش محصول'>
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
    />
  );
}
