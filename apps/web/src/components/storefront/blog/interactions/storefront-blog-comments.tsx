'use client';

import { StorefrontContentReportButton } from '@/components/storefront/interactions/storefront-content-report-button';

import { useToast } from '@/components/providers/toast-provider';

import { useStorefrontCustomerAuth } from '@/components/storefront/customer-auth/storefront-customer-auth-provider';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { storefrontBlogInteractionsApi } from '@/lib/api/storefront-blog-interactions-client';

import { ClientApiError } from '@/lib/api/web-client';

import type {
  StorefrontBlogComment,
  StorefrontBlogCommentsResponse,
} from '@/lib/storefront/interactions/blog-interaction.types';

import type { StorefrontOfficialInteractionIdentity } from '@/lib/storefront/interactions/product-interaction.types';

import { toPersianDigits } from '@/lib/utils/digits';

import {
  LoaderCircle,
  MessageCircle,
  MessageSquareReply,
  MessagesSquare,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useState } from 'react';

type StorefrontBlogCommentsProps = {
  slug: string;

  initialComments: StorefrontBlogCommentsResponse | null;
};

type FlattenedComment = {
  comment: StorefrontBlogComment;

  depth: number;

  parentAuthorName: string | null;
};

const COMMENTS_PAGE_SIZE = 10;

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

