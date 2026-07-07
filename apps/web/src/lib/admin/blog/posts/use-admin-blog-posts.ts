'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminBlogPostApiError, getAdminBlogPosts } from './admin-blog-post.client';
import type { AdminBlogPostListQuery, AdminBlogPostsResponse } from './admin-blog-post.types';

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function getErrorMessage(error: unknown) {
  if (error instanceof AdminBlogPostApiError) {
    return error.message;
  }

  return 'دریافت مقالات بلاگ با خطا مواجه شد';
}

function normalizeQuery(
  query: AdminBlogPostListQuery,
): Required<Pick<AdminBlogPostListQuery, 'page' | 'limit'>> &
  Omit<AdminBlogPostListQuery, 'page' | 'limit'> {
  return {
    q: query.q?.trim() || undefined,
    status: query.status,
    categoryId: query.categoryId || undefined,
    page: query.page ?? 1,
    limit: query.limit ?? 20,
  };
}

export function useAdminBlogPosts(query: AdminBlogPostListQuery) {
  const [result, setResult] = useState<AdminBlogPostsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [refreshVersion, setRefreshVersion] = useState(0);

  const requestIdRef = useRef(0);

  const requestQuery = useMemo(
    () => normalizeQuery(query),
    [query.q, query.status, query.categoryId, query.page, query.limit],
  );

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function loadPosts() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getAdminBlogPosts(requestQuery, controller.signal);

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

    void loadPosts();

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

    posts: result?.data ?? [],
    meta: result?.meta ?? null,

    isLoading,
    error,

    refresh,
    clearError,
  };
}
