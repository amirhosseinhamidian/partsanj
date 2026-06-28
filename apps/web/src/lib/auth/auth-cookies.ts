export const AUTH_SCOPES = ['admin', 'customer'] as const;

export type AuthScope = (typeof AUTH_SCOPES)[number];

export const AUTH_COOKIE_NAMES: Record<
  AuthScope,
  {
    access: string;
    refresh: string;
  }
> = {
  admin: {
    access: 'partsanj_admin_access_token',
    refresh: 'partsanj_admin_refresh_token',
  },
  customer: {
    access: 'partsanj_customer_access_token',
    refresh: 'partsanj_customer_refresh_token',
  },
};

export function isAuthScope(value: unknown): value is AuthScope {
  return typeof value === 'string' && AUTH_SCOPES.some((scope) => scope === value);
}
