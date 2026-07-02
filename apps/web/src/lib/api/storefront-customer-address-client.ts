import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  CreateCustomerAddressInput,
  CustomerAddressApiResponse,
  StorefrontCustomerAddress,
  UpdateCustomerAddressInput,
} from '@/lib/storefront/customer-address/customer-address.types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export const storefrontCustomerAddressApi = {
  list() {
    return requestStorefrontApi<CustomerAddressApiResponse<StorefrontCustomerAddress[]>>(
      '/api/customer/addresses',
    );
  },

  create(input: CreateCustomerAddressInput) {
    return requestStorefrontApi<CustomerAddressApiResponse<StorefrontCustomerAddress>>(
      '/api/customer/addresses',
      {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      },
    );
  },

  update(addressId: string, input: UpdateCustomerAddressInput) {
    return requestStorefrontApi<CustomerAddressApiResponse<StorefrontCustomerAddress>>(
      `/api/customer/addresses/${encodeURIComponent(addressId)}`,
      {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      },
    );
  },

  setDefault(addressId: string) {
    return requestStorefrontApi<CustomerAddressApiResponse<StorefrontCustomerAddress>>(
      `/api/customer/addresses/${encodeURIComponent(addressId)}/default`,
      {
        method: 'POST',
      },
    );
  },

  archive(addressId: string) {
    return requestStorefrontApi<
      CustomerAddressApiResponse<{
        id: string;
      }>
    >(`/api/customer/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
    });
  },
};
