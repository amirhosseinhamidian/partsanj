/* eslint-disable react-hooks/error-boundaries */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicBlogPostPageContent } from '@/components/storefront/blog/public-blog-post-page-content';
import { BlogPostStructuredData } from '@/lib/storefront/blog/public-blog-jsonld';
import { getBlogPostMetadata } from '@/lib/storefront/blog/public-blog-seo';
import {
  getPublicBlogPost,
  isPublicBlogNotFoundError,
} from '@/lib/storefront/blog/public-blog.server';
import { buildSeoMetadata } from '@/lib/storefront/seo/seo-metadata';
import { getStorefrontSiteSettings } from '@/lib/storefront/settings/site-settings.server';

export const revalidate = 300;

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    /**
     * اطلاعات مقاله و تنظیمات کلی سایت هم‌زمان
     * دریافت می‌شوند تا درخواست‌ها پشت سر هم اجرا نشوند.
     */
    const [result, settings] = await Promise.all([
      getPublicBlogPost(slug),
      getStorefrontSiteSettings(),
    ]);

    return getBlogPostMetadata(result.data, {
      globalNoIndex: settings.noIndexSite,
    });
  } catch (error) {
    /**
     * فقط خطای واقعی پیدا نشدن مقاله را به متادیتای
     * not-found تبدیل می‌کنیم.
     *
     * خطاهای دیگر، مانند قطع‌شدن API، نباید به‌اشتباه
     * به‌عنوان مقاله حذف‌شده در نظر گرفته شوند.
     */
    if (isPublicBlogNotFoundError(error)) {
      return buildSeoMetadata({
        title: 'مقاله پیدا نشد',

        description: 'مقاله موردنظر پیدا نشد یا دیگر در دسترس نیست.',

        privatePage: true,
      });
    }

    throw error;
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  try {
    const result = await getPublicBlogPost(slug);
    const post = result.data;

    return (
      <>
        <BlogPostStructuredData post={post} />

        <PublicBlogPostPageContent post={post} />
      </>
    );
  } catch (error) {
    if (isPublicBlogNotFoundError(error)) {
      notFound();
    }

    throw error;
  }
}
