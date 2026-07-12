/* eslint-disable react-hooks/error-boundaries */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicBlogCategoryPageContent } from '@/components/storefront/blog/public-blog-category-page-content';
import { BlogCategoryStructuredData } from '@/lib/storefront/blog/public-blog-jsonld';
import { getBlogCategoryMetadata } from '@/lib/storefront/blog/public-blog-seo';
import {
  getPublicBlogCategories,
  getPublicBlogCategory,
  getPublicBlogPosts,
  isPublicBlogNotFoundError,
} from '@/lib/storefront/blog/public-blog.server';
import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export const revalidate = 300;

type BlogCategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;

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

export async function generateMetadata({
  params,
  searchParams,
}: BlogCategoryPageProps): Promise<Metadata> {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const page = parsePage(resolvedSearchParams.page);
  const query = normalizeQuery(resolvedSearchParams.q);

  /**
   * حالت‌های جست‌وجو و صفحات دوم به بعد نباید
   * به‌عنوان صفحه مستقل ایندکس شوند.
   */
  const shouldNoIndexVariant = page > 1 || Boolean(query);

  try {
    const [categoryResult, settings] = await Promise.all([
      getPublicBlogCategory(slug),
      getStorefrontSiteSettings(),
    ]);

    return getBlogCategoryMetadata(categoryResult.data, {
      globalNoIndex: settings.noIndexSite,
      pageNoIndex: shouldNoIndexVariant,
    });
  } catch (error) {
    if (isPublicBlogNotFoundError(error)) {
      return buildSeoMetadata({
        title: 'دسته‌بندی بلاگ پیدا نشد',

        description: 'دسته‌بندی موردنظر پیدا نشد یا دیگر در دسترس نیست.',

        privatePage: true,
      });
    }
    throw error;
  }
}

export default async function BlogCategoryPage({ params, searchParams }: BlogCategoryPageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const page = parsePage(resolvedSearchParams.page);
  const query = normalizeQuery(resolvedSearchParams.q);

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

    const category = categoryResult.data;

    return (
      <>
        <BlogCategoryStructuredData category={category} />

        <PublicBlogCategoryPageContent
          category={category}
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
