'use client';

import { Button } from '@/components/ui/button';
import type { SelectOption } from '@/components/ui/select';
import type {
  AdminBlogPostListQuery,
  AdminBlogPostStatus,
} from '@/lib/admin/blog/posts/admin-blog-post.types';
import { useAdminBlogPosts } from '@/lib/admin/blog/posts/use-admin-blog-posts';
import { useAdminBlogCategories } from '@/lib/admin/blog/categories/use-admin-blog-categories';
import { toPersianDigits } from '@/lib/utils/digits';
import { BookOpenText, CircleAlert, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AdminBlogPostsFilterBar,
  type AdminBlogPostsFiltersDraft,
} from './admin-blog-posts-filter-bar';
import { AdminBlogPostsTable } from './admin-blog-posts-table';
import { isAdminBlogPostStatus } from '@/lib/admin/blog/posts/admin-blog-post.types';

const BLOG_POSTS_PAGE_SIZE = 20;
const BLOG_CATEGORY_OPTIONS_LIMIT = 100;

type UrlPatch = {
  q?: string | null;
  status?: AdminBlogPostStatus | null;
  categoryId?: string | null;
  page?: number | null;
};

function parsePage(value: string | null) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function parseStatus(value: string | null) {
  return isAdminBlogPostStatus(value) ? value : undefined;
}

function createFiltersDraft(input: {
  q: string;
  status?: AdminBlogPostStatus;
  categoryId?: string;
}): AdminBlogPostsFiltersDraft {
  return {
    q: input.q,
    status: input.status ?? '',
    categoryId: input.categoryId ?? '',
  };
}

