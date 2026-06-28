import { getCurrentUserWithToken, isAdminUser } from '@/lib/auth/auth-contract';
import { getAccessToken } from '@/lib/auth/session';

export async function getCurrentAdmin() {
  const accessToken = await getAccessToken('admin');

  if (!accessToken) {
    return null;
  }

  try {
    const user = await getCurrentUserWithToken(accessToken);

    return isAdminUser(user) ? user : null;
  } catch {
    return null;
  }
}
