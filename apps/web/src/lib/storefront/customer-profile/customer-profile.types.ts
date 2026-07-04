export type StorefrontCustomerProfile = {
  id: string;
  mobile: string;
  firstName: string | null;
  lastName: string | null;
  mobileVerifiedAt: string | null;
  createdAt: string;
};

export type CustomerProfileResponse = {
  data: StorefrontCustomerProfile;
};

export type UpdateCustomerProfileInput = {
  firstName: string;
  lastName: string;
};
