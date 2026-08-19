'use client';

import { useToast } from '@/components/providers/toast-provider';
import { useStorefrontCustomerAuth } from '@/components/storefront/customer-auth/storefront-customer-auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { storefrontProductInteractionsApi } from '@/lib/api/storefront-product-interactions-client';
import { ClientApiError } from '@/lib/api/web-client';
import { StorefrontContentReportButton } from '@/components/storefront/interactions/storefront-content-report-button';
import type {
  StorefrontOfficialInteractionIdentity,
  StorefrontProductQuestion,
  StorefrontProductQuestionsResponse,
  StorefrontProductReview,
  StorefrontProductReviewsResponse,
  StorefrontProductReviewSort,
} from '@/lib/storefront/interactions/product-interaction.types';

import { toPersianDigits } from '@/lib/utils/digits';

import {
  BadgeCheck,
  Gauge,
  HelpCircle,
  LoaderCircle,
  MessageCircleQuestion,
  MessageSquareText,
  Send,
  ShieldCheck,
  Star,
  ThumbsUp,
  UserRound,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

type StorefrontProductInteractionsProps = {
  slug: string;

  initialReviews: StorefrontProductReviewsResponse | null;

  initialQuestions: StorefrontProductQuestionsResponse | null;
};

const REVIEW_PAGE_SIZE = 10;

const RATING_LABELS: Record<number, string> = {
  1: 'ضعیف',
  2: 'متوسط',
  3: 'خوب',
  4: 'خیلی خوب',
  5: 'عالی',
};

function getErrorMessage(error: unknown) {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'عملیات با خطا مواجه شد';
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Tehran',
  }).format(date);
}

function SmallRating({ value }: { value: number }) {
  return (
    <div className='flex items-center gap-0.5' dir='ltr' aria-label={`${value} از 5`}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <Star
          key={rating}
          className={rating <= value ? 'size-4 fill-brand text-brand' : 'size-4 text-border-strong'}
        />
      ))}
    </div>
  );
}

function InteractiveRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const visibleRating = hoveredRating || value;

  return (
    <div className='space-y-4'>
      <div
        className='flex items-center justify-center gap-2'
        dir='ltr'
        onMouseLeave={() => setHoveredRating(0)}
      >
        {[1, 2, 3, 4, 5].map((rating) => {
          const active = rating <= visibleRating;

          return (
            <button
              key={rating}
              type='button'
              aria-label={`${rating} ستاره`}
              className='group grid size-12 place-items-center rounded-full transition-all duration-200 ease-out outline-none hover:-translate-y-1 hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-90 sm:size-14'
              onMouseEnter={() => setHoveredRating(rating)}
              onFocus={() => setHoveredRating(rating)}
              onBlur={() => setHoveredRating(0)}
              onClick={() => onChange(rating)}
            >
              <Star
                className={
                  active
                    ? 'size-8 fill-brand text-brand drop-shadow-sm transition-all duration-200 sm:size-9'
                    : 'size-8 text-border-strong transition-all duration-200 group-hover:text-brand/50 sm:size-9'
                }
              />
            </button>
          );
        })}
      </div>

      <div className='mx-auto flex max-w-xs gap-1.5'>
        {[1, 2, 3, 4, 5].map((rating) => (
          <span
            key={rating}
            className={
              rating <= visibleRating
                ? 'h-1.5 flex-1 -skew-x-12 rounded-full bg-brand transition-all duration-200'
                : 'h-1.5 flex-1 -skew-x-12 rounded-full bg-border transition-all duration-200'
            }
          />
        ))}
      </div>

      <div className='min-h-6 text-center'>
        {visibleRating > 0 ? (
          <p className='text-sm font-extrabold text-brand'>
            {RATING_LABELS[visibleRating]}
            {' · '}
            {toPersianDigits(String(visibleRating))}
            {' از '}
            {toPersianDigits('5')}
          </p>
        ) : (
          <p className='text-sm text-foreground-muted'>یکی از ستاره‌ها را انتخاب کنید</p>
        )}
      </div>
    </div>
  );
}

