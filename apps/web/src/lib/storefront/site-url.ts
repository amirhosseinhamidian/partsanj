import 'server-only';

export const PUBLIC_SITE_NAME = 'پارت‌سنج';

function getConfiguredSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    'http://localhost:3000'
  );
}

export function getPublicSiteOrigin() {
  try {
    return new URL(getConfiguredSiteUrl()).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export function toAbsolutePublicUrl(valueOrPath: string) {
  const normalizedValue = valueOrPath.trim();

  try {
    if (/^https?:\/\//i.test(normalizedValue)) {
      return new URL(normalizedValue).toString();
    }

    return new URL(
      normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`,
      getPublicSiteOrigin(),
    ).toString();
  } catch {
    return getPublicSiteOrigin();
  }
}
