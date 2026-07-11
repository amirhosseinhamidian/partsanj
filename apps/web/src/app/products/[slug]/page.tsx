import type { Metadata } from 'next';

import { StorefrontProductDetailPageClient } from '@/components/storefront/catalog/storefront-product-detail-page-client';
import { publicNestApi } from '@/lib/server/public-nest-api';
import type { StorefrontProductResponse } from '@/lib/storefront/catalog/catalog.types';

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProductForMetadata(slug: string) {
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

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductForMetadata(slug);

  if (!product) {
    return {
      title: 'محصول پیدا نشد | پارت‌سنج',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = product.seoTitle || `${product.name} | پارت‌سنج`;
  const description =
    product.seoDescription ||
    product.shortDescription ||
    `مشاهده و خرید ${product.name} در پارت‌سنج با بررسی سازگاری خودرو.`;

  const ogTitle = product.openGraphTitle || title;
  const ogDescription = product.openGraphDescription || description;
  const ogImage = product.openGraphImageUrl || product.images[0]?.url || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: product.canonicalUrl || `/products/${product.slug}`,
    },
    robots: {
      index: !product.noIndex,
      follow: !product.noIndex,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      url: product.canonicalUrl || `/products/${product.slug}`,
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: product.openGraphImageAlt || product.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  return <StorefrontProductDetailPageClient slug={slug} />;
}
