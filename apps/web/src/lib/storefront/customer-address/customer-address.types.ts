export type StorefrontCustomerAddress = {
  id: string;
  label: string;

  recipientFirstName: string;
  recipientLastName: string;
  recipientMobile: string;

  province: string;
  city: string;
  district: string | null;

  addressLine: string;
  postalCode: string;

  plaque: string | null;
  floor: string | null;
  unit: string | null;

  deliveryNotes: string | null;

  isDefault: boolean;

  createdAt: string;
  updatedAt: string;
};

export type CustomerAddressBaseInput = {
  label: string;

  recipientFirstName: string;
  recipientLastName: string;
  recipientMobile: string;

  province: string;
  city: string;
  district?: string | null;

  addressLine: string;
  postalCode: string;

  plaque?: string | null;
  floor?: string | null;
  unit?: string | null;

  deliveryNotes?: string | null;
};

export type CreateCustomerAddressInput = CustomerAddressBaseInput & {
  isDefault?: boolean;
};

export type UpdateCustomerAddressInput = Partial<CustomerAddressBaseInput>;

export type CustomerAddressApiResponse<T> = {
  data: T;
};
