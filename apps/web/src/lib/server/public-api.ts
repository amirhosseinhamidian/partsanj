import 'server-only';

import { nestApi } from '@/lib/api/nest-api';

export const PUBLIC_CATALOG_API_PATH = '/api/v1/catalog';
export const PUBLIC_VEHICLES_API_PATH = '/api/v1/vehicles';

export async function publicNestApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  return nestApi<T>(path, init);
}
