import type {
  CreateCustomerVehicleInput,
  CustomerVehicleResponse,
  CustomerVehiclesResponse,
  DeleteCustomerVehicleResponse,
  UpdateCustomerVehicleInput,
} from './customer-vehicle.types';

const CUSTOMER_VEHICLES_PROXY_PATH = '/api/customer/vehicles';

type ApiErrorPayload = {
  message?: string | string[];
  code?: string;
};

export class CustomerVehicleApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);

    this.name = 'CustomerVehicleApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (response.ok) {
    return payload as T;
  }

  const errorPayload = payload as ApiErrorPayload | null;

  const message = Array.isArray(errorPayload?.message)
    ? errorPayload.message.join(' ، ')
    : (errorPayload?.message ?? 'عملیات خودرو با خطا مواجه شد');

  throw new CustomerVehicleApiError(message, response.status, errorPayload?.code);
}

async function customerVehicleRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
  });

  return parseResponse<T>(response);
}

export function getCustomerVehicles() {
  return customerVehicleRequest<CustomerVehiclesResponse>(CUSTOMER_VEHICLES_PROXY_PATH);
}

export function createCustomerVehicle(input: CreateCustomerVehicleInput) {
  return customerVehicleRequest<CustomerVehicleResponse>(CUSTOMER_VEHICLES_PROXY_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateCustomerVehicle(
  customerVehicleId: string,
  input: UpdateCustomerVehicleInput,
) {
  return customerVehicleRequest<CustomerVehicleResponse>(
    `${CUSTOMER_VEHICLES_PROXY_PATH}/${encodeURIComponent(customerVehicleId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

export function setDefaultCustomerVehicle(customerVehicleId: string) {
  return customerVehicleRequest<CustomerVehicleResponse>(
    `${CUSTOMER_VEHICLES_PROXY_PATH}/${encodeURIComponent(customerVehicleId)}/default`,
    {
      method: 'POST',
    },
  );
}

export function deleteCustomerVehicle(customerVehicleId: string) {
  return customerVehicleRequest<DeleteCustomerVehicleResponse>(
    `${CUSTOMER_VEHICLES_PROXY_PATH}/${encodeURIComponent(customerVehicleId)}`,
    {
      method: 'DELETE',
    },
  );
}
