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

function getSchemaAvailability(product: StorefrontProductDetail): string | undefined {
  if (product.stockStatus === 'IN_STOCK' && product.stockQuantity > 0) {
    return 'https://schema.org/InStock';
  }

  if (
    product.stockStatus === 'OUT_OF_STOCK' ||
    (product.stockStatus === 'IN_STOCK' && product.stockQuantity <= 0)
  ) {
    return 'https://schema.org/OutOfStock';
  }

  /*
   * CHECK_AVAILABILITY
   *
   * موجودی واقعاً مشخص نیست؛
   * پس اطلاعات اشتباه به Google نمی‌دهیم.
   */
  return undefined;
}

function toIsoDateTime(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function ProductStructuredData({ product, settings }: ProductStructuredDataProps) {
  const origin = getSiteOrigin(settings.siteBaseUrl);

  const productUrl = `${origin}/products/${encodeURIComponent(product.slug)}`;

  const categoryUrl = `${origin}/categories/${encodeURIComponent(product.category.slug)}`;

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
    effectivePriceToman > 0;

  const schemaAvailability = getSchemaAvailability(product);

  const saleValidFrom = product.isSaleActive ? toIsoDateTime(product.saleStartsAt) : undefined;

  const saleValidThrough = product.isSaleActive ? toIsoDateTime(product.saleEndsAt) : undefined;

  const productSchema: Record<string, unknown> = {
    '@type': 'Product',
    '@id': productId,

    name: product.name,
    description,

    sku: product.sku,

    url: productUrl,

    category: product.category.name,

    ...(images.length > 0
      ? {
          image: images,
        }
      : {}),

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

            itemCondition: 'https://schema.org/NewCondition',

            seller: {
              '@id': organizationId,
            },

            ...(schemaAvailability
              ? {
                  availability: schemaAvailability,
                }
              : {}),

            ...(saleValidFrom
              ? {
                  validFrom: saleValidFrom,
                }
              : {}),

            ...(saleValidThrough
              ? {
                  validThrough: saleValidThrough,
                }
              : {}),
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

        name: product.category.name,

        item: categoryUrl,
      },

      {
        '@type': 'ListItem',

        position: 4,

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
