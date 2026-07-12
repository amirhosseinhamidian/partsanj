import 'server-only';

import type { Metadata } from 'next';

import { PUBLIC_SITE_NAME } from '../site-url';
import { buildSeoMetadata } from '../seo/seo-metadata';
import type { PublicBlogCategoryDetail, PublicBlogPostDetail } from './public-blog.types';

type BlogMetadataOptions = {
  /**
   * تنظیم کلی noindex سایت که از پنل مدیریت دریافت می‌شود.
   */
  globalNoIndex?: boolean;
  pageNoIndex?: boolean;
};

/**
 * اولین متن غیرخالی را از بین مقادیر ورودی برمی‌گرداند.
 */
function getText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const normalized = value?.trim();

    if (normalized) {
      return normalized;
    }
  }

  return '';
}

/**
 * متادیتای صفحه اصلی بلاگ
 *
 * مسیر:
 * /blog
 */
export function getBlogIndexMetadata(options?: BlogMetadataOptions): Metadata {
  const title = `بلاگ ${PUBLIC_SITE_NAME}`;

  const description = 'راهنماهای کاربردی انتخاب قطعات خودرو، بررسی سازگاری قطعات و نکات فنی خودرو';

  return buildSeoMetadata({
    title: 'بلاگ',
    seoTitle: title,

    description,

    canonicalPath: '/blog',

    globalNoIndex: options?.globalNoIndex,
    pageNoIndex: options?.pageNoIndex,

    type: 'website',

    openGraphTitle: title,
    openGraphDescription: description,
  });
}

/**
 * متادیتای صفحه جزئیات دسته‌بندی بلاگ
 *
 * مسیر:
 * /blog/category/[slug]
 */
export function getBlogCategoryMetadata(
  category: PublicBlogCategoryDetail,
  options?: BlogMetadataOptions,
): Metadata {
  const fallbackTitle = `${category.name} | بلاگ`;

  const description = getText(
    category.seoDescription,
    category.description,
    `مقالات دسته‌بندی ${category.name} در ${PUBLIC_SITE_NAME}`,
  );

  const canonicalPath = category.canonicalUrl || `/blog/category/${category.slug}`;

  const openGraphTitle = getText(
    category.openGraphTitle,
    category.seoTitle,
    `${category.name} | بلاگ ${PUBLIC_SITE_NAME}`,
  );

  const openGraphDescription = getText(category.openGraphDescription, description);

  const openGraphImage = category.openGraphImageUrl
    ? {
        url: category.openGraphImageUrl,
        alt: getText(category.openGraphImageAlt, category.name) || category.name,
      }
    : null;

  return buildSeoMetadata({
    /**
     * در صورت نبود seoTitle، این عنوان وارد title template
     * موجود در RootLayout می‌شود.
     */
    title: fallbackTitle,

    /**
     * در صورت وجود seoTitle، helper آن را به‌شکل absolute
     * قرار می‌دهد تا title template دوباره نام سایت را اضافه نکند.
     */
    seoTitle: category.seoTitle,

    description,

    canonicalPath,

    /**
     * noindex کلی سایت بر تنظیم اختصاصی دسته‌بندی اولویت دارد.
     */
    globalNoIndex: options?.globalNoIndex,
    pageNoIndex: category.noIndex,

    type: 'website',

    openGraphTitle,
    openGraphDescription,
    openGraphImage,
  });
}

/**
 * متادیتای صفحه جزئیات مقاله
 *
 * مسیر:
 * /blog/[slug]
 */
export function getBlogPostMetadata(
  post: PublicBlogPostDetail,
  options?: BlogMetadataOptions,
): Metadata {
  const description = getText(
    post.seoDescription,
    post.excerpt,
    `مقاله ${post.title} در ${PUBLIC_SITE_NAME}`,
  );

  const canonicalPath = post.canonicalUrl || `/blog/${post.slug}`;

  const openGraphTitle = getText(post.openGraphTitle, post.seoTitle, post.title);

  const openGraphDescription = getText(post.openGraphDescription, description);

  const openGraphImageUrl = getText(post.openGraphImageUrl, post.coverImageUrl);

  const openGraphImageAlt = getText(post.openGraphImageAlt, post.coverImageAlt, post.title);

  return buildSeoMetadata({
    title: post.title,
    seoTitle: post.seoTitle,

    description,

    canonicalPath,

    /**
     * اولویت noindex:
     *
     * 1. تنظیم کلی سایت
     * 2. تنظیم اختصاصی مقاله
     */
    globalNoIndex: options?.globalNoIndex,
    pageNoIndex: post.noIndex,

    type: 'article',

    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,

    authors: post.author.name ? [post.author.name] : undefined,

    section: post.category.name,

    openGraphTitle,
    openGraphDescription,

    openGraphImage: openGraphImageUrl
      ? {
          url: openGraphImageUrl,
          alt: openGraphImageAlt || post.title,
        }
      : null,
  });
}
