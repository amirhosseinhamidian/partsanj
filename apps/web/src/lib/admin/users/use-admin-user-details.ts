'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminUserApiError, getAdminUser, updateAdminUser } from './admin-user.client';
import type { AdminUserDetail, UpdateAdminUserInput } from './admin-user.types';

function getErrorMessage(error: unknown) {
  if (error instanceof AdminUserApiError) {
    return error.message;
  }

  return 'دریافت اطلاعات کاربر با خطا مواجه شد';
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useAdminUserDetails(userId: string | null) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setUser(null);
        setIsLoading(false);
        setError(null);

        return;
      }

      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setError(null);
      setSaveError(null);
      setUser(null);

      try {
        const result = await getAdminUser(userId, signal);

        if (requestId !== requestIdRef.current) {
          return;
        }

        setUser(result.data);
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
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  const save = useCallback(
    async (input: UpdateAdminUserInput) => {
      if (!userId) {
        return null;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        const result = await updateAdminUser(userId, input);

        setUser(result.data);

        return result.data;
      } catch (caughtError) {
        setSaveError(getErrorMessage(caughtError));

        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [userId],
  );

  return {
    user,
    isLoading,
    isSaving,
    error,
    saveError,

    refresh: () => load(),
    save,

    clearError: () => setError(null),
    clearSaveError: () => setSaveError(null),
  };
}
