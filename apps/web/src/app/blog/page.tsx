import type { Metadata } from 'next';
import { BlogIndexStructuredData } from '@/lib/storefront/blog/public-blog-jsonld';
import { getBlogIndexMetadata } from '@/lib/storefront/blog/public-blog-seo';
import {
  getPublicBlogCategories,
  getPublicBlogPosts,
} from '@/lib/storefront/blog/public-blog.server';
import { PublicBlogIndexPageContent } from '@/components/storefront/blog/public-blog-index-page-content';

export const revalidate = 300;

export const metadata: Metadata = getBlogIndexMetadata();

type BlogIndexPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
  }>;
};

function parsePage(value?: string) {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function normalizeQuery(value?: string) {
  const normalized = value?.trim();

  return normalized ? normalized.slice(0, 200) : undefined;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const { page: rawPage, q: rawQuery } = await searchParams;

  const page = parsePage(rawPage);
  const query = normalizeQuery(rawQuery);

  const [categoriesResult, postsResult] = await Promise.all([
    getPublicBlogCategories(),
    getPublicBlogPosts({
      page,
      limit: 12,
      q: query,
    }),
  ]);

  return (
    <>
      <BlogIndexStructuredData />

      <PublicBlogIndexPageContent
        categories={categoriesResult.data}
        postsResult={postsResult}
        query={query}
      />
    </>
  );
}
