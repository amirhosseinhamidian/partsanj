import { getCurrentUserWithToken } from '@/lib/auth/auth-contract';
import { getAccessToken } from '@/lib/auth/session';

export async function getCurrentCustomer() {
  const accessToken = await getAccessToken('customer');

  if (!accessToken) {
    return null;
  }

  try {
    return await getCurrentUserWithToken(accessToken);
  } catch {
    return null;
  }
}
