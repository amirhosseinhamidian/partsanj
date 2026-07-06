'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createCustomerVehicle,
  CustomerVehicleApiError,
  deleteCustomerVehicle,
  getCustomerVehicles,
  setDefaultCustomerVehicle,
  updateCustomerVehicle,
} from './customer-vehicle.client';
import type {
  CreateCustomerVehicleInput,
  CustomerVehicle,
  UpdateCustomerVehicleInput,
} from './customer-vehicle.types';

type PendingAction = 'create' | 'update' | 'set-default' | 'delete' | null;

function getErrorMessage(error: unknown) {
  if (error instanceof CustomerVehicleApiError) {
    return error.message;
  }

  return 'عملیات خودرو با خطا مواجه شد';
}

export function useCustomerVehicles() {
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [pendingVehicleId, setPendingVehicleId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getCustomerVehicles();

      setVehicles(result.data);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CreateCustomerVehicleInput) => {
      setPendingAction('create');
      setPendingVehicleId(null);
      setError(null);

      try {
        await createCustomerVehicle(input);
        await refresh();

        return true;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));

        return false;
      } finally {
        setPendingAction(null);
      }
    },
    [refresh],
  );

  const update = useCallback(
    async (customerVehicleId: string, input: UpdateCustomerVehicleInput) => {
      setPendingAction('update');
      setPendingVehicleId(customerVehicleId);
      setError(null);

      try {
        await updateCustomerVehicle(customerVehicleId, input);

        await refresh();

        return true;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));

        return false;
      } finally {
        setPendingAction(null);
        setPendingVehicleId(null);
      }
    },
    [refresh],
  );

  const setDefault = useCallback(
    async (customerVehicleId: string) => {
      setPendingAction('set-default');
      setPendingVehicleId(customerVehicleId);
      setError(null);

      try {
        await setDefaultCustomerVehicle(customerVehicleId);

        await refresh();

        return true;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));

        return false;
      } finally {
        setPendingAction(null);
        setPendingVehicleId(null);
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (customerVehicleId: string) => {
      setPendingAction('delete');
      setPendingVehicleId(customerVehicleId);
      setError(null);

      try {
        await deleteCustomerVehicle(customerVehicleId);

        await refresh();

        return true;
      } catch (caughtError) {
        setError(getErrorMessage(caughtError));

        return false;
      } finally {
        setPendingAction(null);
        setPendingVehicleId(null);
      }
    },
    [refresh],
  );

  return {
    vehicles,
    error,
    isLoading,
    pendingAction,
    pendingVehicleId,

    refresh,
    create,
    update,
    setDefault,
    remove,

    clearError: () => setError(null),
  };
}
