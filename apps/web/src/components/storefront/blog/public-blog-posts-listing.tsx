import { toPersianDigits } from '@/lib/utils/digits';
import type {
  PublicBlogPostListItem,
  PublicBlogPostsResponse,
} from '@/lib/storefront/blog/public-blog.types';
import { PublicBlogPagination } from './public-blog-pagination';
import { PublicBlogPostCard } from './public-blog-post-card';

type PublicBlogPostsListingProps = {
  title: string;
  description?: string;

  posts: PublicBlogPostListItem[];
  meta: PublicBlogPostsResponse['meta'];

  emptyTitle: string;
  emptyDescription: string;

  hrefForPage: (page: number) => string;
};

export function PublicBlogPostsListing({
  title,
  description,
  posts,
  meta,
  emptyTitle,
  emptyDescription,
  hrefForPage,
}: PublicBlogPostsListingProps) {
  const resolvedDescription =
    description ??
    (meta.total > 0 ? `${toPersianDigits(String(meta.total))} مقاله پیدا شد` : 'مقاله‌ای پیدا نشد');

  return (
    <section>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-xl font-extrabold text-foreground'>{title}</h2>

          <p className='mt-2 text-sm text-foreground-secondary'>{resolvedDescription}</p>
        </div>
      </div>

      {posts.length > 0 ? (
        <>
          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {posts.map((post) => (
              <PublicBlogPostCard key={post.id} post={post} />
            ))}
          </div>

          <div className='mt-10'>
            <PublicBlogPagination
              page={meta.page}
              totalPages={meta.totalPages}
              hrefForPage={hrefForPage}
            />
          </div>
        </>
      ) : (
        <div className='rounded-card border border-dashed border-border bg-surface p-10 text-center'>
          <h3 className='text-lg font-extrabold text-foreground'>{emptyTitle}</h3>

          <p className='mt-2 text-sm text-foreground-secondary'>{emptyDescription}</p>
        </div>
      )}
    </section>
  );
}
