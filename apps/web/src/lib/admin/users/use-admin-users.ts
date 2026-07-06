'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminUserApiError, getAdminUsers } from './admin-user.client';
import type { AdminUserListQuery, AdminUserListResponse } from './admin-user.types';

type UseAdminUsersOptions = {
  enabled?: boolean;
};

function normalizeQuery(query: AdminUserListQuery): AdminUserListQuery {
  return {
    q: query.q?.trim() || undefined,
    role: query.role,
    isActive: query.isActive,
    page: query.page ?? 1,
    limit: query.limit ?? 20,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof AdminUserApiError) {
    return error.message;
  }

  return 'دریافت کاربران با خطا مواجه شد';
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useAdminUsers(query: AdminUserListQuery, options: UseAdminUsersOptions = {}) {
  const { enabled = true } = options;

  const [result, setResult] = useState<AdminUserListResponse | null>(null);

  const [isLoading, setIsLoading] = useState(enabled);

  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const normalizedQuery = useMemo(
    () => normalizeQuery(query),
    [query.q, query.role, query.isActive, query.page, query.limit],
  );

  const load = useCallback(
    async (signal?: AbortSignal) => {
      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setError(null);

      try {
        const nextResult = await getAdminUsers(normalizedQuery, signal);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setResult(nextResult);
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
    },
    [normalizedQuery],
  );

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);

      return;
    }

    const controller = new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [enabled, load]);

  const refresh = useCallback(() => {
    return load();
  }, [load]);

  return {
    result,
    users: result?.data ?? [],
    meta: result?.meta ?? null,

    isLoading,
    error,

    refresh,
    clearError: () => setError(null),
  };
}
