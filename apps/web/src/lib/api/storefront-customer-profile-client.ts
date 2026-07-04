import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  CustomerProfileResponse,
  UpdateCustomerProfileInput,
} from '@/lib/storefront/customer-profile/customer-profile.types';

export const storefrontCustomerProfileApi = {
  get() {
    return requestStorefrontApi<CustomerProfileResponse>('/api/customer/profile');
  },

  update(input: UpdateCustomerProfileInput) {
    return requestStorefrontApi<CustomerProfileResponse>('/api/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};
