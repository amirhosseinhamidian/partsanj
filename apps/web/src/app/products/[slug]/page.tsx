import type { Metadata } from 'next';

import { StorefrontProductDetailPageClient } from '@/components/storefront/catalog/storefront-product-detail-page-client';
import { publicNestApi } from '@/lib/server/public-nest-api';
import type { StorefrontProductResponse } from '@/lib/storefront/catalog/catalog.types';
import { ProductStructuredData } from '@/lib/storefront/seo/product-structured-data';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProduct(slug: string) {
  try {
    const response = await publicNestApi<StorefrontProductResponse>(
      `/api/v1/catalog/products/${encodeURIComponent(slug)}`,
      {
        method: 'GET',
        next: {
          revalidate: 300,
          tags: [`product:${slug}`],
        },
      },
    );

    return response.data;
  } catch {
    return null;
  }
}

function toAbsoluteUrl(
  value: string | null | undefined,
  baseUrl: string,
): string | undefined {
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

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug),
    getStorefrontSiteSettings(),
  ]);

  const siteName = settings.siteName || 'پارت‌سنج';

  if (!product) {
    return {
      title: {
        absolute: `محصول پیدا نشد | ${siteName}`,
      },
      description: 'محصول موردنظر پیدا نشد یا در دسترس نیست.',
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    };
  }

  const title = product.seoTitle?.trim() || `${product.name} | ${siteName}`;
  const description =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    `مشاهده مشخصات و خرید ${product.name} در ${siteName} با امکان بررسی سازگاری قطعه با خودرو.`;
  const shouldNoIndex = settings.noIndexSite || product.noIndex;
  const canonicalPath = product.canonicalUrl?.trim() || `/products/${product.slug}`;
  const canonicalUrl = toAbsoluteUrl(canonicalPath, settings.siteBaseUrl);
  const openGraphImageSource =
    product.openGraphImageUrl ||
    product.images[0]?.url ||
    settings.defaultOgImageUrl;
  const openGraphImageUrl = toAbsoluteUrl(
    openGraphImageSource,
    settings.siteBaseUrl,
  );
  const openGraphTitle = product.openGraphTitle?.trim() || title;
  const openGraphDescription =
    product.openGraphDescription?.trim() || description;
  const openGraphImageAlt =
    product.openGraphImageAlt?.trim() ||
    product.images[0]?.alt?.trim() ||
    product.name;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    robots: {
      index: !shouldNoIndex,
      follow: !shouldNoIndex,
      googleBot: {
        index: !shouldNoIndex,
        follow: !shouldNoIndex,
        ...(!shouldNoIndex
          ? {
              'max-image-preview': 'large',
              'max-snippet': -1,
              'max-video-preview': -1,
            }
          : {}),
      },
    },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName,
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonicalUrl,
      images: openGraphImageUrl
        ? [
            {
              url: openGraphImageUrl,
              alt: openGraphImageAlt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: openGraphImageUrl ? 'summary_large_image' : 'summary',
      title: openGraphTitle,
      description: openGraphDescription,
      images: openGraphImageUrl ? [openGraphImageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProduct(slug),
    getStorefrontSiteSettings(),
  ]);

  return (
    <>
      {product && !product.noIndex && !settings.noIndexSite ? (
        <ProductStructuredData product={product} settings={settings} />
      ) : null}

      <StorefrontProductDetailPageClient slug={slug}/>
    </>
  );
}