function flattenComments(
  comments: StorefrontBlogComment[],
  depth = 0,
  parentAuthorName: string | null = null,
): FlattenedComment[] {
  return comments.flatMap((comment) => [
    {
      comment,
      depth,
      parentAuthorName,
    },

    ...flattenComments(comment.replies, depth + 1, comment.author.displayName),
  ]);
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

function BlogCommentItem({
  item,
  identity,

  activeReplyId,
  replyBody,

  isSubmittingReply,

  onStartReply,
  onCancelReply,
  onReplyBodyChange,
  onSubmitReply,
}: {
  item: FlattenedComment;

  identity: StorefrontOfficialInteractionIdentity;

  activeReplyId: string | null;

  replyBody: string;

  isSubmittingReply: boolean;

  onStartReply: (commentId: string) => void;

  onCancelReply: () => void;

  onReplyBodyChange: (value: string) => void;

  onSubmitReply: (commentId: string) => void;
}) {
  const { comment, depth, parentAuthorName } = item;

  const official = comment.author.isOfficial || comment.author.type === 'STAFF';

  /*
   * بیشتر از دو سطح تو رفتگی
   * بصری ایجاد نمی‌کنیم.
   */
  const visualDepth = Math.min(depth, 2);

  const indentation = visualDepth === 0 ? 0 : visualDepth === 1 ? 16 : 32;

  const showMention = depth > 2 && parentAuthorName;

  const isReplyOpen = activeReplyId === comment.id;

  return (
    <article
      style={{
        marginInlineStart: `${indentation}px`,
      }}
      className={
        depth === 0
          ? 'rounded-card border border-border bg-surface p-5 sm:p-6'
          : 'rounded-control border border-border/80 bg-surface-muted p-4 sm:p-5'
      }
    >
      <div className='flex items-start gap-3'>
        <AuthorAvatar official={official} identity={identity} />

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='font-extrabold text-foreground'>{comment.author.displayName}</p>

            {official ? (
              <span className='rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white'>
                {identity.badgeLabel}
              </span>
            ) : null}
          </div>

          <p className='mt-1 text-xs text-foreground-muted'>{formatDate(comment.publishedAt)}</p>
        </div>
      </div>

      <div className='mt-4 text-sm leading-8 text-foreground-secondary'>
        {showMention ? (
          <span className='me-1 font-bold text-brand'>@{parentAuthorName}</span>
        ) : null}

        <span className='whitespace-pre-line'>{comment.body}</span>
      </div>

      <div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          iconStart={<MessageSquareReply />}
          onClick={() => {
            if (isReplyOpen) {
              onCancelReply();

              return;
            }

            onStartReply(comment.id);
          }}
        >
          {isReplyOpen ? 'بستن پاسخ' : 'پاسخ'}
        </Button>

        {!official ? (
          <StorefrontContentReportButton targetType='BLOG_COMMENT' targetId={comment.id} />
        ) : null}
      </div>

      <div
        className={
          isReplyOpen
            ? 'grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out'
            : 'grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out'
        }
      >
        <div className='overflow-hidden'>
          <div className='mt-4 border-t border-border pt-4'>
            <Textarea
              value={isReplyOpen ? replyBody : ''}
              rows={3}
              maxLength={3000}
              placeholder={`پاسخ به ${comment.author.displayName}...`}
              onChange={(event) => onReplyBodyChange(event.target.value)}
            />

            <div className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
              <span dir='ltr' className='numeric text-xs text-foreground-muted'>
                {toPersianDigits(String(replyBody.length))}
                {' / '}
                {toPersianDigits('3000')}
              </span>

              <Button
                type='button'
                size='sm'
                disabled={replyBody.trim().length < 2}
                isLoading={isSubmittingReply}
                loadingLabel='در حال ثبت'
                iconStart={<Send />}
                onClick={() => onSubmitReply(comment.id)}
              >
                ثبت پاسخ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function StorefrontBlogComments({ slug, initialComments }: StorefrontBlogCommentsProps) {
  const { status, openLogin } = useStorefrontCustomerAuth();

  const { toast } = useToast();

  const [commentsResponse, setCommentsResponse] = useState<StorefrontBlogCommentsResponse | null>(
    initialComments,
  );

  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);

  const [commentBody, setCommentBody] = useState('');

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [pendingCommentAfterLogin, setPendingCommentAfterLogin] = useState(false);

  const [pendingReplyAfterLogin, setPendingReplyAfterLogin] = useState<string | null>(null);

  const [pendingSubmissionMessage, setPendingSubmissionMessage] = useState<string | null>(null);

  const loadComments = useCallback(
    async (page = 1) => {
      setIsLoading(true);

      try {
        const response = await storefrontBlogInteractionsApi.getComments(slug, {
          page,

          limit: COMMENTS_PAGE_SIZE,
        });

        setCommentsResponse(response);
      } catch (error) {
        toast({
          position: 'top-left',

          variant: 'danger',

          title: getErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [slug, toast],
  );

  useEffect(() => {
    if (!initialComments) {
      void loadComments();
    }
  }, [initialComments, loadComments]);

  const submitComment = useCallback(async () => {
    const normalized = commentBody.trim();

    if (normalized.length < 2) {
      toast({
        position: 'top-left',

        variant: 'warning',

        title: 'دیدگاه خود را بنویسید',
      });

      return;
    }

    if (status !== 'authenticated') {
      setPendingCommentAfterLogin(true);

      openLogin();

      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await storefrontBlogInteractionsApi.createComment(slug, {
        body: normalized,
      });

      setCommentBody('');

      setIsCommentFormOpen(false);

      setPendingSubmissionMessage(
        'دیدگاه شما ثبت شد و پس از بررسی پارت‌سنج در این صفحه نمایش داده می‌شود.',
      );

      toast({
        position: 'top-left',

        variant: 'success',

        title: response.message ?? 'دیدگاه شما ثبت شد',
      });
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });
    } finally {
      setIsSubmittingComment(false);
    }
  }, [commentBody, openLogin, slug, status, toast]);

  const submitReply = useCallback(
    async (commentId: string) => {
      const normalized = replyBody.trim();

      if (normalized.length < 2) {
        toast({
          position: 'top-left',

          variant: 'warning',

          title: 'پاسخ خود را بنویسید',
        });

        return;
      }

      if (status !== 'authenticated') {
        setPendingReplyAfterLogin(commentId);

        openLogin();

        return;
      }

      setIsSubmittingReply(true);

      try {
        const response = await storefrontBlogInteractionsApi.createComment(slug, {
          body: normalized,

          parentId: commentId,
        });

        setReplyBody('');

        setActiveReplyId(null);

        setPendingSubmissionMessage('پاسخ شما ثبت شد و پس از بررسی پارت‌سنج نمایش داده می‌شود.');

        toast({
          position: 'top-left',

          variant: 'success',

          title: response.message ?? 'پاسخ شما ثبت شد',
        });
      } catch (error) {
        toast({
          position: 'top-left',

          variant: 'danger',

          title: getErrorMessage(error),
        });
      } finally {
        setIsSubmittingReply(false);
      }
    },
    [openLogin, replyBody, slug, status, toast],
  );

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    if (pendingCommentAfterLogin) {
      setPendingCommentAfterLogin(false);

      void submitComment();
    }

    if (pendingReplyAfterLogin) {
      const commentId = pendingReplyAfterLogin;

      setPendingReplyAfterLogin(null);

      void submitReply(commentId);
    }
  }, [pendingCommentAfterLogin, pendingReplyAfterLogin, status, submitComment, submitReply]);

  const loadMore = async () => {
    if (!commentsResponse || isLoading) {
      return;
    }

    const nextPage = commentsResponse.meta.page + 1;

    if (nextPage > commentsResponse.meta.totalPages) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await storefrontBlogInteractionsApi.getComments(slug, {
        page: nextPage,

        limit: COMMENTS_PAGE_SIZE,
      });

      setCommentsResponse({
        ...response,

        data: {
          ...response.data,

          comments: [...commentsResponse.data.comments, ...response.data.comments],
        },
      });
    } catch (error) {
      toast({
        position: 'top-left',

        variant: 'danger',

        title: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const flatComments = useMemo(
    () => flattenComments(commentsResponse?.data.comments ?? []),
    [commentsResponse?.data.comments],
  );

  const identity = commentsResponse?.data.officialIdentity ?? {
    displayName: 'پارت‌سنج',

    avatarUrl: null,

    badgeLabel: 'پاسخ رسمی پارت‌سنج',
  };

  const hasMore = Boolean(
    commentsResponse && commentsResponse.meta.page < commentsResponse.meta.totalPages,
  );

  if (commentsResponse?.data.enabled === false) {
    return null;
  }

  return (
    <section
      id='comments'
      className='mt-12 overflow-hidden rounded-card border border-border bg-surface shadow-panel'
    >
      <div className='border-b border-border bg-surface-muted px-5 py-5 sm:px-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
              <MessagesSquare className='size-5' />
            </span>

            <div>
              <h2 className='text-lg font-extrabold text-foreground'>دیدگاه‌ها</h2>

              <p className='mt-1 text-sm text-foreground-secondary'>
                {toPersianDigits(String(commentsResponse?.data.commentsCount ?? 0))} دیدگاه تأییدشده
              </p>
            </div>
          </div>

          <Button
            type='button'
            variant={isCommentFormOpen ? 'outline' : 'primary'}
            iconStart={<MessageCircle />}
            onClick={() => setIsCommentFormOpen((current) => !current)}
          >
            {isCommentFormOpen ? 'بستن فرم' : 'ثبت دیدگاه'}
          </Button>
        </div>
      </div>

      <div
        className={
          isCommentFormOpen
            ? 'grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-out'
            : 'grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out'
        }
      >
        <div className='overflow-hidden'>
          <div className='border-b border-border p-5 sm:p-6'>
            <div className='rounded-card border border-brand/20 bg-brand-soft/20 p-4 sm:p-5'>
              <p className='font-extrabold text-foreground'>
                نظر یا تجربه‌ای درباره این مطلب دارید؟
              </p>

              <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                دیدگاه شما می‌تواند به کامل‌تر شدن بحث و تجربه کاربران دیگر کمک کند.
              </p>

              <Textarea
                value={commentBody}
                rows={4}
                maxLength={3000}
                className='mt-4'
                placeholder='دیدگاه خود را بنویسید...'
                onChange={(event) => setCommentBody(event.target.value)}
              />

              <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <span dir='ltr' className='numeric text-xs text-foreground-muted'>
                  {toPersianDigits(String(commentBody.length))}
                  {' / '}
                  {toPersianDigits('3000')}
                </span>

                <Button
                  type='button'
                  disabled={commentBody.trim().length < 2}
                  isLoading={isSubmittingComment}
                  loadingLabel='در حال ثبت'
                  iconStart={<Send />}
                  onClick={() => void submitComment()}
                >
                  ثبت دیدگاه
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingSubmissionMessage ? (
        <div className='border-b border-border px-5 py-4 sm:px-6'>
          <div className='rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm leading-6 font-semibold text-warning'>
            {pendingSubmissionMessage}
          </div>
        </div>
      ) : null}

      <div className='p-5 sm:p-6'>
        {isLoading && !commentsResponse ? (
          <div className='flex justify-center py-12'>
            <LoaderCircle className='size-6 animate-spin text-brand' />
          </div>
        ) : flatComments.length > 0 ? (
          <div className='space-y-4'>
            {flatComments.map((item) => (
              <BlogCommentItem
                key={item.comment.id}
                item={item}
                identity={identity}
                activeReplyId={activeReplyId}
                replyBody={activeReplyId === item.comment.id ? replyBody : ''}
                isSubmittingReply={isSubmittingReply}
                onStartReply={(commentId) => {
                  setActiveReplyId(commentId);

                  setReplyBody('');
                }}
                onCancelReply={() => {
                  setActiveReplyId(null);

                  setReplyBody('');
                }}
                onReplyBodyChange={setReplyBody}
                onSubmitReply={(commentId) => void submitReply(commentId)}
              />
            ))}

            {hasMore ? (
              <div className='flex justify-center pt-3'>
                <Button
                  type='button'
                  variant='outline'
                  isLoading={isLoading}
                  loadingLabel='در حال دریافت'
                  onClick={() => void loadMore()}
                >
                  مشاهده دیدگاه‌های بیشتر
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className='rounded-card border border-dashed border-border bg-surface-muted px-5 py-12 text-center'>
            <MessagesSquare className='mx-auto size-10 text-foreground-muted' />

            <p className='mt-4 font-extrabold text-foreground'>هنوز دیدگاهی ثبت نشده</p>

            <p className='mt-1 text-sm leading-7 text-foreground-muted'>
              اولین نفری باشید که درباره این مطلب نظر می‌دهد.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
