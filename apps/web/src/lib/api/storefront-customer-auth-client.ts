import { requestStorefrontApi } from '@/lib/api/storefront-web-client';
import type {
  CustomerAuthApiResponse,
  CustomerOtpRequestResult,
  CustomerOtpVerifyResult,
  StorefrontCustomerAuthUser,
} from '@/lib/storefront/customer-auth/customer-auth.types';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export const storefrontCustomerAuthApi = {
  getMe() {
    return requestStorefrontApi<CustomerAuthApiResponse<StorefrontCustomerAuthUser | null>>(
      '/api/auth/me',
    );
  },

  requestOtp(mobile: string) {
    return requestStorefrontApi<CustomerAuthApiResponse<CustomerOtpRequestResult>>(
      '/api/auth/request-otp',
      {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          mobile,
        }),
      },
    );
  },

  verifyOtp(mobile: string, code: string) {
    return requestStorefrontApi<CustomerAuthApiResponse<CustomerOtpVerifyResult>>(
      '/api/auth/verify-otp',
      {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          mobile,
          code,
          sessionScope: 'customer',
        }),
      },
    );
  },

  logout() {
    return requestStorefrontApi<
      CustomerAuthApiResponse<{
        success: boolean;
      }>
    >('/api/auth/logout', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        sessionScope: 'customer',
      }),
    });
  },
};
