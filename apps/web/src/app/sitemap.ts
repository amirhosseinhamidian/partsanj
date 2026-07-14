import type { MetadataRoute } from 'next';

import { publicNestApi } from '@/lib/server/public-nest-api';
import {
  getPublicBlogCategories,
  getPublicBlogCategory,
  getPublicBlogPost,
  getPublicBlogPosts,
} from '@/lib/storefront/blog/public-blog.server';
import type {
  PublicBlogCategoryDetail,
  PublicBlogCategoryListItem,
  PublicBlogPostDetail,
  PublicBlogPostListItem,
} from '@/lib/storefront/blog/public-blog.types';
import type {
  StorefrontProductDetail,
  StorefrontProductListItem,
  StorefrontProductResponse,
  StorefrontProductsResponse,
} from '@/lib/storefront/catalog/catalog.types';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export const revalidate = 3600;

const PAGE_SIZE = 100;
const DETAIL_BATCH_SIZE = 12;
const MAX_PAGINATION_PAGES = 10_000;

type SitemapEntry = MetadataRoute.Sitemap[number];

function resolveSiteOrigin(siteBaseUrl?: string | null): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    siteBaseUrl,
    process.env.NODE_ENV === 'production' ? 'https://partsanj.ir' : 'http://localhost:3000',
  ];

  for (const candidate of candidates) {
    const normalizedCandidate = candidate?.trim();

    if (!normalizedCandidate) {
      continue;
    }

    try {
      return new URL(normalizedCandidate).origin;
    } catch {
      // مقدار نامعتبر را رد می‌کنیم و گزینه بعدی را بررسی می‌کنیم.
    }
  }

  return process.env.NODE_ENV === 'production' ? 'https://partsanj.ir' : 'http://localhost:3000';
}

function toSameOriginUrl(
  valueOrPath: string | null | undefined,
  fallbackPath: string,
  origin: string,
): string | null {
  const normalizedValue = valueOrPath?.trim() || fallbackPath;

  try {
    const url = new URL(normalizedValue, `${origin}/`);

    if (url.origin !== origin) {
      return null;
    }

    // Canonicalهای داخل sitemap نباید fragment یا queryهای فیلتر داشته باشند.
    url.hash = '';
    url.search = '';

    // همه URLها به‌جز صفحه اصلی بدون اسلش انتهایی ثبت می‌شوند.
    if (url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }

    return url.toString();
  } catch {
    return null;
  }
}

function toLastModified(value: string | null | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dedupeBySlug<T extends { slug: string }>(items: T[]): T[] {
  return Array.from(new Map(items.map((item) => [item.slug, item])).values());
}

function dedupeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}

function logSettledFailure(scope: string, reason: unknown): void {
  console.error(`[sitemap] ${scope} failed`, reason);
}

async function mapInBatches<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];

  for (let offset = 0; offset < items.length; offset += DETAIL_BATCH_SIZE) {
    const batch = items.slice(offset, offset + DETAIL_BATCH_SIZE);
    const settledBatch = await Promise.allSettled(batch.map(mapper));

    for (const settledResult of settledBatch) {
      if (settledResult.status === 'fulfilled' && settledResult.value !== null) {
        results.push(settledResult.value);
        continue;
      }

      if (settledResult.status === 'rejected') {
        logSettledFailure('detail request', settledResult.reason);
      }
    }
  }

  return results;
}

async function getAllProductListItems(): Promise<StorefrontProductListItem[]> {
  const products: StorefrontProductListItem[] = [];

  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    if (page > MAX_PAGINATION_PAGES) {
      throw new Error(`Product sitemap pagination exceeded ${MAX_PAGINATION_PAGES} pages.`);
    }

    const response = await publicNestApi<StorefrontProductsResponse>(
      `/api/v1/catalog/products?page=${page}&limit=${PAGE_SIZE}`,
      {
        method: 'GET',
        next: {
          revalidate,
          tags: ['sitemap-products'],
        },
      },
    );

    products.push(...response.data);

    totalPages = Math.max(
      0,
      Number.isFinite(response.meta.totalPages) ? response.meta.totalPages : 0,
    );

    page += 1;
  }

  return dedupeBySlug(products);
}

async function getIndexableProducts(): Promise<StorefrontProductDetail[]> {
  const listItems = await getAllProductListItems();

  return mapInBatches(listItems, async (item) => {
    const response = await publicNestApi<StorefrontProductResponse>(
      `/api/v1/catalog/products/${encodeURIComponent(item.slug)}`,
      {
        method: 'GET',
        next: {
          revalidate,
          tags: [`product:${item.slug}`, 'sitemap-products'],
        },
      },
    );

    return response.data.noIndex ? null : response.data;
  });
}

