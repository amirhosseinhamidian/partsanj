import 'server-only';

import type { StorefrontCategoryDetail } from '@/lib/storefront/catalog/catalog.types';
import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';

import { JsonLd } from './json-ld';

type CategoryStructuredDataProps = {
  category: StorefrontCategoryDetail;
  settings: StorefrontSiteSettings;
};

function getSiteOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return 'https://partsanj.ir';
  }
}

function toAbsoluteUrl(value: string | null | undefined, origin: string): string | undefined {
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

export function CategoryStructuredData({ category, settings }: CategoryStructuredDataProps) {
  const origin = getSiteOrigin(settings.siteBaseUrl);

  const defaultCategoryUrl = `${origin}/categories/${encodeURIComponent(category.slug)}`;

  const categoryUrl = toAbsoluteUrl(category.canonicalUrl, origin) ?? defaultCategoryUrl;

  const breadcrumbItems: Array<Record<string, unknown>> = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'خانه',
      item: `${origin}/`,
    },
  ];

  category.ancestors.forEach((ancestor, index) => {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: index + 2,
      name: ancestor.name,
      item: `${origin}/categories/${encodeURIComponent(ancestor.slug)}`,
    });
  });

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: category.name,
    item: categoryUrl,
  });

  const breadcrumbSchema: Record<string, unknown> = {
    '@type': 'BreadcrumbList',
    '@id': `${categoryUrl}#breadcrumb`,
    itemListElement: breadcrumbItems,
  };

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',

        '@graph': [breadcrumbSchema],
      }}
    />
  );
}
