import Link from 'next/link';
import { ArrowRight, FolderOpen } from 'lucide-react';
import { createPublicBlogCategoryHref } from '@/lib/storefront/blog/public-blog-url';
import type {
  PublicBlogCategoryDetail,
  PublicBlogCategoryListItem,
  PublicBlogPostsResponse,
} from '@/lib/storefront/blog/public-blog.types';
import { PublicBlogPageShell } from './public-blog-page-shell';
import { PublicBlogPostsListing } from './public-blog-posts-listing';
import { PublicBlogSearchAndFilters } from './public-blog-search-and-filters';

type PublicBlogCategoryPageContentProps = {
  category: PublicBlogCategoryDetail;
  categories: PublicBlogCategoryListItem[];
  postsResult: PublicBlogPostsResponse;
  query?: string;
};

export function PublicBlogCategoryPageContent({
  category,
  categories,
  postsResult,
  query,
}: PublicBlogCategoryPageContentProps) {
  const listingTitle = query ? `نتایج جست‌وجو در «${category.name}»` : `مقاله‌های ${category.name}`;

  return (
    <PublicBlogPageShell>
      <Link
        href='/blog'
        className='inline-flex items-center gap-2 text-sm font-bold text-foreground-secondary transition-colors hover:text-brand'
      >
        <ArrowRight className='size-4' />
        بازگشت به بلاگ
      </Link>

      <header className='mt-7 max-w-3xl'>
        <span className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand'>
          <FolderOpen className='size-4' />
          دسته‌بندی مقاله
        </span>

        <h1 className='mt-5 text-3xl font-extrabold text-foreground sm:text-4xl'>
          {category.name}
        </h1>

        {category.description ? (
          <p className='mt-4 text-base leading-8 text-foreground-secondary'>
            {category.description}
          </p>
        ) : null}
      </header>

      <div className='mt-8'>
        <PublicBlogSearchAndFilters
          categories={categories}
          query={query}
          activeCategorySlug={category.slug}
          searchAction={`/blog/category/${category.slug}`}
        />
      </div>

      <div className='mt-10'>
        <PublicBlogPostsListing
          title={listingTitle}
          posts={postsResult.data}
          meta={postsResult.meta}
          emptyTitle='مقاله‌ای در این دسته‌بندی پیدا نشد'
          emptyDescription={
            query
              ? 'عبارت جست‌وجو را تغییر دهید یا جست‌وجو را پاک کنید'
              : 'هنوز مقاله‌ای در این دسته‌بندی منتشر نشده است'
          }
          hrefForPage={(page) =>
            createPublicBlogCategoryHref(category.slug, {
              page,
              q: query,
            })
          }
        />
      </div>
    </PublicBlogPageShell>
  );
}
