import type { Metadata } from 'next';

import { PublicBlogIndexPageContent } from '@/components/storefront/blog/public-blog-index-page-content';
import { BlogIndexStructuredData } from '@/lib/storefront/blog/public-blog-jsonld';
import { getBlogIndexMetadata } from '@/lib/storefront/blog/public-blog-seo';
import {
  getPublicBlogCategories,
  getPublicBlogPosts,
} from '@/lib/storefront/blog/public-blog.server';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export const revalidate = 300;

type BlogIndexPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parsePage(value: string | string[] | undefined): number {
  const normalizedValue = getSingleSearchParam(value);
  const page = Number(normalizedValue);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeQuery(value: string | string[] | undefined): string | undefined {
  const normalizedValue = getSingleSearchParam(value);
  const normalized = normalizedValue?.trim();

  return normalized ? normalized.slice(0, 200) : undefined;
}

export async function generateMetadata({ searchParams }: BlogIndexPageProps): Promise<Metadata> {
  const [settings, resolvedSearchParams] = await Promise.all([
    getStorefrontSiteSettings(),
    searchParams,
  ]);

  const page = parsePage(resolvedSearchParams.page);
  const query = normalizeQuery(resolvedSearchParams.q);
  const shouldNoIndexVariant = page > 1 || Boolean(query);

  return getBlogIndexMetadata({
    globalNoIndex: settings.noIndexSite,
    pageNoIndex: shouldNoIndexVariant,
  });
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const resolvedSearchParams = await searchParams;

  const page = parsePage(resolvedSearchParams.page);
  const query = normalizeQuery(resolvedSearchParams.q);

  const [categoriesResult, postsResult] = await Promise.all([
    getPublicBlogCategories(),

    getPublicBlogPosts({
      page,
      limit: 12,
      q: query,
    }),
  ]);
  const isCanonicalBlogPage = page === 1 && !query;

  return (
    <>
      {isCanonicalBlogPage ? <BlogIndexStructuredData /> : null}

      <PublicBlogIndexPageContent
        categories={categoriesResult.data}
        postsResult={postsResult}
        query={query}
      />
    </>
  );
}
