'use client';

import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { FitmentStatusBadge } from '@/components/admin/orders/admin-order-badges';
import { formatToman } from '@/lib/admin/orders/admin-order-presentation';
import type { AdminOrderItem } from '@/lib/admin/orders/admin-order.types';
import { ImageOff } from 'lucide-react';
import { useMemo } from 'react';

type AdminOrderItemsTableProps = {
  items: AdminOrderItem[];
};

function getVehicleLabel(item: AdminOrderItem) {
  if (!item.vehicleVariant) {
    return item.vehicleSnapshot ? 'خودرو در Snapshot سفارش ثبت شده است' : 'بدون انتخاب خودرو';
  }

  return [
    item.vehicleVariant.model.make.name,
    item.vehicleVariant.model.name,
    item.vehicleVariant.name,
  ].join(' · ');
}

export function AdminOrderItemsTable({ items }: AdminOrderItemsTableProps) {
  const columns = useMemo<DataTableColumn<AdminOrderItem>[]>(
    () => [
      {
        key: 'product',
        header: 'محصول',
        minWidth: '300px',
        cell: (row) => (
          <div className='flex min-w-0 items-center gap-3'>
            <div className='grid size-12 shrink-0 place-items-center overflow-hidden rounded-control border border-border bg-surface-muted'>
              {row.productImageUrl ? (
                <img
                  src={row.productImageUrl}
                  alt={row.productName}
                  className='size-full object-cover'
                />
              ) : (
                <ImageOff className='size-5 text-foreground-muted' />
              )}
            </div>

            <div className='min-w-0'>
              <p className='truncate font-bold text-foreground'>{row.productName}</p>

              <div className='mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-foreground-muted'>
                <span>{row.brandName}</span>

                <span dir='ltr' className='numeric'>
                  SKU: {row.productSku}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'fitment',
        header: 'سازگاری خودرو',
        minWidth: '230px',
        cell: (row) => (
          <div className='space-y-2'>
            <FitmentStatusBadge status={row.fitmentStatus} />

            <p className='text-xs leading-6 text-foreground-secondary'>{getVehicleLabel(row)}</p>

            {row.fitmentNotes ? (
              <p className='text-xs text-foreground-muted'>{row.fitmentNotes}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'unitPrice',
        header: 'قیمت واحد',
        minWidth: '155px',
        align: 'center',
        cell: (row) => (
          <div className='space-y-1'>
            <p className='numeric font-extrabold text-foreground'>
              {formatToman(row.unitEffectivePriceToman)}
            </p>

            {row.unitBasePriceToman > row.unitEffectivePriceToman ? (
              <p className='numeric text-xs text-foreground-muted line-through'>
                {formatToman(row.unitBasePriceToman)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'quantity',
        header: 'تعداد',
        minWidth: '80px',
        align: 'center',
        cell: (row) => (
          <span className='numeric font-bold text-foreground'>
            {new Intl.NumberFormat('fa-IR').format(row.quantity)}
          </span>
        ),
      },
      {
        key: 'total',
        header: 'جمع',
        minWidth: '150px',
        align: 'center',
        cell: (row) => (
          <div className='space-y-1'>
            <p className='numeric font-extrabold text-foreground'>
              {formatToman(row.linePayableToman)}
            </p>

            {row.lineDiscountToman > 0 ? (
              <p className='numeric text-xs text-success'>
                {formatToman(row.lineDiscountToman)} تخفیف
              </p>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={items}
      columns={columns}
      getRowId={(row) => row.id}
      loading={false}
      tableClassName='min-w-[980px]'
      emptyTitle='قلمی برای این سفارش ثبت نشده است'
      emptyDescription='اطلاعات اقلام سفارش در دسترس نیست'
    />
  );
}
