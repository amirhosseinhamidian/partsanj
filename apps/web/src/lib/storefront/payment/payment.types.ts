export type StorefrontPaymentProviderCode = 'ZARINPAL';

export type StorefrontPaymentStartResult = {
  attemptId: string;
  providerCode: StorefrontPaymentProviderCode;
  redirectUrl: string;
};

export type PaymentApiResponse<T> = {
  data: T;
};
