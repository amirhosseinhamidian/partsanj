'use client';

import { ChevronDown, ChevronLeft, FolderTree, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  buildCategoryNavigation,
  fetchStorefrontCategories,
  getCategoryProductsHref,
  type StorefrontCategoryNavigationItem,
} from '@/lib/storefront/catalog/category-navigation';
import { cn } from '@/lib/utils/cn';

type CategoryNavigationState = {
  categories: StorefrontCategoryNavigationItem[];
  isLoading: boolean;
};

type CategoryMenuProps = {
  categories: StorefrontCategoryNavigationItem[];
  isLoading: boolean;
  activeCategorySlug: string | null;
  isProductsRoute: boolean;
};

function getCurrentRootSlug(
  categories: StorefrontCategoryNavigationItem[],
  activeCategorySlug: string | null,
) {
  if (!activeCategorySlug) {
    return null;
  }

  const root = categories.find(
    (category) =>
      category.slug === activeCategorySlug ||
      category.children.some((child) => child.slug === activeCategorySlug),
  );

  return root?.slug ?? null;
}

export function useStorefrontCategoryNavigation(): CategoryNavigationState {
  const [rawCategories, setRawCategories] = useState<StorefrontCategoryNavigationItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const categories = await fetchStorefrontCategories(controller.signal);

        setRawCategories(buildCategoryNavigation(categories));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRawCategories([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      controller.abort();
    };
  }, []);

  return {
    categories: rawCategories,
    isLoading,
  };
}

