export type StorefrontCustomerAuthUser = {
  id: string;
  mobile: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
};

export type CustomerOtpRequestResult = {
  message: string;
  expiresAt: string;
  resendAvailableAt: string;
};

export type CustomerOtpVerifyResult = {
  user: StorefrontCustomerAuthUser;
  sessionScope: 'customer';
};

export type CustomerAuthApiResponse<T> = {
  data: T;
};
