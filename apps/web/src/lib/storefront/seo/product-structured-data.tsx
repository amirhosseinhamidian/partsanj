import 'server-only';

import type { StorefrontProductDetail } from '@/lib/storefront/catalog/catalog.types';
import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';

import { JsonLd } from './json-ld';

type ProductStructuredDataProps = {
  product: StorefrontProductDetail;
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

function getSchemaAvailability(
  stockStatus: StorefrontProductDetail['stockStatus'],
): string {
  if (stockStatus === 'IN_STOCK') {
    return 'https://schema.org/InStock';
  }

  return 'https://schema.org/OutOfStock';
}

export function ProductStructuredData({
  product,
  settings,
}: ProductStructuredDataProps) {
  const origin = getSiteOrigin(settings.siteBaseUrl);
  const productUrl = `${origin}/products/${encodeURIComponent(product.slug)}`;
  const organizationId = `${origin}/#organization`;
  const productId = `${productUrl}#product`;
  const siteName = settings.siteName?.trim() || 'پارت‌سنج';

  const images = product.images.flatMap((image) => {
    const absoluteUrl = toAbsoluteUrl(image.url, origin);
    return absoluteUrl ? [absoluteUrl] : [];
  });

  const description =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    product.description?.trim() ||
    `مشخصات و خرید ${product.name} از ${siteName}`;

  const effectivePriceToman = product.effectivePriceToman;
  const canPublishOffer =
    settings.showPrices &&
    effectivePriceToman !== null &&
    Number.isFinite(effectivePriceToman) &&
    effectivePriceToman >= 0;

  const productSchema: Record<string, unknown> = {
    '@type': 'Product',
    '@id': productId,
    name: product.name,
    description,
    sku: product.sku,
    url: productUrl,
    category: product.category.name,
    ...(images.length > 0 ? { image: images } : {}),
    brand: {
      '@type': 'Brand',
      name: product.brand.name,
    },
    ...(canPublishOffer
      ? {
          offers: {
            '@type': 'Offer',
            url: productUrl,
            priceCurrency: 'IRR',
            price: String(effectivePriceToman * 10),
            availability: getSchemaAvailability(product.stockStatus),
            itemCondition: 'https://schema.org/NewCondition',
            seller: {
              '@id': organizationId,
            },
          },
        }
      : {}),
  };

  const breadcrumbSchema: Record<string, unknown> = {
    '@type': 'BreadcrumbList',
    '@id': `${productUrl}#breadcrumb`,
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
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [productSchema, breadcrumbSchema],
      }}
    />
  );
}