export function StorefrontCategoryDesktopMenu({
  categories,
  isLoading,
  activeCategorySlug,
  isProductsRoute,
}: CategoryMenuProps) {
  const currentRootSlug = useMemo(
    () => getCurrentRootSlug(categories, activeCategorySlug),
    [activeCategorySlug, categories],
  );

  const [previewRootSlug, setPreviewRootSlug] = useState<string | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [activeCategorySlug]);

  useEffect(() => {
    setPreviewRootSlug(currentRootSlug ?? categories[0]?.slug ?? null);
  }, [categories, currentRootSlug]);

  const activeRoot = categories.find((category) => category.slug === previewRootSlug) ?? null;

  return (
    <div
      className='relative'
      onMouseEnter={() => {
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        setIsOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      }}
    >
      <button
        type='button'
        aria-haspopup='true'
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        className={cn(
          'relative inline-flex h-11 items-center gap-1 px-3 text-sm font-semibold transition-colors',
          'after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-transform',
          isProductsRoute
            ? 'text-brand after:scale-x-100 after:bg-brand'
            : 'text-foreground-secondary after:scale-x-0 hover:text-foreground hover:after:scale-x-100 hover:after:bg-border-strong',
        )}
      >
        محصولات
        <ChevronDown className={cn('size-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <div
        aria-hidden={!isOpen}
        className={cn(
          'absolute inset-s-0 top-full z-50 w-[40rem] pt-3 transition-[opacity,transform,visibility] duration-200 ease-out',
          isOpen
            ? 'visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible translate-y-2 opacity-0',
        )}
      >
        <div className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
          {isLoading ? (
            <div className='grid min-h-72 grid-cols-2 gap-5 p-5'>
              <div className='space-y-3'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className='h-10 animate-pulse rounded-control bg-surface-muted'
                  />
                ))}
              </div>

              <div className='space-y-3'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className='h-12 animate-pulse rounded-control bg-surface-muted'
                  />
                ))}
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className='flex min-h-48 flex-col items-center justify-center p-6 text-center'>
              <FolderTree className='size-8 text-foreground-muted' />

              <p className='mt-3 text-sm font-bold text-foreground-secondary'>
                دسته‌بندی فعالی برای نمایش وجود ندارد
              </p>

              <Link
                href='/products'
                onClick={() => {
                  setIsOpen(false);
                }}
                className='mt-4 text-sm font-extrabold text-brand'
              >
                مشاهده همه محصولات
              </Link>
            </div>
          ) : (
            <div dir='rtl' className='flex min-h-72'>
              {/* ستون راست: دسته‌های اصلی */}
              <section className='w-[40%] shrink-0 bg-surface-muted/60 p-4'>
                <div className='flex items-center gap-2 border-b border-border pb-3'>
                  <FolderTree className='size-4 text-brand' />

                  <p className='text-sm font-extrabold text-foreground'>دسته‌بندی‌ها</p>
                </div>

                <div className='mt-3 space-y-1'>
                  {categories.map((category) => {
                    const isCurrentRoot = category.slug === currentRootSlug;

                    const isPreviewed = category.slug === activeRoot?.slug;

                    return (
                      <Link
                        key={category.id}
                        href={getCategoryProductsHref(category.slug)}
                        aria-current={isCurrentRoot ? 'page' : undefined}
                        onMouseEnter={() => {
                          setPreviewRootSlug(category.slug);
                        }}
                        onFocus={() => {
                          setPreviewRootSlug(category.slug);
                        }}
                        onClick={() => {
                          setIsOpen(false);
                        }}
                        className={cn(
                          'flex min-h-11 items-center justify-between gap-3 rounded-control px-3 text-sm font-bold transition-colors',
                          isPreviewed
                            ? 'bg-surface text-brand shadow-sm'
                            : 'text-foreground-secondary hover:bg-surface hover:text-foreground',
                        )}
                      >
                        <span className='truncate'>{category.name}</span>

                        <ChevronLeft className='size-4 shrink-0' />
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* ستون چپ: فقط زیر‌دسته‌های مستقیم */}
              <section className='min-w-0 flex-1 p-5'>
                {activeRoot ? (
                  <>
                    <div className='flex items-start justify-between gap-4 border-b border-border pb-4'>
                      <div className='min-w-0'>
                        <p className='text-xs font-semibold text-brand'>زیر‌دسته‌های</p>

                        <h3 className='mt-1 truncate text-base font-extrabold text-foreground'>
                          {activeRoot.name}
                        </h3>
                      </div>
                    </div>

                    {activeRoot.children.length > 0 ? (
                      <div className='mt-4 grid gap-2'>
                        {activeRoot.children.map((child) => {
                          const isCurrentChild = child.slug === activeCategorySlug;

                          return (
                            <Link
                              key={child.id}
                              href={getCategoryProductsHref(child.slug)}
                              aria-current={isCurrentChild ? 'page' : undefined}
                              onClick={() => {
                                setIsOpen(false);
                              }}
                              className={cn(
                                'flex min-h-11 items-center justify-between gap-3 rounded-control border px-3 text-sm font-bold transition-colors',
                                isCurrentChild
                                  ? 'border-brand/25 bg-brand-soft text-brand'
                                  : 'border-transparent text-foreground-secondary hover:border-border hover:bg-surface-muted hover:text-foreground',
                              )}
                            >
                              <span className='truncate'>{child.name}</span>

                              <ChevronLeft className='size-4 shrink-0' />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className='mt-6 rounded-control border border-dashed border-border p-4 text-sm leading-7 text-foreground-secondary'>
                        برای این دسته هنوز زیر‌دسته‌ای ثبت نشده است
                      </div>
                    )}
                  </>
                ) : null}
              </section>
            </div>
          )}

          <div className='border-t border-border p-3'>
            <Link
              href='/products'
              onClick={() => {
                setIsOpen(false);
              }}
              className='flex min-h-10 items-center justify-center gap-2 rounded-control bg-brand-soft px-3 text-sm font-extrabold text-brand transition-colors hover:bg-brand hover:text-white'
            >
              <PackageSearch className='size-4' />
              مشاهده همه محصولات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorefrontCategoryMobileMenu({
  categories,
  isLoading,
  activeCategorySlug,
}: Omit<CategoryMenuProps, 'isProductsRoute'>) {
  return (
    <section className='mt-3 border-t border-border pt-3'>
      <div className='flex items-center justify-between gap-3 px-4 pb-2'>
        <p className='text-xs font-extrabold text-foreground-muted'>دسته‌بندی محصولات</p>

        <Link href='/products' className='text-xs font-extrabold text-brand'>
          همه محصولات
        </Link>
      </div>

      {isLoading ? (
        <div className='space-y-2 px-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='h-11 animate-pulse rounded-control bg-surface-muted' />
          ))}
        </div>
      ) : (
        <div className='space-y-1'>
          {categories.map((category) => {
            const isCurrentRoot = category.slug === activeCategorySlug;

            const hasCurrentChild = category.children.some(
              (child) => child.slug === activeCategorySlug,
            );

            return (
              <details
                key={category.id}
                defaultOpen={isCurrentRoot || hasCurrentChild}
                className='group rounded-control'
              >
                <summary
                  className={cn(
                    'flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control px-4 text-sm font-bold transition-colors',
                    isCurrentRoot || hasCurrentChild
                      ? 'bg-brand-soft text-brand'
                      : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground',
                  )}
                >
                  <span>{category.name}</span>

                  <ChevronDown className='size-4 transition-transform group-open:rotate-180' />
                </summary>

                <div className='space-y-1 px-4 pt-2 pb-2'>
                  <Link
                    href={getCategoryProductsHref(category.slug)}
                    className='block rounded-control px-3 py-2 text-sm font-bold text-brand hover:bg-brand-soft'
                  >
                    مشاهده همه {category.name}
                  </Link>

                  {category.children.map((child) => {
                    const isCurrent = child.slug === activeCategorySlug;

                    return (
                      <Link
                        key={child.id}
                        href={getCategoryProductsHref(child.slug)}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'block rounded-control px-3 py-2 text-sm font-semibold transition-colors',
                          isCurrent
                            ? 'bg-brand-soft text-brand'
                            : 'text-foreground-secondary hover:bg-surface-muted hover:text-foreground',
                        )}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