function AuthorAvatar({
  official,
  identity,
}: {
  official: boolean;
  identity: StorefrontOfficialInteractionIdentity;
}) {
  if (official && identity.avatarUrl) {
    return (
      <span className='size-10 shrink-0 overflow-hidden rounded-full border border-brand/20 bg-surface'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={identity.avatarUrl}
          alt={identity.displayName}
          className='size-full object-cover'
        />
      </span>
    );
  }

  return (
    <span
      className={
        official
          ? 'grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand'
          : 'grid size-10 shrink-0 place-items-center rounded-full bg-surface-muted text-foreground-muted'
      }
    >
      {official ? <ShieldCheck className='size-5' /> : <UserRound className='size-5' />}
    </span>
  );
}

function ReviewCard({
  review,
  identity,
  onHelpful,
  helpfulBusy,
}: {
  review: StorefrontProductReview;
  identity: StorefrontOfficialInteractionIdentity;
  onHelpful: (review: StorefrontProductReview) => void;
  helpfulBusy: boolean;
}) {
  return (
    <article className='rounded-card border border-border bg-surface p-5 sm:p-6'>
      <div className='flex items-start gap-3'>
        <AuthorAvatar official={false} identity={identity} />

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='font-extrabold text-foreground'>{review.author.displayName}</p>

            {review.isVerifiedPurchase ? (
              <span className='inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success'>
                <BadgeCheck className='size-3.5' />
                خریدار تأییدشده
              </span>
            ) : null}
          </div>

          <div className='mt-2 flex flex-wrap items-center gap-3'>
            <SmallRating value={review.rating} />

            <span className='text-xs text-foreground-muted'>{formatDate(review.publishedAt)}</span>
          </div>
        </div>
      </div>

      {review.body ? (
        <p className='mt-4 text-sm leading-7 whitespace-pre-line text-foreground-secondary'>
          {review.body}
        </p>
      ) : null}

      <div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
        <button
          type='button'
          disabled={helpfulBusy}
          onClick={() => onHelpful(review)}
          className={
            review.isHelpfulByCurrentUser
              ? 'inline-flex items-center gap-2 rounded-control bg-brand-soft px-3 py-2 text-xs font-bold text-brand transition hover:bg-brand-soft/70 disabled:opacity-50'
              : 'inline-flex items-center gap-2 rounded-control px-3 py-2 text-xs font-bold text-foreground-secondary transition hover:bg-surface-muted hover:text-brand disabled:opacity-50'
          }
        >
          {helpfulBusy ? (
            <LoaderCircle className='size-4 animate-spin' />
          ) : (
            <ThumbsUp className='size-4' />
          )}
          مفید بود
          {review.helpfulCount > 0 ? (
            <span className='numeric'>{toPersianDigits(String(review.helpfulCount))}</span>
          ) : null}
        </button>

        <StorefrontContentReportButton targetType='PRODUCT_REVIEW' targetId={review.id} />
      </div>

      {review.replies.length > 0 ? (
        <div className='mt-5 space-y-3 border-r-2 border-brand/20 pr-4'>
          {review.replies.map((reply) => {
            const official = reply.author.type === 'STAFF';

            return (
              <div
                key={reply.id}
                className={
                  official
                    ? 'rounded-control border border-brand/20 bg-brand-soft/40 p-4'
                    : 'rounded-control bg-surface-muted p-4'
                }
              >
                <div className='flex items-start gap-3'>
                  <AuthorAvatar official={official} identity={identity} />

                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='text-sm font-extrabold text-foreground'>
                        {reply.author.displayName}
                      </p>

                      {official ? (
                        <span className='rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white'>
                          {identity.badgeLabel}
                        </span>
                      ) : null}
                    </div>

                    <p className='mt-1 text-[11px] text-foreground-muted'>
                      {formatDate(reply.publishedAt)}
                    </p>
                  </div>
                </div>

                <p className='mt-3 text-sm leading-7 whitespace-pre-line text-foreground-secondary'>
                  {reply.body}
                </p>
                {!official ? (
                  <div className='mt-2 flex justify-end'>
                    <StorefrontContentReportButton
                      targetType='PRODUCT_REVIEW_REPLY'
                      targetId={reply.id}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function QuestionCard({
  question,
  identity,
  activeReplyId,
  replyBody,
  isSubmittingReply,
  onStartReply,
  onReplyBodyChange,
  onSubmitReply,
}: {
  question: StorefrontProductQuestion;
  identity: StorefrontOfficialInteractionIdentity;
  activeReplyId: string | null;
  replyBody: string;
  isSubmittingReply: boolean;
  onStartReply: (questionId: string) => void;
  onReplyBodyChange: (value: string) => void;
  onSubmitReply: (questionId: string) => void;
}) {
  return (
    <article className='rounded-card border border-border bg-surface p-5 sm:p-6'>
      <div className='flex items-start gap-3'>
        <AuthorAvatar official={false} identity={identity} />

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='font-extrabold text-foreground'>{question.author.displayName}</p>

            {question.isPinned ? (
              <span className='rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-bold text-warning'>
                پرسش پرتکرار
              </span>
            ) : null}
          </div>

          <p className='mt-1 text-xs text-foreground-muted'>{formatDate(question.publishedAt)}</p>
        </div>
      </div>

      <p className='mt-4 text-sm leading-7 font-semibold whitespace-pre-line text-foreground'>
        {question.body}
      </p>

      <div className='mt-2 flex justify-end'>
        <StorefrontContentReportButton targetType='PRODUCT_QUESTION' targetId={question.id} />
      </div>

      {question.replies.length > 0 ? (
        <div className='mt-5 space-y-3 border-r-2 border-brand/20 pr-4'>
          {question.replies.map((reply) => {
            const official = reply.author.type === 'STAFF';

            return (
              <div
                key={reply.id}
                className={
                  official
                    ? 'rounded-control border border-brand/20 bg-brand-soft/40 p-4'
                    : 'rounded-control bg-surface-muted p-4'
                }
              >
                <div className='flex items-start gap-3'>
                  <AuthorAvatar official={official} identity={identity} />

                  <div>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm font-extrabold text-foreground'>
                        {reply.author.displayName}
                      </span>

                      {official ? (
                        <span className='rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white'>
                          {identity.badgeLabel}
                        </span>
                      ) : null}
                    </div>

                    <p className='mt-1 text-[11px] text-foreground-muted'>
                      {formatDate(reply.publishedAt)}
                    </p>
                  </div>
                </div>

                <p className='mt-3 text-sm leading-7 whitespace-pre-line text-foreground-secondary'>
                  {reply.body}
                </p>
                {!official ? (
                  <div className='mt-2 flex justify-end'>
                    <StorefrontContentReportButton
                      targetType='PRODUCT_QUESTION_REPLY'
                      targetId={reply.id}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className='mt-5 rounded-control border border-dashed border-border bg-surface-muted p-4 text-sm text-foreground-muted'>
          این پرسش هنوز پاسخ عمومی دریافت نکرده است.
        </div>
      )}

      {question.canCurrentUserReply ? (
        <div className='mt-5'>
          {activeReplyId === question.id ? (
            <div className='space-y-3'>
              <Textarea
                value={replyBody}
                rows={3}
                maxLength={3000}
                placeholder='توضیح تکمیلی خود را بنویسید...'
                onChange={(event) => onReplyBodyChange(event.target.value)}
              />

              <div className='flex justify-end'>
                <Button
                  type='button'
                  size='sm'
                  disabled={!replyBody.trim()}
                  isLoading={isSubmittingReply}
                  loadingLabel='در حال ثبت'
                  iconStart={<Send />}
                  onClick={() => onSubmitReply(question.id)}
                >
                  ثبت توضیح تکمیلی
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => onStartReply(question.id)}
            >
              ادامه گفتگو
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function StorefrontProductInteractions({
  slug,
  initialReviews,
  initialQuestions,
}: StorefrontProductInteractionsProps) {
  const { status, openLogin } = useStorefrontCustomerAuth();

  const { toast } = useToast();

  const [reviewsResponse, setReviewsResponse] = useState<StorefrontProductReviewsResponse | null>(
    initialReviews,
  );

  const [questionsResponse, setQuestionsResponse] =
    useState<StorefrontProductQuestionsResponse | null>(initialQuestions);

  const [reviewSort, setReviewSort] = useState<StorefrontProductReviewSort>('NEWEST');

  const [selectedRating, setSelectedRating] = useState(initialReviews?.data.myReview?.rating ?? 0);

  const [reviewBody, setReviewBody] = useState(initialReviews?.data.myReview?.body ?? '');

  const [questionBody, setQuestionBody] = useState('');

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState('');

  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [helpfulBusyId, setHelpfulBusyId] = useState<string | null>(null);

  const [pendingReviewAfterLogin, setPendingReviewAfterLogin] = useState(false);

  const [pendingQuestionAfterLogin, setPendingQuestionAfterLogin] = useState(false);

  const [pendingHelpfulAfterLogin, setPendingHelpfulAfterLogin] = useState<string | null>(null);

  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);

  const loadReviews = useCallback(
    async (sort: StorefrontProductReviewSort = reviewSort) => {
      setIsLoadingReviews(true);

      try {
        const response = await storefrontProductInteractionsApi.getReviews(slug, {
          sort,
          page: 1,
          limit: REVIEW_PAGE_SIZE,
        });

        setReviewsResponse(response);

        if (response.data.myReview) {
          setSelectedRating(response.data.myReview.rating);

          setReviewBody(response.data.myReview.body ?? '');
        }
      } catch (error) {
        toast({
          position: 'top-left',
          variant: 'danger',
          title: getErrorMessage(error),
        });
      } finally {
        setIsLoadingReviews(false);
      }
    },
    [reviewSort, slug, toast],
  );

  const loadQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);

    try {
      const response = await storefrontProductInteractionsApi.getQuestions(slug);

      setQuestionsResponse(response);
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: getErrorMessage(error),
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    if (!initialReviews) {
      void loadReviews();
    }

    if (!initialQuestions) {
      void loadQuestions();
    }
  }, [initialQuestions, initialReviews, loadQuestions, loadReviews]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    /*
     * بعد از Login دوباره GET
     * می‌زنیم تا myReview،
     * Helpful و مالکیت سؤال
     * کاربر مشخص شود.
     */
    void loadReviews();

    void loadQuestions();
  }, [status, loadQuestions, loadReviews]);

  const submitReview = useCallback(async () => {
    if (selectedRating < 1) {
      toast({
        position: 'top-left',
        variant: 'warning',
        title: 'ابتدا امتیاز خود را انتخاب کنید',
      });

      return;
    }

    if (status !== 'authenticated') {
      setPendingReviewAfterLogin(true);

      openLogin();

      return;
    }

    setIsSubmittingReview(true);

    try {
      const response = await storefrontProductInteractionsApi.upsertReview(slug, {
        rating: selectedRating,

        body: reviewBody.trim() || null,
      });

      toast({
        position: 'top-left',
        variant: 'success',
        title: response.message ?? 'امتیاز شما ثبت شد',
      });

      setIsReviewFormOpen(false);

      await loadReviews();
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: getErrorMessage(error),
      });
    } finally {
      setIsSubmittingReview(false);
    }
  }, [loadReviews, openLogin, reviewBody, selectedRating, slug, status, toast]);

  const submitQuestion = useCallback(async () => {
    const normalized = questionBody.trim();

    if (normalized.length < 2) {
      toast({
        position: 'top-left',
        variant: 'warning',
        title: 'سؤال خود را وارد کنید',
      });

      return;
    }

    if (status !== 'authenticated') {
      setPendingQuestionAfterLogin(true);

      openLogin();

      return;
    }

    setIsSubmittingQuestion(true);

    try {
      const response = await storefrontProductInteractionsApi.createQuestion(slug, normalized);

      setQuestionBody('');

      toast({
        position: 'top-left',
        variant: 'success',
        title: response.message ?? 'سؤال شما ثبت شد',
      });

      await loadQuestions();
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: getErrorMessage(error),
      });
    } finally {
      setIsSubmittingQuestion(false);
    }
  }, [loadQuestions, openLogin, questionBody, slug, status, toast]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    if (pendingReviewAfterLogin) {
      setPendingReviewAfterLogin(false);

      void submitReview();
    }

    if (pendingQuestionAfterLogin) {
      setPendingQuestionAfterLogin(false);

      void submitQuestion();
    }
  }, [pendingQuestionAfterLogin, pendingReviewAfterLogin, status, submitQuestion, submitReview]);

  const handleHelpful = useCallback(
    async (review: StorefrontProductReview) => {
      if (status !== 'authenticated') {
        setPendingHelpfulAfterLogin(review.id);

        openLogin();

        return;
      }

      setHelpfulBusyId(review.id);

      try {
        const response = review.isHelpfulByCurrentUser
          ? await storefrontProductInteractionsApi.removeHelpful(slug, review.id)
          : await storefrontProductInteractionsApi.markHelpful(slug, review.id);

        setReviewsResponse((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            data: {
              ...current.data,

              reviews: current.data.reviews.map((item) =>
                item.id === review.id
                  ? {
                      ...item,

                      isHelpfulByCurrentUser: response.data.isHelpful,

                      helpfulCount: response.data.helpfulCount,
                    }
                  : item,
              ),
            },
          };
        });
      } catch (error) {
        toast({
          position: 'top-left',
          variant: 'danger',
          title: getErrorMessage(error),
        });
      } finally {
        setHelpfulBusyId(null);
      }
    },
    [openLogin, slug, status, toast],
  );

  useEffect(() => {
    if (status !== 'authenticated' || !pendingHelpfulAfterLogin) {
      return;
    }

    const reviewId = pendingHelpfulAfterLogin;

    setPendingHelpfulAfterLogin(null);

    /*
     * بعد از Login نسخه
     * authenticated لیست را
     * می‌گیریم؛ سپس Helpful را
     * ثبت می‌کنیم.
     */
    void (async () => {
      await loadReviews();

      try {
        await storefrontProductInteractionsApi.markHelpful(slug, reviewId);

        await loadReviews();
      } catch (error) {
        toast({
          position: 'top-left',
          variant: 'danger',
          title: getErrorMessage(error),
        });
      }
    })();
  }, [loadReviews, pendingHelpfulAfterLogin, slug, status, toast]);

  const loadMoreReviews = async () => {
    if (!reviewsResponse || isLoadingReviews) {
      return;
    }

    const nextPage = reviewsResponse.meta.page + 1;

    if (nextPage > reviewsResponse.meta.totalPages) {
      return;
    }

    setIsLoadingReviews(true);

    try {
      const response = await storefrontProductInteractionsApi.getReviews(slug, {
        sort: reviewSort,

        page: nextPage,

        limit: REVIEW_PAGE_SIZE,
      });

      setReviewsResponse({
        ...response,

        data: {
          ...response.data,

          reviews: [...reviewsResponse.data.reviews, ...response.data.reviews],
        },
      });
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: getErrorMessage(error),
      });
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const submitQuestionReply = async (questionId: string) => {
    const normalized = replyBody.trim();

    if (!normalized) {
      return;
    }

    setIsSubmittingReply(true);

    try {
      const response = await storefrontProductInteractionsApi.createQuestionReply(
        slug,
        questionId,
        {
          body: normalized,
        },
      );

      setReplyBody('');

      setActiveReplyId(null);

      toast({
        position: 'top-left',
        variant: 'success',
        title: response.message ?? 'پاسخ شما ثبت شد',
      });

      await loadQuestions();
    } catch (error) {
      toast({
        position: 'top-left',
        variant: 'danger',
        title: getErrorMessage(error),
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const ratingSummary = reviewsResponse?.data.summary;

  const officialIdentity = reviewsResponse?.data.officialIdentity ??
    questionsResponse?.data.officialIdentity ?? {
      displayName: 'پارت‌سنج',

      avatarUrl: null,

      badgeLabel: 'پاسخ رسمی پارت‌سنج',
    };

  const hasMoreReviews = Boolean(
    reviewsResponse && reviewsResponse.meta.page < reviewsResponse.meta.totalPages,
  );

  const pendingReview = reviewsResponse?.data.myReview?.status === 'PENDING';

  const reviewSortOptions = useMemo(
    () => [
      {
        value: 'NEWEST' as const,
        label: 'جدیدترین',
      },
      {
        value: 'HELPFUL' as const,
        label: 'مفیدترین',
      },
      {
        value: 'HIGHEST' as const,
        label: 'بیشترین امتیاز',
      },
      {
        value: 'LOWEST' as const,
        label: 'کمترین امتیاز',
      },
    ],
    [],
  );

  return (
    <div id='product-interactions' className='space-y-8'>
      {reviewsResponse?.data.enabled !== false ? (
        <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
          <div className='border-b border-border bg-surface-muted px-5 py-5 sm:px-6'>
            <div className='flex items-center gap-3'>
              <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                <Star className='size-5 fill-brand' />
              </span>

              <div>
                <h2 className='text-lg font-extrabold text-foreground'>امتیاز و نظرات کاربران</h2>

                <p className='mt-1 text-sm text-foreground-secondary'>
                  تجربه خریداران و کاربران این محصول
                </p>
              </div>
            </div>
          </div>

          <div className='grid gap-6 p-5 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]'>
            <div className='rounded-card border border-border bg-surface-muted p-5'>
              <div className='text-center'>
                <div className='numeric text-4xl font-black text-foreground'>
                  {toPersianDigits(String(ratingSummary?.averageRating ?? 0))}
                </div>

                <div className='mt-2 flex justify-center'>
                  <SmallRating value={Math.round(ratingSummary?.averageRating ?? 0)} />
                </div>

                <p className='mt-2 text-xs leading-5 text-foreground-muted'>
                  بر اساس {toPersianDigits(String(ratingSummary?.ratingsCount ?? 0))} امتیاز ثبت‌شده
                  در پارت‌سنج
                </p>
              </div>

              <div className='mt-6 space-y-2.5'>
                {(
                  ratingSummary?.breakdown ??
                  [5, 4, 3, 2, 1].map((rating) => ({
                    rating,
                    count: 0,
                    percentage: 0,
                  }))
                ).map((item) => (
                  <div
                    key={item.rating}
                    className='grid grid-cols-[32px_1fr_36px] items-center gap-2'
                  >
                    <span dir='ltr' className='text-xs font-bold text-foreground-secondary'>
                      {toPersianDigits(String(item.rating))}★
                    </span>

                    <div className='h-2 overflow-hidden rounded-full bg-border'>
                      <div
                        className='h-full rounded-full bg-brand transition-all duration-500'
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>

                    <span className='numeric text-left text-[11px] text-foreground-muted'>
                      {toPersianDigits(String(item.percentage))}٪
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='overflow-hidden rounded-card border border-brand/20 bg-brand-soft/30 p-5 sm:p-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2 text-foreground-secondary'>
                  <Gauge className='size-5 text-brand' />

                  <span className='text-sm font-bold'>امتیاز شما به این قطعه</span>
                </div>

                <Button
                  type='button'
                  size='sm'
                  variant={isReviewFormOpen ? 'outline' : 'primary'}
                  iconStart={<MessageSquareText />}
                  className='shrink-0'
                  onClick={() => setIsReviewFormOpen((current) => !current)}
                >
                  {isReviewFormOpen ? 'بستن فرم' : reviewBody.trim() ? 'ویرایش نظر' : 'نوشتن نظر'}
                </Button>
              </div>

              <div className='mt-5'>
                <InteractiveRating
                  value={selectedRating}
                  onChange={(rating) => {
                    setSelectedRating(rating);
                    setIsReviewFormOpen(true);
                  }}
                />
              </div>

              {pendingReview ? (
                <div className='mt-5 rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-xs font-semibold text-warning'>
                  ثبت فعلی شما در انتظار بررسی پارت‌سنج است.
                </div>
              ) : null}

              <div
                className={
                  isReviewFormOpen
                    ? 'grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none'
                    : 'grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none'
                }
              >
                <div className='overflow-hidden'>
                  <div className='mt-5 space-y-3 border-t border-brand/15 pt-5'>
                    <Textarea
                      value={reviewBody}
                      rows={4}
                      maxLength={3000}
                      placeholder='اگر دوست دارید تجربه‌تان از کیفیت، نصب یا عملکرد این قطعه را هم بنویسید...'
                      onChange={(event) => setReviewBody(event.target.value)}
                    />

                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                      <p className='text-xs leading-6 text-foreground-muted'>
                        نوشتن متن اختیاری است؛ امتیاز بدون متن فقط در آمار امتیازهای محصول محاسبه
                        می‌شود و در فهرست نظرات نمایش داده نمی‌شود.
                      </p>

                      <Button
                        type='button'
                        isLoading={isSubmittingReview}
                        loadingLabel='در حال ثبت'
                        iconStart={<Star />}
                        onClick={() => void submitReview()}
                      >
                        {reviewBody.trim() ? 'ثبت امتیاز و نظر' : 'ثبت امتیاز'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-border px-5 py-6 sm:px-6'>
            <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <h3 className='font-extrabold text-foreground'>نظرات کاربران</h3>

                <p className='mt-1 text-xs text-foreground-muted'>
                  فقط نظرات تأییدشده نمایش داده می‌شوند.
                </p>
              </div>

              <Select
                value={reviewSort}
                options={reviewSortOptions}
                size='md'
                wrapperClassName='w-full sm:w-48'
                contentClassName='sm:min-w-48'
                onValueChange={(value) => {
                  const next = value as StorefrontProductReviewSort;

                  setReviewSort(next);

                  void loadReviews(next);
                }}
              />
            </div>

            {isLoadingReviews && !reviewsResponse ? (
              <div className='flex justify-center py-10'>
                <LoaderCircle className='size-6 animate-spin text-brand' />
              </div>
            ) : reviewsResponse?.data.reviews.length ? (
              <div className='space-y-4'>
                {reviewsResponse.data.reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    identity={officialIdentity}
                    helpfulBusy={helpfulBusyId === review.id}
                    onHelpful={(item) => void handleHelpful(item)}
                  />
                ))}

                {hasMoreReviews ? (
                  <div className='flex justify-center pt-2'>
                    <Button
                      type='button'
                      variant='outline'
                      isLoading={isLoadingReviews}
                      loadingLabel='در حال دریافت'
                      onClick={() => void loadMoreReviews()}
                    >
                      مشاهده نظرات بیشتر
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className='rounded-card border border-dashed border-border bg-surface-muted px-5 py-10 text-center'>
                <MessageSquareText className='mx-auto size-9 text-foreground-muted' />

                <p className='mt-3 font-bold text-foreground'>هنوز نظری برای این محصول ثبت نشده</p>

                <p className='mt-1 text-sm text-foreground-muted'>
                  اولین نفری باشید که تجربه‌اش را ثبت می‌کند.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {questionsResponse?.data.enabled !== false ? (
        <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
          <div className='border-b border-border bg-surface-muted px-5 py-5 sm:px-6'>
            <div className='flex items-center gap-3'>
              <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                <MessageCircleQuestion className='size-5' />
              </span>

              <div>
                <h2 className='text-lg font-extrabold text-foreground'>
                  پرسش‌های کاربران درباره این محصول
                </h2>

                <p className='mt-1 text-sm text-foreground-secondary'>
                  درباره سازگاری، نصب یا مشخصات این قطعه سؤال دارید؟
                </p>
              </div>
            </div>
          </div>

          <div className='border-b border-border p-5 sm:p-6'>
            <div className='overflow-hidden rounded-card border border-brand/20 bg-brand-soft/20'>
              <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5'>
                <div className='flex min-w-0 items-start gap-3'>
                  <span className='grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                    <HelpCircle className='size-5' />
                  </span>

                  <div className='min-w-0'>
                    <p className='font-extrabold text-foreground'>جواب سؤال‌تان را پیدا نکردید؟</p>

                    <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                      درباره سازگاری، نصب یا مشخصات این قطعه سؤال بپرسید.
                    </p>
                  </div>
                </div>

                <Button
                  type='button'
                  variant={isQuestionFormOpen ? 'outline' : 'primary'}
                  iconStart={<MessageCircleQuestion />}
                  className='shrink-0'
                  onClick={() => setIsQuestionFormOpen((current) => !current)}
                >
                  {isQuestionFormOpen ? 'بستن فرم' : 'سؤال بپرس'}
                </Button>
              </div>

              <div
                className={
                  isQuestionFormOpen
                    ? 'grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out'
                    : 'grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out'
                }
              >
                <div className='overflow-hidden'>
                  <div className='border-t border-brand/15 px-4 pt-5 pb-4 sm:px-5 sm:pb-5'>
                    <Textarea
                      value={questionBody}
                      rows={4}
                      maxLength={2000}
                      placeholder='مثلاً: آیا این قطعه برای پژو پارس TU5 مدل ۱۴۰۰ مناسب است؟'
                      onChange={(event) => setQuestionBody(event.target.value)}
                    />

                    <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                      <span dir='ltr' className='numeric text-xs text-foreground-muted'>
                        {toPersianDigits(String(questionBody.length))} / {toPersianDigits('2000')}
                      </span>

                      <Button
                        type='button'
                        disabled={questionBody.trim().length < 2}
                        isLoading={isSubmittingQuestion}
                        loadingLabel='در حال ثبت'
                        iconStart={<Send />}
                        onClick={() => void submitQuestion()}
                      >
                        ثبت سؤال
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='p-5 sm:p-6'>
            <div className='mb-5 flex items-center justify-between gap-4'>
              <div>
                <h3 className='font-extrabold text-foreground'>پرسش و پاسخ</h3>

                <p className='mt-1 text-xs text-foreground-muted'>
                  {toPersianDigits(String(questionsResponse?.data.questionsCount ?? 0))} پرسش
                  پاسخ‌داده‌شده یا در حال گفتگو
                </p>
              </div>
            </div>

            {isLoadingQuestions && !questionsResponse ? (
              <div className='flex justify-center py-10'>
                <LoaderCircle className='size-6 animate-spin text-brand' />
              </div>
            ) : questionsResponse?.data.questions.length ? (
              <div className='space-y-4'>
                {questionsResponse.data.questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    identity={officialIdentity}
                    activeReplyId={activeReplyId}
                    replyBody={activeReplyId === question.id ? replyBody : ''}
                    isSubmittingReply={isSubmittingReply}
                    onStartReply={(id) => {
                      setActiveReplyId(id);

                      setReplyBody('');
                    }}
                    onReplyBodyChange={setReplyBody}
                    onSubmitReply={(id) => void submitQuestionReply(id)}
                  />
                ))}
              </div>
            ) : (
              <div className='rounded-card border border-dashed border-border bg-surface-muted px-5 py-10 text-center'>
                <MessageCircleQuestion className='mx-auto size-9 text-foreground-muted' />

                <p className='mt-3 font-bold text-foreground'>هنوز سؤالی ثبت نشده</p>

                <p className='mt-1 text-sm text-foreground-muted'>
                  سؤال شما می‌تواند به انتخاب بهتر کاربران دیگر هم کمک کند.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
