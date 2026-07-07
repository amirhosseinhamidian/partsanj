import { BookOpenText } from 'lucide-react';
import { toPersianDigits } from '@/lib/utils/digits';
import { createPublicBlogIndexHref } from '@/lib/storefront/blog/public-blog-url';
import type {
  PublicBlogCategoryListItem,
  PublicBlogPostsResponse,
} from '@/lib/storefront/blog/public-blog.types';
import { PublicBlogPageShell } from './public-blog-page-shell';
import { PublicBlogPostsListing } from './public-blog-posts-listing';
import { PublicBlogSearchAndFilters } from './public-blog-search-and-filters';

type PublicBlogIndexPageContentProps = {
  categories: PublicBlogCategoryListItem[];
  postsResult: PublicBlogPostsResponse;
  query?: string;
};

export function PublicBlogIndexPageContent({
  categories,
  postsResult,
  query,
}: PublicBlogIndexPageContentProps) {
  const listingTitle = query ? `نتایج جست‌وجو برای «${query}»` : 'آخرین مقاله‌ها';

  return (
    <PublicBlogPageShell>
      <header className='max-w-3xl'>
        <span className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand'>
          <BookOpenText className='size-4' />
          بلاگ پارت‌سنج
        </span>

        <h1 className='mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl'>
          راهنمای انتخاب و نگهداری قطعات خودرو
        </h1>

        <p className='mt-4 text-base leading-8 text-foreground-secondary'>
          بررسی قطعات، راهنماهای سازگاری خودرو، نکات فنی و مطالب کاربردی برای انتخاب مطمئن‌تر قطعات
          خودرو
        </p>
      </header>

      <div className='mt-8'>
        <PublicBlogSearchAndFilters categories={categories} query={query} searchAction='/blog' />
      </div>

      <div className='mt-10'>
        <PublicBlogPostsListing
          title={listingTitle}
          description={
            postsResult.meta.total > 0
              ? `${toPersianDigits(String(postsResult.meta.total))} مقاله پیدا شد`
              : undefined
          }
          posts={postsResult.data}
          meta={postsResult.meta}
          emptyTitle='مقاله‌ای پیدا نشد'
          emptyDescription='عبارت جست‌وجو یا دسته‌بندی انتخاب‌شده را تغییر دهید'
          hrefForPage={(page) =>
            createPublicBlogIndexHref({
              page,
              q: query,
            })
          }
        />
      </div>
    </PublicBlogPageShell>
  );
}
