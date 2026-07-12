'use client';

import type {
  AdminCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/lib/admin/catalog/category.types';
import { ClientApiError } from '@/lib/api/web-client';
import { adminCategoriesApi } from '@/lib/api/admin-categories-client';
import { CategoryFormSheet } from '@/components/admin/catalog/categories/category-form-sheet';
import { DeleteCategoryDialog } from '@/components/admin/catalog/categories/delete-category-dialog';
import { CategoriesTable } from '@/components/admin/catalog/categories/categories-table';
import { Button } from '@/components/ui/button';
import type { DataTableSort } from '@/components/ui/data-table';
import { FolderTree, Plus, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CategoriesFilterBar,
  type CategoryFiltersDraft,
} from '@/components/admin/catalog/categories/categories-filter-bar';
import { PageHeader } from '@/components/ui/page-header';

const PAGE_SIZE = 10;
const EMPTY_CATEGORY_FILTERS: CategoryFiltersDraft = {
  q: '',
  status: '',
};

function normalizeSearch(value: string): string {
  return value
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('fa-IR');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت اطلاعات دسته‌بندی‌ها با خطا مواجه شد';
}

function compareValues(
  first: string | number | boolean | Date,
  second: string | number | boolean | Date,
): number {
  const firstValue = first instanceof Date ? first.getTime() : first;
  const secondValue = second instanceof Date ? second.getTime() : second;

  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return firstValue - secondValue;
  }

  return String(firstValue).localeCompare(String(secondValue), 'fa-IR', {
    numeric: true,
    sensitivity: 'base',
  });
}

function sortCategories(categories: AdminCategory[], sort: DataTableSort | null): AdminCategory[] {
  if (!sort) {
    return categories;
  }

  const rows = [...categories];

  rows.sort((first, second) => {
    let result = 0;

    switch (sort.key) {
      case 'name':
        result = compareValues(first.name, second.name);
        break;

      case 'parent':
        result = compareValues(first.parent?.name ?? '', second.parent?.name ?? '');
        break;

      case 'sortOrder':
        result = compareValues(first.sortOrder, second.sortOrder);
        break;

      case 'status':
        result = compareValues(first.isActive, second.isActive);
        break;

      case 'updatedAt':
        result = compareValues(new Date(first.updatedAt), new Date(second.updatedAt));
        break;

      default:
        result = 0;
    }

    return sort.direction === 'asc' ? result : result * -1;
  });

  return rows;
}

export function CategoriesPageClient() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sort, setSort] = useState<DataTableSort | null>(null);
  const [page, setPage] = useState(1);

  const [draftFilters, setDraftFilters] = useState<CategoryFiltersDraft>(EMPTY_CATEGORY_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState<CategoryFiltersDraft>(EMPTY_CATEGORY_FILTERS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await adminCategoriesApi.list();
      setCategories(result);
    } catch (error) {
      if (error instanceof ClientApiError && (error.status === 401 || error.status === 403)) {
        window.location.assign('/admin/login');
        return;
      }

      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = normalizeSearch(appliedFilters.q);

    return categories.filter((category) => {
      const matchesStatus =
        appliedFilters.status === ''
          ? true
          : appliedFilters.status === 'ACTIVE'
            ? category.isActive
            : !category.isActive;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = normalizeSearch(
        [
          category.name,
          category.slug,
          category.parent?.name ?? '',
          category.parent?.slug ?? '',
        ].join(' '),
      );

      return searchableText.includes(normalizedQuery);
    });
  }, [appliedFilters, categories]);

  const sortedCategories = useMemo(
    () => sortCategories(filteredCategories, sort),
    [filteredCategories, sort],
  );

  const totalPages = Math.max(Math.ceil(sortedCategories.length / PAGE_SIZE), 1);

  const currentPage = Math.min(page, totalPages);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return sortedCategories.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, sortedCategories]);

  function applyFilters() {
    setAppliedFilters({
      ...draftFilters,
      q: draftFilters.q.trim(),
    });

    setPage(1);
  }

  function resetFilters() {
    setDraftFilters(EMPTY_CATEGORY_FILTERS);
    setAppliedFilters(EMPTY_CATEGORY_FILTERS);
    setPage(1);
  }

  function openCreateSheet() {
    setEditingCategory(null);
    setIsFormOpen(true);
  }

  function openEditSheet(category: AdminCategory) {
    setEditingCategory(category);
    setIsFormOpen(true);
  }

  function handleFormOpenChange(nextOpen: boolean) {
    setIsFormOpen(nextOpen);

    if (!nextOpen) {
      setEditingCategory(null);
    }
  }

  async function handleSaveCategory(payload: CreateCategoryPayload | UpdateCategoryPayload) {
    if (editingCategory) {
      await adminCategoriesApi.update(editingCategory.id, payload as UpdateCategoryPayload);
    } else {
      await adminCategoriesApi.create(payload as CreateCategoryPayload);
    }

    await loadCategories();
  }

  async function handleDeleteCategory(category: AdminCategory) {
    await adminCategoriesApi.remove(category.id);

    await loadCategories();

    setPage((currentPage) => {
      const remainingItems = Math.max(categories.length - 1, 0);
      const remainingPages = Math.max(Math.ceil(remainingItems / PAGE_SIZE), 1);

      return Math.min(currentPage, remainingPages);
    });
  }

  return (
    <div className='space-y-6'>
      {/* این بخش را بعداً با API واقعی PageHeader خودت جایگزین کن */}
      <PageHeader
        title='دسته‌بندی‌ها'
        description='ساختار دسته‌بندی قطعات و ترتیب نمایش آن‌ها را مدیریت کنید'
        icon={<FolderTree className='size-5 lg:size-8' />}
        addButtonLabel='افزودن دسته‌بندی'
        onAddClick={openCreateSheet}
      />

      {loadError ? (
        <div
          role='alert'
          className='flex flex-col gap-3 rounded-card border border-danger/30 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between'
        >
          <p className='text-sm font-semibold text-danger'>{loadError}</p>

          <Button
            variant='outline'
            size='sm'
            iconStart={<RefreshCw />}
            onClick={() => void loadCategories()}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : null}

      <CategoriesFilterBar
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
        onRefresh={() => void loadCategories()}
      />

      <CategoriesTable
        categories={paginatedCategories}
        loading={isLoading}
        sort={sort}
        onSortChange={(nextSort) => {
          setSort(nextSort);
          setPage(1);
        }}
        page={currentPage}
        pageSize={PAGE_SIZE}
        totalItems={sortedCategories.length}
        onPageChange={setPage}
        onCreate={openCreateSheet}
        onEdit={openEditSheet}
        onDelete={(category) => {
          setCategoryToDelete(category);
        }}
      />

      <CategoryFormSheet
        open={isFormOpen}
        onOpenChange={handleFormOpenChange}
        category={editingCategory}
        categories={categories}
        onSubmit={handleSaveCategory}
      />

      <DeleteCategoryDialog
        open={Boolean(categoryToDelete)}
        category={categoryToDelete}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setCategoryToDelete(null);
          }
        }}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
