import Link from 'next/link';
import { Search, X } from 'lucide-react';
import {
  createPublicBlogCategoryHref,
  createPublicBlogIndexHref,
} from '@/lib/storefront/blog/public-blog-url';
import type { PublicBlogCategoryListItem } from '@/lib/storefront/blog/public-blog.types';
import { PublicBlogCategoryNavigation } from './public-blog-category-navigation';

type PublicBlogSearchAndFiltersProps = {
  categories: PublicBlogCategoryListItem[];
  query?: string;
  activeCategorySlug?: string;
  searchAction: string;
};

export function PublicBlogSearchAndFilters({
  categories,
  query,
  activeCategorySlug,
  searchAction,
}: PublicBlogSearchAndFiltersProps) {
  const resetHref = activeCategorySlug
    ? createPublicBlogCategoryHref(activeCategorySlug)
    : createPublicBlogIndexHref();

  return (
    <section aria-label='جست‌وجو و فیلتر مقالات' className='space-y-5'>
      <form action={searchAction} method='get' className='flex max-w-xl gap-2'>
        <label htmlFor='public-blog-search' className='sr-only'>
          جست‌وجو در مقاله‌ها
        </label>

        <input
          id='public-blog-search'
          name='q'
          type='search'
          defaultValue={query}
          placeholder='جست‌وجو در مقاله‌ها'
          className='h-11 min-w-0 flex-1 rounded-control border border-border bg-surface px-4 text-sm text-foreground transition-colors outline-none placeholder:text-foreground-muted focus:border-brand focus:ring-2 focus:ring-brand/15'
        />

        <button
          type='submit'
          className='grid size-11 shrink-0 place-items-center rounded-control bg-brand text-brand-foreground transition-opacity hover:opacity-90'
          aria-label='جست‌وجو در مقاله‌ها'
        >
          <Search className='size-4' />
        </button>

        {query ? (
          <Link
            href={resetHref}
            className='grid size-11 shrink-0 place-items-center rounded-control border border-border bg-surface text-foreground-secondary transition-colors hover:border-brand hover:text-brand'
            aria-label='پاک کردن جست‌وجو'
          >
            <X className='size-4' />
          </Link>
        ) : null}
      </form>

      <div className='space-y-2'>
        <p className='text-sm font-bold text-foreground'>فیلتر بر اساس دسته‌بندی</p>

        <PublicBlogCategoryNavigation
          categories={categories}
          activeSlug={activeCategorySlug}
          query={query}
        />
      </div>
    </section>
  );
}
