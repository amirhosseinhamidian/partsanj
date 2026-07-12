import 'server-only';

import type { Metadata } from 'next';

import { PUBLIC_SITE_NAME, toAbsolutePublicUrl } from '@/lib/storefront/site-url';

type SeoImage = {
  url: string;
  alt?: string | null;
};

type BuildSeoMetadataOptions = {
  /**
   * عنوان عادی صفحه، بدون نام سایت.
   * Root layout نام سایت را با title template اضافه می‌کند.
   */
  title: string;

  /**
   * عنوان کاملی که از پنل ادمین وارد شده است.
   * در صورت وجود، title template روی آن اعمال نمی‌شود.
   */
  seoTitle?: string | null;

  description?: string | null;
  canonicalPath?: string | null;

  openGraphTitle?: string | null;
  openGraphDescription?: string | null;
  openGraphImage?: SeoImage | null;

  type?: 'website' | 'article';

  globalNoIndex?: boolean;
  pageNoIndex?: boolean;

  /**
   * برای حساب کاربری، سبد، پرداخت و پنل مدیریت.
   */
  privatePage?: boolean;

  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  section?: string | null;
};

function normalizeText(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function resolveNoIndex({
  globalNoIndex = false,
  pageNoIndex = false,
  privatePage = false,
}: {
  globalNoIndex?: boolean;
  pageNoIndex?: boolean;
  privatePage?: boolean;
}) {
  return globalNoIndex || pageNoIndex || privatePage;
}

export function buildSeoMetadata({
  title,
  seoTitle,
  description,
  canonicalPath,
  openGraphTitle,
  openGraphDescription,
  openGraphImage,
  type = 'website',
  globalNoIndex = false,
  pageNoIndex = false,
  privatePage = false,
  publishedTime,
  modifiedTime,
  authors,
  section,
}: BuildSeoMetadataOptions): Metadata {
  const normalizedTitle = normalizeText(title) || PUBLIC_SITE_NAME;
  const normalizedSeoTitle = normalizeText(seoTitle);
  const normalizedDescription = normalizeText(description);

  const noIndex = resolveNoIndex({
    globalNoIndex,
    pageNoIndex,
    privatePage,
  });

  const canonical = canonicalPath ? toAbsolutePublicUrl(canonicalPath) : undefined;

  const imageUrl = openGraphImage?.url ? toAbsolutePublicUrl(openGraphImage.url) : undefined;

  const finalOpenGraphTitle =
    normalizeText(openGraphTitle) || normalizedSeoTitle || normalizedTitle;

  const finalOpenGraphDescription = normalizeText(openGraphDescription) || normalizedDescription;

  return {
    title: normalizedSeoTitle
      ? {
          absolute: normalizedSeoTitle,
        }
      : normalizedTitle,

    description: normalizedDescription,

    alternates: canonical
      ? {
          canonical,
        }
      : undefined,

    robots: {
      index: !noIndex,

      // صفحات عمومی noindex شده همچنان می‌توانند لینک‌ها را دنبال کنند.
      // صفحات خصوصی نه ایندکس و نه دنبال می‌شوند.
      follow: privatePage ? false : true,

      googleBot: {
        index: !noIndex,
        follow: privatePage ? false : true,

        ...(noIndex
          ? {}
          : {
              'max-image-preview': 'large',
              'max-snippet': -1,
              'max-video-preview': -1,
            }),
      },
    },

    openGraph: {
      type,
      locale: 'fa_IR',
      siteName: PUBLIC_SITE_NAME,
      title: finalOpenGraphTitle,
      description: finalOpenGraphDescription,
      url: canonical,

      ...(type === 'article'
        ? {
            publishedTime: publishedTime || undefined,
            modifiedTime: modifiedTime || undefined,
            authors,
            section: normalizeText(section),
          }
        : {}),

      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: normalizeText(openGraphImage?.alt) || finalOpenGraphTitle,
            },
          ]
        : undefined,
    },

    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: finalOpenGraphTitle,
      description: finalOpenGraphDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}
