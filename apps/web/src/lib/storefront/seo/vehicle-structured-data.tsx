import 'server-only';

import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';
import type { StorefrontVehicleModelDetail } from '@/lib/storefront/vehicles/vehicle.types';

import { JsonLd } from './json-ld';

type VehicleStructuredDataProps = {
  model: StorefrontVehicleModelDetail;
  settings: StorefrontSiteSettings;
  page?: number;
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

function getVehicleDisplayName(model: StorefrontVehicleModelDetail): string {
  const makeName = model.make.name.trim();

  const modelName = model.name.trim();

  if (modelName.toLowerCase().startsWith(makeName.toLowerCase())) {
    return modelName;
  }

  return `${makeName} ${modelName}`;
}

function getVehiclePageUrl({
  model,
  origin,
  page,
}: {
  model: StorefrontVehicleModelDetail;
  origin: string;
  page: number;
}): string {
  const defaultUrl = `${origin}/vehicles/${encodeURIComponent(model.slug)}`;

  const baseUrl = toAbsoluteUrl(model.canonicalUrl, origin) ?? defaultUrl;

  if (page <= 1) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);

    url.searchParams.set('page', String(page));

    return url.toString();
  } catch {
    return `${defaultUrl}?page=${page}`;
  }
}

export function VehicleStructuredData({ model, settings, page = 1 }: VehicleStructuredDataProps) {
  const origin = getSiteOrigin(settings.siteBaseUrl);

  const websiteId = `${origin}/#website`;

  const vehicleName = getVehicleDisplayName(model);

  const pageUrl = getVehiclePageUrl({
    model,
    origin,
    page,
  });

  const pageId = `${pageUrl}#collection`;

  const breadcrumbId = `${pageUrl}#breadcrumb`;

  const imageUrl = toAbsoluteUrl(model.imageUrl, origin);

  const description =
    model.seoDescription?.trim() ||
    model.description?.trim() ||
    `لوازم یدکی و قطعات سازگار با ${vehicleName} در پارت‌سنج`;

  const breadcrumbSchema: Record<string, unknown> = {
    '@type': 'BreadcrumbList',

    '@id': breadcrumbId,

    itemListElement: [
      {
        '@type': 'ListItem',

        position: 1,

        name: 'خانه',

        item: `${origin}/`,
      },

      {
        '@type': 'ListItem',

        position: 2,

        name: 'قطعات خودرو',

        item: `${origin}/products`,
      },

      {
        '@type': 'ListItem',

        position: 3,

        name: vehicleName,

        item: pageUrl,
      },
    ],
  };

  const collectionPage: Record<string, unknown> = {
    '@type': 'CollectionPage',

    '@id': pageId,

    url: pageUrl,

    name: model.seoTitle?.trim() || `لوازم یدکی ${vehicleName}`,

    description,

    inLanguage: 'fa-IR',

    isPartOf: {
      '@id': websiteId,
    },

    breadcrumb: {
      '@id': breadcrumbId,
    },

    ...(imageUrl
      ? {
          image: {
            '@type': 'ImageObject',

            url: imageUrl,

            caption: model.imageAlt?.trim() || `تصویر ${vehicleName}`,
          },
        }
      : {}),
  };

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',

        '@graph': [collectionPage, breadcrumbSchema],
      }}
    />
  );
}
