import Link from 'next/link';
import { CalendarDays, FileText, FolderOpen } from 'lucide-react';
import { formatPublicBlogDate } from '@/lib/storefront/blog/public-blog-presentation';
import { PublicBlogPostListItem } from '@/lib/storefront/blog/public-blog.types';

type PublicBlogPostCardProps = {
  post: PublicBlogPostListItem;
};

export function PublicBlogPostCard({ post }: PublicBlogPostCardProps) {
  return (
    <article className='group overflow-hidden rounded-card border border-border bg-surface shadow-panel transition-transform duration-300 hover:-translate-y-1'>
      <div className='relative aspect-[16/9] overflow-hidden bg-surface-muted'>
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title}
            loading='lazy'
            decoding='async'
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <span className='grid h-full w-full place-items-center text-foreground-muted'>
            <FileText className='size-10' />
          </span>
        )}
      </div>

      <div className='space-y-4 p-5'>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground-muted'>
          <Link
            href={`/blog/category/${post.category.slug}`}
            className='inline-flex items-center gap-1.5 font-semibold text-brand hover:underline'
          >
            <FolderOpen className='size-3.5' />
            {post.category.name}
          </Link>

          <span className='inline-flex items-center gap-1.5'>
            <CalendarDays className='size-3.5' />
            {formatPublicBlogDate(post.publishedAt)}
          </span>
        </div>

        <div>
          <Link
            href={`/blog/${post.slug}`}
            className='line-clamp-2 text-lg leading-8 font-extrabold text-foreground transition-colors hover:text-brand'
          >
            {post.title}
          </Link>

          {post.excerpt ? (
            <p className='mt-3 line-clamp-3 text-sm leading-7 text-foreground-secondary'>
              {post.excerpt}
            </p>
          ) : null}
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className='inline-flex text-sm font-bold text-brand transition-opacity hover:opacity-75'
        >
          مطالعه مقاله
        </Link>
      </div>
    </article>
  );
}
