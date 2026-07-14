import 'server-only';

import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';

import { JsonLd } from './json-ld';

type StorefrontStructuredDataProps = {
  settings: StorefrontSiteSettings;
};

function getSiteOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return 'https://partsanj.com';
  }
}

function toAbsoluteUrl(
  value: string | null | undefined,
  origin: string,
): string | undefined {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  try {
    return new URL(normalizedValue, `${origin}/`).toString();
  } catch {
    return undefined;
  }
}

function compactUrls(values: Array<string | null | undefined>): string[] {
  return values.flatMap((value) => {
    const normalizedValue = value?.trim();
    return normalizedValue ? [normalizedValue] : [];
  });
}

export function StorefrontStructuredData({
  settings,
}: StorefrontStructuredDataProps) {
  const origin = getSiteOrigin(settings.siteBaseUrl);
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const siteName = settings.siteName?.trim() || 'پارت‌سنج';
  const description =
    settings.defaultSeoDescription?.trim() ||
    settings.siteTagline?.trim() ||
    'فروشگاه تخصصی قطعات یدکی خودرو';

  const logoUrl = toAbsoluteUrl(
    settings.logoLightUrl || settings.logoDarkUrl,
    origin,
  );

  const telephone =
    settings.supportPhone?.trim() || settings.supportMobile?.trim() || undefined;

  const sameAs = compactUrls([
    settings.instagramUrl,
    settings.telegramUrl,
    settings.baleUrl,
  ]);

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': organizationId,
    name: siteName,
    alternateName: 'PartSanj',
    url: `${origin}/`,
    description,
    ...(logoUrl
      ? {
          logo: {
            '@type': 'ImageObject',
            url: logoUrl,
          },
        }
      : {}),
    ...(telephone
      ? {
          telephone,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone,
            contactType: 'customer service',
            availableLanguage: ['fa'],
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: `${origin}/`,
    name: siteName,
    description,
    inLanguage: 'fa-IR',
    publisher: {
      '@id': organizationId,
    },
  };

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [organization, website],
      }}
    />
  );
}