async function getAllBlogPostListItems(): Promise<PublicBlogPostListItem[]> {
  const posts: PublicBlogPostListItem[] = [];

  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    if (page > MAX_PAGINATION_PAGES) {
      throw new Error(`Blog sitemap pagination exceeded ${MAX_PAGINATION_PAGES} pages.`);
    }

    const response = await getPublicBlogPosts({
      page,
      limit: PAGE_SIZE,
    });

    posts.push(...response.data);

    totalPages = Math.max(
      0,
      Number.isFinite(response.meta.totalPages) ? response.meta.totalPages : 0,
    );

    page += 1;
  }

  return dedupeBySlug(posts);
}

async function getIndexableBlogPosts(): Promise<PublicBlogPostDetail[]> {
  const listItems = await getAllBlogPostListItems();

  return mapInBatches(listItems, async (item) => {
    const response = await getPublicBlogPost(item.slug);

    return response.data.noIndex ? null : response.data;
  });
}

async function getIndexableBlogCategories(): Promise<PublicBlogCategoryDetail[]> {
  const response = await getPublicBlogCategories();

  const listItems: PublicBlogCategoryListItem[] = dedupeBySlug(
    response.data.filter((category) => category.postsCount > 0),
  );

  return mapInBatches(listItems, async (item) => {
    const categoryResponse = await getPublicBlogCategory(item.slug);

    return categoryResponse.data.noIndex ? null : categoryResponse.data;
  });
}

function createStaticEntries(origin: string): MetadataRoute.Sitemap {
  return [
    {
      url: `${origin}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${origin}/products`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${origin}/blog`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${origin}/about`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${origin}/contact`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${origin}/terms`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${origin}/returns`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${origin}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}

function createProductEntries(
  products: StorefrontProductDetail[],
  origin: string,
): MetadataRoute.Sitemap {
  return products.flatMap((product): SitemapEntry[] => {
    const url = toSameOriginUrl(product.canonicalUrl, `/products/${product.slug}`, origin);

    if (!url) {
      return [];
    }

    return [
      {
        url,
        lastModified: toLastModified(product.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ];
  });
}

function createBlogPostEntries(
  posts: PublicBlogPostDetail[],
  origin: string,
): MetadataRoute.Sitemap {
  return posts.flatMap((post): SitemapEntry[] => {
    const url = toSameOriginUrl(post.canonicalUrl, `/blog/${post.slug}`, origin);

    if (!url) {
      return [];
    }

    return [
      {
        url,
        lastModified: toLastModified(post.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
    ];
  });
}

function createBlogCategoryEntries(
  categories: PublicBlogCategoryDetail[],
  origin: string,
): MetadataRoute.Sitemap {
  return categories.flatMap((category): SitemapEntry[] => {
    const url = toSameOriginUrl(category.canonicalUrl, `/blog/category/${category.slug}`, origin);

    if (!url) {
      return [];
    }

    return [
      {
        url,
        changeFrequency: 'weekly',
        priority: 0.6,
      },
    ];
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getStorefrontSiteSettings();
  const origin = resolveSiteOrigin(settings.siteBaseUrl);

  if (settings.noIndexSite) {
    return [];
  }

  const staticEntries = createStaticEntries(origin);

  const [productsResult, postsResult, categoriesResult] = await Promise.allSettled([
    getIndexableProducts(),
    getIndexableBlogPosts(),
    getIndexableBlogCategories(),
  ]);

  if (productsResult.status === 'rejected') {
    logSettledFailure('products', productsResult.reason);
  }

  if (postsResult.status === 'rejected') {
    logSettledFailure('blog posts', postsResult.reason);
  }

  if (categoriesResult.status === 'rejected') {
    logSettledFailure('blog categories', categoriesResult.reason);
  }

  const productEntries =
    productsResult.status === 'fulfilled' ? createProductEntries(productsResult.value, origin) : [];

  const blogPostEntries =
    postsResult.status === 'fulfilled' ? createBlogPostEntries(postsResult.value, origin) : [];

  const blogCategoryEntries =
    categoriesResult.status === 'fulfilled'
      ? createBlogCategoryEntries(categoriesResult.value, origin)
      : [];

  return dedupeSitemapEntries([
    ...staticEntries,
    ...productEntries,
    ...blogPostEntries,
    ...blogCategoryEntries,
  ]);
}
