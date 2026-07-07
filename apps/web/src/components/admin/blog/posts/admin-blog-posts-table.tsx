'use client';

import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  getBlogPostAuthorDisplayName,
  getBlogPostStatusLabel,
} from '@/lib/admin/blog/posts/admin-blog-post-presentation';
import type {
  AdminBlogPostListItem,
  AdminBlogPostStatus,
} from '@/lib/admin/blog/posts/admin-blog-post.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { useMemo } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip } from '@/components/ui/tooltip';
import { FileText, ImageIcon, Pencil } from 'lucide-react';

type AdminBlogPostsTableProps = {
  posts: AdminBlogPostListItem[];
  loading: boolean;

  page: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;
  onEdit: (post: AdminBlogPostListItem) => void;
};

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

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

function BlogPostStatusBadge({ status }: { status: AdminBlogPostStatus }) {
  switch (status) {
    case 'PUBLISHED':
      return (
        <Badge variant='success' dot>
          منتشرشده
        </Badge>
      );

    case 'ARCHIVED':
      return (
        <Badge variant='neutral' dot>
          آرشیوشده
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

function SeoStatus({ post }: { post: AdminBlogPostListItem }) {
  const hasCustomMetadata = Boolean(
    post.seoTitle ||
    post.seoDescription ||
    post.openGraphTitle ||
    post.openGraphDescription ||
    post.openGraphImageUrl,
  );

  return (
    <div className='flex flex-col items-center gap-1.5'>
      {post.noIndex ? (
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

export function AdminBlogPostsTable({
  posts,
  loading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onEdit,
}: AdminBlogPostsTableProps) {
  const columns = useMemo<DataTableColumn<AdminBlogPostListItem>[]>(
    () => [
      {
        key: 'post',
        header: 'مقاله',
        minWidth: '320px',
        cell: (row) => (
          <div className='flex min-w-0 items-start gap-3'>
            <span className='grid size-10 shrink-0 place-items-center rounded-control bg-surface-muted text-foreground-muted'>
              {row.coverImageUrl ? (
                <ImageIcon className='size-4 text-brand' />
              ) : (
                <FileText className='size-4' />
              )}
            </span>

            <div className='min-w-0'>
              <p className='truncate font-bold text-foreground'>{row.title}</p>

              <p dir='ltr' className='mt-1 truncate text-xs text-foreground-muted'>
                {row.slug}
              </p>

              {row.excerpt ? (
                <p className='mt-2 line-clamp-2 text-xs leading-5 text-foreground-secondary'>
                  {row.excerpt}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'دسته‌بندی',
        minWidth: '170px',
        cell: (row) => (
          <div>
            <p className='font-semibold text-foreground-secondary'>{row.category.name}</p>

            {!row.category.isActive ? (
              <p className='mt-1 text-xs text-warning'>دسته‌بندی غیرفعال</p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'وضعیت',
        minWidth: '130px',
        align: 'center',
        cell: (row) => <BlogPostStatusBadge status={row.status} />,
      },
      {
        key: 'author',
        header: 'نویسنده',
        minWidth: '165px',
        cell: (row) => (
          <div>
            <p className='font-semibold text-foreground-secondary'>
              {getBlogPostAuthorDisplayName(row.authorUser)}
            </p>

            <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
              {toPersianDigits(row.authorUser.mobile)}
            </p>
          </div>
        ),
      },
      {
        key: 'seo',
        header: 'وضعیت SEO',
        minWidth: '155px',
        align: 'center',
        cell: (row) => <SeoStatus post={row} />,
      },
      {
        key: 'publishedAt',
        header: 'انتشار',
        minWidth: '130px',
        align: 'center',
        cell: (row) => (
          <div>
            <p className='text-sm text-foreground-secondary'>{formatDate(row.publishedAt)}</p>

            <p className='mt-1 text-xs text-foreground-muted'>
              {getBlogPostStatusLabel(row.status)}
            </p>
          </div>
        ),
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
      data={posts}
      columns={columns}
      getRowId={(row) => row.id}
      loading={loading}
      loadingRows={10}
      tableClassName='min-w-[1320px]'
      emptyTitle='مقاله‌ای پیدا نشد'
      emptyDescription='فیلترها را تغییر دهید یا اولین مقاله را ایجاد کنید'
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
      }}
      onRowClick={onEdit}
      rowActions={(row) => (
        <Tooltip content='ویرایش مقاله'>
          <span className='inline-flex'>
            <IconButton
              aria-label={`ویرایش مقاله ${row.title}`}
              icon={<Pencil />}
              variant='ghost'
              size='sm'
              onClick={(event) => {
                event.stopPropagation();
                onEdit(row);
              }}
            />
          </span>
        </Tooltip>
      )}
    />
  );
}
