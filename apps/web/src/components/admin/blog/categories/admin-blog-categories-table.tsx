'use client';

import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import type { AdminBlogCategoryListItem } from '@/lib/admin/blog/categories/admin-blog-category.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { Pencil } from 'lucide-react';
import { useMemo } from 'react';

type AdminBlogCategoriesTableProps = {
  categories: AdminBlogCategoryListItem[];
  loading: boolean;

  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;

  /**
   * در گام بعد به Sheet ایجاد/ویرایش وصل می‌شود
   */
  onOpenDetails?: (category: AdminBlogCategoryListItem) => void;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function CategoryStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant='success' dot>
      فعال
    </Badge>
  ) : (
    <Badge variant='neutral' dot>
      غیرفعال
    </Badge>
  );
}

function SeoStatus({ category }: { category: AdminBlogCategoryListItem }) {
  const hasCustomMetadata = Boolean(
    category.seoTitle ||
    category.seoDescription ||
    category.openGraphTitle ||
    category.openGraphDescription ||
    category.openGraphImageUrl,
  );

  return (
    <div className='flex flex-col items-center gap-1.5'>
      {category.noIndex ? (
        <Badge size='sm' variant='danger'>
          Noindex
        </Badge>
      ) : (
        <Badge size='sm' variant='success'>
          ایندکس مجاز
        </Badge>
      )}

      <span className='text-xs text-foreground-muted'>
        {hasCustomMetadata ? 'متادیتای سفارشی' : 'مقادیر پیش‌فرض'}
      </span>
    </div>
  );
}

export function AdminBlogCategoriesTable({
  categories,
  loading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onOpenDetails,
}: AdminBlogCategoriesTableProps) {
  const columns = useMemo<DataTableColumn<AdminBlogCategoryListItem>[]>(
    () => [
      {
        key: 'category',
        header: 'دسته‌بندی',
        minWidth: '270px',
        cell: (row) => (
          <div className='min-w-0'>
            <p className='truncate font-bold text-foreground'>{row.name}</p>

            <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
              {row.slug}
            </p>

            {row.description ? (
              <p className='mt-2 line-clamp-2 text-xs leading-5 text-foreground-secondary'>
                {row.description}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'posts',
        header: 'مقالات',
        minWidth: '110px',
        align: 'center',
        cell: (row) => (
          <div>
            <p className='numeric text-base font-extrabold text-foreground'>
              {toPersianDigits(String(row._count.posts))}
            </p>

            <p className='mt-1 text-xs text-foreground-muted'>مقاله</p>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'وضعیت',
        minWidth: '120px',
        align: 'center',
        cell: (row) => <CategoryStatusBadge isActive={row.isActive} />,
      },
      {
        key: 'sortOrder',
        header: 'اولویت نمایش',
        minWidth: '135px',
        align: 'center',
        cell: (row) => (
          <span className='numeric text-sm font-semibold text-foreground-secondary'>
            {toPersianDigits(String(row.sortOrder))}
          </span>
        ),
      },
      {
        key: 'seo',
        header: 'وضعیت SEO',
        minWidth: '155px',
        align: 'center',
        cell: (row) => <SeoStatus category={row} />,
      },
      {
        key: 'updatedAt',
        header: 'آخرین تغییر',
        minWidth: '130px',
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
      data={categories}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingRows={10}
      tableClassName='min-w-[1100px]'
      emptyTitle='دسته‌بندی بلاگی پیدا نشد'
      emptyDescription='فیلترها را تغییر دهید یا اولین دسته‌بندی بلاگ را ایجاد کنید'
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
      onRowClick={onOpenDetails}
      rowActions={
        onOpenDetails
          ? (row) => (
              <Tooltip content='ویرایش دسته‌بندی'>
                <span className='inline-flex'>
                  <IconButton
                    aria-label={`ویرایش دسته‌بندی ${row.name}`}
                    icon={<Pencil />}
                    variant='ghost'
                    size='sm'
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDetails(row);
                    }}
                  />
                </span>
              </Tooltip>
            )
          : undefined
      }
    />
  );
}
