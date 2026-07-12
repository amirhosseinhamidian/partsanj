'use client';

import { Button } from '@/components/ui/button';
import type {
  AdminBlogCategoryListItem,
  AdminBlogCategoryListQuery,
} from '@/lib/admin/blog/categories/admin-blog-category.types';
import { useAdminBlogCategories } from '@/lib/admin/blog/categories/use-admin-blog-categories';
import { CircleAlert, FolderTree, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AdminBlogCategoriesFilterBar,
  type AdminBlogCategoriesFiltersDraft,
} from './admin-blog-categories-filter-bar';
import { AdminBlogCategoriesTable } from './admin-blog-categories-table';
import { toPersianDigits } from '@/lib/utils/digits';
import { AdminBlogCategoryFormSheet } from './admin-blog-category-form-sheet';
import { PageHeader } from '@/components/ui/page-header';

const BLOG_CATEGORIES_PAGE_SIZE = 20;

type UrlPatch = {
  q?: string | null;
  isActive?: boolean | null;
  page?: number | null;
};

function parsePage(value: string | null) {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function parseIsActive(value: string | null) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function createFiltersDraft(input: {
  q: string;
  isActive?: boolean;
}): AdminBlogCategoriesFiltersDraft {
  return {
    q: input.q,
    isActive: input.isActive === undefined ? '' : (String(input.isActive) as 'true' | 'false'),
  };
}

export function AdminBlogCategoriesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const appliedQuery = searchParams.get('q') ?? '';
  const appliedIsActive = parseIsActive(searchParams.get('isActive'));
  const currentPage = parsePage(searchParams.get('page'));

  const query = useMemo<AdminBlogCategoryListQuery>(
    () => ({
      q: appliedQuery || undefined,
      isActive: appliedIsActive,
      page: currentPage,
      limit: BLOG_CATEGORIES_PAGE_SIZE,
    }),
    [appliedQuery, appliedIsActive, currentPage],
  );

  const { categories, meta, isLoading, error, refresh, clearError } = useAdminBlogCategories(query);

  const [categorySheetState, setCategorySheetState] = useState<{
    open: boolean;
    category: AdminBlogCategoryListItem | null;
  }>({
    open: false,
    category: null,
  });

  const handleCreateCategory = useCallback(() => {
    setCategorySheetState({
      open: true,
      category: null,
    });
  }, []);

  const handleOpenDetails = useCallback((category: AdminBlogCategoryListItem) => {
    setCategorySheetState({
      open: true,
      category,
    });
  }, []);

  const handleCloseCategorySheet = useCallback(() => {
    setCategorySheetState((current) => ({
      ...current,
      open: false,
    }));
  }, []);

  const [draftFilters, setDraftFilters] = useState<AdminBlogCategoriesFiltersDraft>(() =>
    createFiltersDraft({
      q: appliedQuery,
      isActive: appliedIsActive,
    }),
  );

  useEffect(() => {
    setDraftFilters(
      createFiltersDraft({
        q: appliedQuery,
        isActive: appliedIsActive,
      }),
    );
  }, [appliedQuery, appliedIsActive]);

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

      if ('isActive' in patch) {
        if (typeof patch.isActive === 'boolean') {
          nextParams.set('isActive', String(patch.isActive));
        } else {
          nextParams.delete('isActive');
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
      isActive: draftFilters.isActive === '' ? null : draftFilters.isActive === 'true',
      page: null,
    });
  }, [draftFilters, updateUrl]);

  const resetFilters = useCallback(() => {
    setDraftFilters({
      q: '',
      isActive: '',
    });

    updateUrl({
      q: null,
      isActive: null,
      page: null,
    });
  }, [updateUrl]);

  return (
    <>
      <main className='space-y-6'>
        <PageHeader
          title='دسته‌بندی‌های بلاگ'
          description='ساختار موضوعی مقالات، صفحات دسته‌بندی و تنظیمات SEO بلاگ را مدیریت کنید'
          icon={<FolderTree />}
          addButtonLabel='دسته‌بندی جدید'
          onAddClick={handleCreateCategory}
        />

        <AdminBlogCategoriesFilterBar
          draft={draftFilters}
          loading={isLoading}
          onDraftChange={(patch) => {
            setDraftFilters((current) => ({
              ...current,
              ...patch,
            }));
          }}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        {error ? (
          <section
            role='alert'
            className='flex flex-wrap items-center justify-between gap-4 rounded-card border border-danger/30 bg-danger-soft p-4'
          >
            <div className='flex items-start gap-3'>
              <CircleAlert className='mt-0.5 size-5 shrink-0 text-danger' />

              <div>
                <p className='font-bold text-danger'>دریافت دسته‌بندی‌های بلاگ ناموفق بود</p>

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
              <span className='text-xs font-semibold text-foreground-muted'>
                در حال بروزرسانی...
              </span>
            ) : null}
          </div>

          <AdminBlogCategoriesTable
            categories={categories}
            loading={isLoading}
            page={meta?.page ?? currentPage}
            pageSize={meta?.limit ?? BLOG_CATEGORIES_PAGE_SIZE}
            totalItems={meta?.total ?? 0}
            onPageChange={(nextPage) => {
              updateUrl({
                page: nextPage,
              });
            }}
            onOpenDetails={handleOpenDetails}
          />
        </section>
      </main>
      <AdminBlogCategoryFormSheet
        open={categorySheetState.open}
        category={categorySheetState.category}
        onClose={handleCloseCategorySheet}
        onSaved={() => {
          refresh();
        }}
      />
    </>
  );
}
