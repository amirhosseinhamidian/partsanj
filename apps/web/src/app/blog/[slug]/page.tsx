import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostStructuredData } from '@/lib/storefront/blog/public-blog-jsonld';
import { getBlogPostMetadata } from '@/lib/storefront/blog/public-blog-seo';
import {
  getPublicBlogPost,
  isPublicBlogNotFoundError,
} from '@/lib/storefront/blog/public-blog.server';
import { PublicBlogPostPageContent } from '@/components/storefront/blog/public-blog-post-page-content';

export const revalidate = 300;

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const result = await getPublicBlogPost(slug);

    return getBlogPostMetadata(result.data);
  } catch {
    return {
      title: 'مقاله بلاگ پیدا نشد',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  try {
    const result = await getPublicBlogPost(slug);

    return (
      <>
        <BlogPostStructuredData post={result.data} />

        <PublicBlogPostPageContent post={result.data} />
      </>
    );
  } catch (error) {
    if (isPublicBlogNotFoundError(error)) {
      notFound();
    }

    throw error;
  }
}