export function AdminBlogPostsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const appliedQuery = searchParams.get('q') ?? '';
  const appliedStatus = parseStatus(searchParams.get('status'));
  const appliedCategoryId = searchParams.get('categoryId') ?? '';
  const currentPage = parsePage(searchParams.get('page'));

  const postsQuery = useMemo<AdminBlogPostListQuery>(
    () => ({
      q: appliedQuery || undefined,
      status: appliedStatus,
      categoryId: appliedCategoryId || undefined,
      page: currentPage,
      limit: BLOG_POSTS_PAGE_SIZE,
    }),
    [appliedQuery, appliedStatus, appliedCategoryId, currentPage],
  );

  const { posts, meta, isLoading, error, refresh, clearError } = useAdminBlogPosts(postsQuery);

  const categoriesQuery = useMemo(
    () => ({
      page: 1,
      limit: BLOG_CATEGORY_OPTIONS_LIMIT,
    }),
    [],
  );

  const {
    categories,
    isLoading: areCategoriesLoading,
    error: categoriesError,
    refresh: refreshCategories,
    clearError: clearCategoriesError,
  } = useAdminBlogCategories(categoriesQuery);

  const [draftFilters, setDraftFilters] = useState<AdminBlogPostsFiltersDraft>(() =>
    createFiltersDraft({
      q: appliedQuery,
      status: appliedStatus,
      categoryId: appliedCategoryId,
    }),
  );

  useEffect(() => {
    setDraftFilters(
      createFiltersDraft({
        q: appliedQuery,
        status: appliedStatus,
        categoryId: appliedCategoryId,
      }),
    );
  }, [appliedQuery, appliedStatus, appliedCategoryId]);

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.isActive ? category.name : `${category.name} — غیرفعال`,
      })),
    [categories],
  );

  const updateUrl = useCallback(
    (patch: UrlPatch) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      if ('q' in patch) {
        const normalizedQuery = patch.q?.trim();

        if (normalizedQuery) {
          nextParams.set('q', normalizedQuery);
        } else {
          nextParams.delete('q');
        }
      }

      if ('status' in patch) {
        if (patch.status) {
          nextParams.set('status', patch.status);
        } else {
          nextParams.delete('status');
        }
      }

      if ('categoryId' in patch) {
        if (patch.categoryId) {
          nextParams.set('categoryId', patch.categoryId);
        } else {
          nextParams.delete('categoryId');
        }
      }

      if ('page' in patch) {
        if (!patch.page || patch.page <= 1) {
          nextParams.delete('page');
        } else {
          nextParams.set('page', String(patch.page));
        }
      }

      const queryString = nextParams.toString();

      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const applyFilters = useCallback(() => {
    updateUrl({
      q: draftFilters.q.trim() || null,
      status: draftFilters.status || null,
      categoryId: draftFilters.categoryId || null,
      page: null,
    });
  }, [draftFilters, updateUrl]);

  const resetFilters = useCallback(() => {
    setDraftFilters({
      q: '',
      status: '',
      categoryId: '',
    });

    updateUrl({
      q: null,
      status: null,
      categoryId: null,
      page: null,
    });
  }, [updateUrl]);

  return (
    <main className='space-y-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand'>
            <BookOpenText className='size-5' />
          </span>

          <div>
            <h1 className='text-xl font-extrabold text-foreground'>مقالات بلاگ</h1>

            <p className='mt-1 text-sm text-foreground-secondary'>
              فهرست، وضعیت انتشار و تنظیمات محتوایی مقالات بلاگ را مدیریت کنید
            </p>
          </div>
        </div>
        <Button
          type='button'
          iconStart={<Plus className='size-4' />}
          onClick={() => {
            router.push('/admin/blog/posts/new');
          }}
        >
          مقاله جدید
        </Button>
      </header>

      <AdminBlogPostsFilterBar
        draft={draftFilters}
        categoryOptions={categoryOptions}
        loading={isLoading}
        categoriesLoading={areCategoriesLoading}
        onDraftChange={(patch) => {
          setDraftFilters((current) => ({
            ...current,
            ...patch,
          }));
        }}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {categoriesError ? (
        <section
          role='alert'
          className='flex flex-wrap items-center justify-between gap-4 rounded-card border border-warning/30 bg-warning-soft p-4'
        >
          <div className='flex items-start gap-3'>
            <CircleAlert className='mt-0.5 size-5 shrink-0 text-warning' />

            <div>
              <p className='font-bold text-warning'>دریافت فهرست دسته‌بندی‌ها ناموفق بود</p>

              <p className='mt-1 text-sm text-warning/90'>{categoriesError}</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={clearCategoriesError}>
              بستن
            </Button>

            <Button
              type='button'
              size='sm'
              iconStart={<RefreshCw className='size-4' />}
              onClick={refreshCategories}
            >
              تلاش مجدد
            </Button>
          </div>
        </section>
      ) : null}

      {error ? (
        <section
          role='alert'
          className='flex flex-wrap items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger-soft p-4'
        >
          <div className='flex items-start gap-3'>
            <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

            <div>
              <p className='font-bold text-danger'>دریافت مقالات بلاگ ناموفق بود</p>

              <p className='mt-1 text-sm text-danger/90'>{error}</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={clearError}>
              بستن
            </Button>

            <Button
              type='button'
              size='sm'
              iconStart={<RefreshCw className='size-4' />}
              onClick={refresh}
            >
              تلاش مجدد
            </Button>
          </div>
        </section>
      ) : null}

      <section className='space-y-3'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {isLoading ? (
            <span className='text-xs font-semibold text-foreground-muted'>در حال بروزرسانی...</span>
          ) : null}
        </div>

        <AdminBlogPostsTable
          posts={posts}
          loading={isLoading}
          page={meta?.page ?? currentPage}
          pageSize={meta?.limit ?? BLOG_POSTS_PAGE_SIZE}
          totalItems={meta?.total ?? 0}
          onPageChange={(nextPage) => {
            updateUrl({
              page: nextPage,
            });
          }}
          onEdit={(post) => {
            router.push(`/admin/blog/posts/${post.id}`);
          }}
        />
      </section>
    </main>
  );
}
