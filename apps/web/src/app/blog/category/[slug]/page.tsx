import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogCategoryStructuredData } from '@/lib/storefront/blog/public-blog-jsonld';
import { getBlogCategoryMetadata } from '@/lib/storefront/blog/public-blog-seo';
import {
  getPublicBlogCategories,
  getPublicBlogCategory,
  getPublicBlogPosts,
  isPublicBlogNotFoundError,
} from '@/lib/storefront/blog/public-blog.server';
import { PublicBlogCategoryPageContent } from '@/components/storefront/blog/public-blog-category-page-content';

export const revalidate = 300;

type BlogCategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;

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

export async function generateMetadata({ params }: BlogCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const result = await getPublicBlogCategory(slug);

    return getBlogCategoryMetadata(result.data);
  } catch {
    return {
      title: 'دسته‌بندی بلاگ پیدا نشد',
    };
  }
}

export default async function BlogCategoryPage({ params, searchParams }: BlogCategoryPageProps) {
  const { slug } = await params;

  const { page: rawPage, q: rawQuery } = await searchParams;

  const page = parsePage(rawPage);
  const query = normalizeQuery(rawQuery);

  try {
    const [categoryResult, categoriesResult, postsResult] = await Promise.all([
      getPublicBlogCategory(slug),
      getPublicBlogCategories(),
      getPublicBlogPosts({
        categorySlug: slug,
        page,
        limit: 12,
        q: query,
      }),
    ]);

    return (
      <>
        <BlogCategoryStructuredData category={categoryResult.data} />

        <PublicBlogCategoryPageContent
          category={categoryResult.data}
          categories={categoriesResult.data}
          postsResult={postsResult}
          query={query}
        />
      </>
    );
  } catch (error) {
    if (isPublicBlogNotFoundError(error)) {
      notFound();
    }

    throw error;
  }
}
