import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, FolderOpen, UserRound } from 'lucide-react';
import {
  formatPublicBlogDate,
  shouldShowPublicBlogUpdatedAt,
} from '@/lib/storefront/blog/public-blog-presentation';
import type { PublicBlogPostDetail } from '@/lib/storefront/blog/public-blog.types';
import { PublicBlogPageShell } from './public-blog-page-shell';
import { TiptapDocument } from '@/components/ui/tiptap-document';

type PublicBlogPostPageContentProps = {
  post: PublicBlogPostDetail;
};

export function PublicBlogPostPageContent({ post }: PublicBlogPostPageContentProps) {
  const showUpdatedAt = shouldShowPublicBlogUpdatedAt(post.publishedAt, post.updatedAt);

  return (
    <PublicBlogPageShell width='reading'>
      <nav
        aria-label='مسیر صفحه'
        className='flex flex-wrap items-center gap-2 text-sm text-foreground-muted'
      >
        <Link href='/blog' className='font-semibold transition-colors hover:text-brand'>
          بلاگ
        </Link>

        <span>/</span>

        <Link
          href={`/blog/category/${post.category.slug}`}
          className='font-semibold transition-colors hover:text-brand'
        >
          {post.category.name}
        </Link>
      </nav>

      <article className='mt-7'>
        <header className='border-b border-border pb-8'>
          <Link
            href={`/blog/category/${post.category.slug}`}
            className='inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand'
          >
            <FolderOpen className='size-4' />
            {post.category.name}
          </Link>

          <h1 className='mt-5 text-3xl leading-[1.45] font-extrabold text-foreground sm:text-4xl'>
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className='mt-5 text-lg leading-9 text-foreground-secondary'>{post.excerpt}</p>
          ) : null}

          <div className='mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-foreground-muted'>
            <span className='inline-flex items-center gap-2'>
              <CalendarDays className='size-4' />
              {formatPublicBlogDate(post.publishedAt)}
            </span>

            <span className='inline-flex items-center gap-2'>
              <UserRound className='size-4' />
              {post.author.name}
            </span>

            {showUpdatedAt ? (
              <span className='inline-flex items-center gap-2'>
                <Clock3 className='size-4' />
                بروزرسانی:
                {formatPublicBlogDate(post.updatedAt)}
              </span>
            ) : null}
          </div>
        </header>

        {post.coverImageUrl ? (
          <figure className='mt-8 overflow-hidden rounded-card border border-border bg-surface-muted'>
            <img
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title}
              loading='eager'
              decoding='async'
              className='h-auto w-full object-cover'
            />
          </figure>
        ) : null}

        <div className='mt-9'>
          <TiptapDocument document={post.content} />
        </div>

        <footer className='mt-12 border-t border-border pt-7'>
          <Link
            href={`/blog/category/${post.category.slug}`}
            className='inline-flex items-center gap-2 text-sm font-bold text-brand transition-opacity hover:opacity-75'
          >
            <ArrowRight className='size-4' />
            مشاهده همه مقاله‌های {post.category.name}
          </Link>
        </footer>
      </article>
    </PublicBlogPageShell>
  );
}
