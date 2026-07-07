'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminBlogCategoryApiError, getAdminBlogCategories } from './admin-blog-category.client';
import type {
  AdminBlogCategoriesResponse,
  AdminBlogCategoryListQuery,
} from './admin-blog-category.types';

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function getErrorMessage(error: unknown) {
  if (error instanceof AdminBlogCategoryApiError) {
    return error.message;
  }

  return 'دریافت دسته‌بندی‌های بلاگ با خطا مواجه شد';
}

function normalizeQuery(
  query: AdminBlogCategoryListQuery,
): Required<Pick<AdminBlogCategoryListQuery, 'page' | 'limit'>> &
  Omit<AdminBlogCategoryListQuery, 'page' | 'limit'> {
  return {
    q: query.q?.trim() || undefined,
    isActive: query.isActive,
    page: query.page ?? 1,
    limit: query.limit ?? 20,
  };
}

export function useAdminBlogCategories(query: AdminBlogCategoryListQuery) {
  const [result, setResult] = useState<AdminBlogCategoriesResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [refreshVersion, setRefreshVersion] = useState(0);

  const requestIdRef = useRef(0);

  const requestQuery = useMemo(
    () => normalizeQuery(query),
    [query.q, query.isActive, query.page, query.limit],
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function loadCategories() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getAdminBlogCategories(requestQuery, controller.signal);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResult(response);
      } catch (caughtError) {
        if (isAbortError(caughtError) || requestId !== requestIdRef.current) {
          return;
        }

        setError(getErrorMessage(caughtError));
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, [requestQuery, refreshVersion]);

  const refresh = useCallback(() => {
    setRefreshVersion((current) => current + 1);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    result,

    categories: result?.data ?? [],
    meta: result?.meta ?? null,

    isLoading,
    error,

    refresh,
    clearError,
  };
}
