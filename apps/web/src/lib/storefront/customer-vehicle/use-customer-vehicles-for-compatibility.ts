'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createCustomerVehicle,
  CustomerVehicleApiError,
  getCustomerVehicles,
} from './customer-vehicle.client';
import type { CustomerVehicle } from './customer-vehicle.types';
import type { StorefrontVehicleSelection } from '@/lib/storefront/vehicles/vehicle.types';

type AuthenticationState = 'loading' | 'authenticated' | 'guest' | 'unknown';

function getErrorMessage(error: unknown) {
  if (error instanceof CustomerVehicleApiError) {
    return error.message;
  }

  return 'عملیات خودرو با خطا مواجه شد';
}

export function useCustomerVehiclesForCompatibility() {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [authenticationState, setAuthenticationState] = useState<AuthenticationState>('loading');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getCustomerVehicles();

      setVehicles(result.data);
      setAuthenticationState('authenticated');
    } catch (caughtError) {
      if (caughtError instanceof CustomerVehicleApiError && caughtError.status === 401) {
        setVehicles([]);
        setAuthenticationState('guest');

        return;
      }

      setVehicles([]);
      setAuthenticationState('unknown');
      setError('دریافت خودروهای ذخیره‌شده انجام نشد');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSelectedVehicle = useCallback(
    async (selection: StorefrontVehicleSelection) => {
      if (authenticationState !== 'authenticated') {
        return false;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        await createCustomerVehicle({
          vehicleVariantId: selection.variant.id,
        });

        await refresh();

        return true;
      } catch (caughtError) {
        if (caughtError instanceof CustomerVehicleApiError && caughtError.status === 409) {
          await refresh();

          return true;
        }

        setSaveError(getErrorMessage(caughtError));

        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [authenticationState, refresh],
  );

  return {
    vehicles,
    isLoading,
    error,

    isAuthenticated: authenticationState === 'authenticated',

    isSavingSelectedVehicle: isSaving,
    saveSelectedVehicleError: saveError,

    refresh,
    saveSelectedVehicle,
  };
}
