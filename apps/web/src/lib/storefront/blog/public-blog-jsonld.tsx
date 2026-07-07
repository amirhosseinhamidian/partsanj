import 'server-only';

import { PUBLIC_SITE_NAME, toAbsolutePublicUrl } from '../site-url';
import type { PublicBlogCategoryDetail, PublicBlogPostDetail } from './public-blog.types';

function safeJsonStringify(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: safeJsonStringify(data),
      }}
    />
  );
}

function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{
    name: string;
    url: string;
  }>;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function BlogIndexStructuredData() {
  const url = toAbsolutePublicUrl('/blog');

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: `بلاگ ${PUBLIC_SITE_NAME}`,
        url,
        inLanguage: 'fa-IR',
      }}
    />
  );
}

export function BlogCategoryStructuredData({ category }: { category: PublicBlogCategoryDetail }) {
  const categoryUrl = toAbsolutePublicUrl(`/blog/category/${category.slug}`);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: category.name,
          description: category.description,
          url: categoryUrl,
          inLanguage: 'fa-IR',
        }}
      />

      <BreadcrumbJsonLd
        items={[
          {
            name: 'خانه',
            url: toAbsolutePublicUrl('/'),
          },
          {
            name: 'بلاگ',
            url: toAbsolutePublicUrl('/blog'),
          },
          {
            name: category.name,
            url: categoryUrl,
          },
        ]}
      />
    </>
  );
}

export function BlogPostStructuredData({ post }: { post: PublicBlogPostDetail }) {
  const articleUrl = toAbsolutePublicUrl(post.canonicalUrl || `/blog/${post.slug}`);

  const categoryUrl = toAbsolutePublicUrl(`/blog/category/${post.category.slug}`);

  const imageUrl = post.openGraphImageUrl || post.coverImageUrl;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',

          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': articleUrl,
          },

          headline: post.seoTitle || post.title,

          description: post.seoDescription || post.excerpt || post.title,

          datePublished: post.publishedAt,
          dateModified: post.updatedAt,

          articleSection: post.category.name,
          inLanguage: 'fa-IR',

          author: {
            '@type': 'Person',
            name: post.author.name,
          },

          publisher: {
            '@type': 'Organization',
            name: PUBLIC_SITE_NAME,
          },

          image: imageUrl ? [toAbsolutePublicUrl(imageUrl)] : undefined,
        }}
      />

      <BreadcrumbJsonLd
        items={[
          {
            name: 'خانه',
            url: toAbsolutePublicUrl('/'),
          },
          {
            name: 'بلاگ',
            url: toAbsolutePublicUrl('/blog'),
          },
          {
            name: post.category.name,
            url: categoryUrl,
          },
          {
            name: post.title,
            url: articleUrl,
          },
        ]}
      />
    </>
  );
}
