import 'server-only';

import type { Metadata } from 'next';
import { PUBLIC_SITE_NAME, toAbsolutePublicUrl } from '../site-url';
import type { PublicBlogCategoryDetail, PublicBlogPostDetail } from './public-blog.types';

function getText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();

    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function createRobots(noIndex: boolean) {
  return {
    index: !noIndex,
    follow: true,
  };
}

export function getBlogIndexMetadata(): Metadata {
  const title = `بلاگ ${PUBLIC_SITE_NAME}`;
  const description = 'راهنماهای کاربردی انتخاب قطعات خودرو، بررسی سازگاری قطعات و نکات فنی خودرو';

  const canonical = toAbsolutePublicUrl('/blog');

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: PUBLIC_SITE_NAME,
      title,
      description,
      url: canonical,
    },

    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export function getBlogCategoryMetadata(category: PublicBlogCategoryDetail): Metadata {
  const title = getText(category.seoTitle, `${category.name} | بلاگ ${PUBLIC_SITE_NAME}`);

  const description = getText(
    category.seoDescription,
    category.description,
    `مقالات دسته‌بندی ${category.name} در ${PUBLIC_SITE_NAME}`,
  );

  const canonical = toAbsolutePublicUrl(category.canonicalUrl || `/blog/category/${category.slug}`);

  const openGraphTitle = getText(category.openGraphTitle, title);

  const openGraphDescription = getText(category.openGraphDescription, description);

  const openGraphImageUrl = category.openGraphImageUrl
    ? toAbsolutePublicUrl(category.openGraphImageUrl)
    : null;

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    robots: createRobots(category.noIndex),

    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: PUBLIC_SITE_NAME,
      title: openGraphTitle,
      description: openGraphDescription,
      url: canonical,

      images: openGraphImageUrl
        ? [
            {
              url: openGraphImageUrl,
              alt: category.openGraphImageAlt || category.name,
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

export function getBlogPostMetadata(post: PublicBlogPostDetail): Metadata {
  const title = getText(post.seoTitle, post.title);

  const description = getText(
    post.seoDescription,
    post.excerpt,
    `مقاله ${post.title} در ${PUBLIC_SITE_NAME}`,
  );

  const canonical = toAbsolutePublicUrl(post.canonicalUrl || `/blog/${post.slug}`);

  const openGraphTitle = getText(post.openGraphTitle, title);

  const openGraphDescription = getText(post.openGraphDescription, description);

  const imageUrl = getText(post.openGraphImageUrl, post.coverImageUrl);

  const openGraphImageUrl = imageUrl ? toAbsolutePublicUrl(imageUrl) : null;

  const imageAlt = getText(post.openGraphImageAlt, post.coverImageAlt, post.title);

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    robots: createRobots(post.noIndex),

    openGraph: {
      type: 'article',
      locale: 'fa_IR',
      siteName: PUBLIC_SITE_NAME,

      title: openGraphTitle,
      description: openGraphDescription,
      url: canonical,

      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      section: post.category.name,

      images: openGraphImageUrl
        ? [
            {
              url: openGraphImageUrl,
              alt: imageAlt,
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
