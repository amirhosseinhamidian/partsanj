import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import {
  createPublicBlogCategoryHref,
  createPublicBlogIndexHref,
} from '@/lib/storefront/blog/public-blog-url';
import type { PublicBlogCategoryListItem } from '@/lib/storefront/blog/public-blog.types';

type PublicBlogCategoryNavigationProps = {
  categories: PublicBlogCategoryListItem[];
  activeSlug?: string;
  query?: string;
};

export function PublicBlogCategoryNavigation({
  categories,
  activeSlug,
  query,
}: PublicBlogCategoryNavigationProps) {
  return (
    <nav aria-label='دسته‌بندی‌های بلاگ' className='flex flex-wrap gap-2'>
      <Link
        href={createPublicBlogIndexHref({
          q: query,
        })}
        className={cn(
          'rounded-full border px-4 py-2 text-sm font-bold transition-colors',
          !activeSlug
            ? 'border-brand bg-brand text-brand-foreground'
            : 'border-border bg-surface text-foreground-secondary hover:border-brand/40 hover:text-brand',
        )}
      >
        همه مقاله‌ها
      </Link>

      {categories.map((category) => {
        const isActive = category.slug === activeSlug;

        return (
          <Link
            key={category.id}
            href={createPublicBlogCategoryHref(category.slug, {
              q: query,
            })}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-bold transition-colors',
              isActive
                ? 'border-brand bg-brand text-brand-foreground'
                : 'border-border bg-surface text-foreground-secondary hover:border-brand/40 hover:text-brand',
            )}
          >
            {category.name}

            <span className='ms-1.5 text-xs opacity-75'>
              ({toPersianDigits(String(category.postsCount))})
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
