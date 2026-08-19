import type { StorefrontProductDetail } from '@/lib/storefront/catalog/catalog.types';

import type { StorefrontProductReviewsResponse } from '@/lib/storefront/interactions/product-interaction.types';

import type { StorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.types';

type ProductStructuredDataProps = {
  product: StorefrontProductDetail;

  settings: StorefrontSiteSettings;

  reviews?: StorefrontProductReviewsResponse | null;
};

function toAbsoluteUrl(value: string | null | undefined, baseUrl: string): string | undefined {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  try {
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    return new URL(normalizedValue, normalizedBaseUrl).toString();
  } catch {
    return undefined;
  }
}

function getAvailability(stockStatus: StorefrontProductDetail['stockStatus']) {
  switch (stockStatus) {
    case 'IN_STOCK':
      return 'https://schema.org/InStock';

    case 'OUT_OF_STOCK':
      return 'https://schema.org/OutOfStock';

    case 'CHECK_AVAILABILITY':
    default:
      return 'https://schema.org/LimitedAvailability';
  }
}

function serializeJsonLd(value: unknown) {
  /*
   * جلوگیری از بسته‌شدن ناخواسته script
   * در صورت وجود "<" داخل داده‌های متنی.
   */
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function ProductStructuredData({ product, settings, reviews }: ProductStructuredDataProps) {
  const productUrl =
    toAbsoluteUrl(product.canonicalUrl || `/products/${product.slug}`, settings.siteBaseUrl) ??
    `${settings.siteBaseUrl.replace(/\/+$/, '')}/products/${encodeURIComponent(product.slug)}`;

  const images = product.images
    .map((image) => toAbsoluteUrl(image.url, settings.siteBaseUrl))
    .filter((value): value is string => Boolean(value));

  const description =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    `${product.name} برند ${product.brand.name}`;

  /*
   * قیمت‌های دیتابیس پارت‌سنج بر حسب تومان هستند.
   * Structured Data از IRR استفاده می‌کند،
   * بنابراین تومان × 10 می‌شود.
   */
  const effectivePriceToman = product.effectivePriceToman;

  const canExposeOffer =
    settings.storeEnabled &&
    settings.orderingEnabled &&
    settings.showPrices &&
    effectivePriceToman !== null &&
    effectivePriceToman > 0;

  const offer = canExposeOffer
    ? {
        '@type': 'Offer',

        url: productUrl,

        priceCurrency: 'IRR',

        price: effectivePriceToman * 10,

        availability: getAvailability(product.stockStatus),

        itemCondition: 'https://schema.org/NewCondition',

        seller: {
          '@type': 'Organization',

          name: settings.siteName || 'پارت‌سنج',
        },
      }
    : undefined;

  const ratingSummary = reviews?.data.enabled ? reviews.data.summary : null;

  const canExposeAggregateRating = Boolean(
    ratingSummary &&
    ratingSummary.ratingsCount > 0 &&
    ratingSummary.averageRating >= 1 &&
    ratingSummary.averageRating <= 5,
  );

  const aggregateRating =
    canExposeAggregateRating && ratingSummary
      ? {
          '@type': 'AggregateRating',

          ratingValue: ratingSummary.averageRating,

          ratingCount: ratingSummary.ratingsCount,

          bestRating: 5,

          worstRating: 1,
        }
      : undefined;

  const structuredData = {
    '@context': 'https://schema.org',

    '@type': 'Product',

    '@id': `${productUrl}#product`,

    url: productUrl,

    name: product.name,

    sku: product.sku,

    description,

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

    ...(offer
      ? {
          offers: offer,
        }
      : {}),

    ...(aggregateRating
      ? {
          aggregateRating,
        }
      : {}),
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(structuredData),
      }}
    />
  );
}
