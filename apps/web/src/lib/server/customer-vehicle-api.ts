import { createCustomerProfileProxyResponse, customerProfileNestApi } from './customer-profile-api';

export const CUSTOMER_VEHICLES_API_PATH = '/api/v1/customer/vehicles';

export function customerVehicleApiPath(customerVehicleId: string) {
  return `${CUSTOMER_VEHICLES_API_PATH}/${encodeURIComponent(customerVehicleId)}`;
}

export function customerVehicleDefaultApiPath(customerVehicleId: string) {
  return `${customerVehicleApiPath(customerVehicleId)}/default`;
}

/**
 * این wrapper فعلاً عمداً از همان مکانیزم احراز هویت،
 * ارسال Cookie/JWT و مدیریت Response پروفایل استفاده می‌کند
 */
export const customerVehicleNestApi = customerProfileNestApi;

export const createCustomerVehicleProxyResponse = createCustomerProfileProxyResponse;
