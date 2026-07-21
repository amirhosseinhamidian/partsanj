'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, ImageIcon, ShieldCheck } from 'lucide-react';

import type { PublicBlogPostListItem } from '@/lib/storefront/blog/public-blog.types';
import { cn } from '@/lib/utils/cn';
import { toPersianDigits } from '@/lib/utils/digits';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

type HomeBlogGuideProps = {
  posts?: PublicBlogPostListItem[];
  className?: string;
};

export function HomeBlogGuide({ posts = [], className }: HomeBlogGuideProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  if (posts.length === 0) {
    return null;
  }

  const scroll = (direction: 'prev' | 'next') => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left: direction === 'next' ? -390 : 390,
      behavior: 'smooth',
    });
  };

  return (
    <section
      dir='rtl'
      className={cn('relative mx-auto w-full max-w-[1360px] px-4 py-4 sm:px-6 lg:px-8', className)}
    >
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='mb-2 flex items-center gap-1'>
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand' />
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand/70' />
            <span className='h-5 w-1 rotate-12 rounded-full bg-brand/40' />
          </div>

          <h2
            id='home-main-categories-title'
            className='mt-1 text-lg font-extrabold tracking-tight text-foreground sm:text-xl'
          >
            مقالات و راهنمای انتخاب قطعه
          </h2>
        </div>
        <Link href='/products'>
          <Button variant='outline' iconEnd={<ChevronLeft />}>
            همه مقالات
          </Button>
        </Link>
      </div>

      <button
        type='button'
        aria-label='مقاله‌های قبلی'
        onClick={() => scroll('prev')}
        className='absolute top-1/2 right-0 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_4px_18px_rgba(15,23,42,0.15)] transition duration-200 hover:text-orange-500 lg:flex dark:border dark:border-brand-foreground dark:bg-transparent dark:text-brand-foreground dark:hover:border-orange-500'
      >
        <ChevronRight className='h-5 w-5' />
      </button>

      <button
        type='button'
        aria-label='مقاله‌های بعدی'
        onClick={() => scroll('next')}
        className='absolute top-1/2 left-0 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-slate-500 shadow-[0_4px_18px_rgba(15,23,42,0.15)] transition duration-200 hover:text-orange-500 lg:flex dark:border dark:border-brand-foreground dark:bg-transparent dark:text-brand-foreground dark:hover:border-orange-500'
      >
        <ChevronLeft className='h-5 w-5' />
      </button>

      <div
        ref={scrollRef}
        className='scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth px-4 pb-6'
      >
        {posts.map((post) => (
          <HomeBlogGuideCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function HomeBlogGuideCard({ post }: { post: PublicBlogPostListItem }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className='group grid min-h-[132px] max-w-[390px] min-w-[390px] grid-cols-[48%_52%] overflow-hidden rounded-2xl bg-surface p-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(15,23,42,0.1)] max-sm:max-w-[330px] max-sm:min-w-[330px]'
    >
      <div className='flex min-w-0 flex-col justify-between pr-4 text-right'>
        <div>
          <div className='mb-2 flex items-center gap-1.5 text-[11px] font-bold text-orange-500'>
            <ShieldCheck className='h-3.5 w-3.5' />
            <span className='line-clamp-1'>{post.category.name}</span>
          </div>

          <h3 className='line-clamp-2 text-base leading-7 font-extrabold text-slate-800 transition group-hover:text-orange-500 dark:text-slate-100'>
            {post.title}
          </h3>

          {post.excerpt ? (
            <p className='mt-1 line-clamp-2 text-xs leading-5 text-slate-400 dark:text-slate-300'>
              {post.excerpt}
            </p>
          ) : null}
        </div>

        <div className='mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-400 dark:text-slate-300'>
          <CalendarDays className='h-3.5 w-3.5' />
          <time dateTime={post.publishedAt}>{formatJalaliSlashDate(post.publishedAt)}</time>
        </div>
      </div>

      <div className='relative min-h-[108px] overflow-hidden rounded-xl bg-slate-100'>
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? post.title}
            fill
            sizes='(max-width: 768px) 100vw, 33vw'
            className='object-cover transition duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='flex min-h-[108px] w-full items-center justify-center text-slate-400'>
            <ImageIcon className='h-9 w-9' />
          </div>
        )}
      </div>
    </Link>
  );
}

function formatJalaliSlashDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';

  return `${toPersianDigits(year)}/${toPersianDigits(month)}/${toPersianDigits(day)}`;
}
