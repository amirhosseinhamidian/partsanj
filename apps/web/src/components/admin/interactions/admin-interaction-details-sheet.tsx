'use client';

import type {
  AdminInteraction,
  AdminInteractionStatus,
} from '@/lib/admin/interactions/admin-interaction.types';

import {
  getAdminInteractionSourceLabel,
  getAdminInteractionStatusLabel,
  getAdminInteractionTypeLabel,
} from '@/lib/admin/interactions/admin-interaction.types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { Textarea } from '@/components/ui/textarea';

import { toPersianDigits } from '@/lib/utils/digits';

import { Ban, Check, MessageSquareReply, ShieldCheck, Trash2, X } from 'lucide-react';

import { useEffect, useState } from 'react';

type AdminInteractionDetailsSheetProps = {
  interaction: AdminInteraction | null;

  open: boolean;

  isMutating: boolean;

  onOpenChange: (open: boolean) => void;

  onModerate: (interaction: AdminInteraction, status: AdminInteractionStatus) => Promise<void>;

  onReply: (interaction: AdminInteraction, body: string) => Promise<void>;
};

function getStatusVariant(status: AdminInteractionStatus) {
  switch (status) {
    case 'APPROVED':
      return 'success' as const;

    case 'PENDING':
      return 'warning' as const;

    case 'REJECTED':
      return 'danger' as const;

    case 'SPAM':
      return 'danger' as const;

    case 'DELETED':
      return 'neutral' as const;
  }
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getAuthorName(interaction: AdminInteraction) {
  if (interaction.authorDisplayName?.trim()) {
    return interaction.authorDisplayName;
  }

  if (interaction.authorUser) {
    const fullName = [interaction.authorUser.firstName, interaction.authorUser.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (fullName) {
      return fullName;
    }

    return interaction.authorUser.mobile;
  }

  return interaction.authorType === 'STAFF' ? 'پارت‌سنج' : 'کاربر';
}

export function AdminInteractionDetailsSheet({
  interaction,
  open,
  isMutating,
  onOpenChange,
  onModerate,
  onReply,
}: AdminInteractionDetailsSheetProps) {
  const [replyBody, setReplyBody] = useState('');

  useEffect(() => {
    setReplyBody('');
  }, [interaction?.id]);

  if (!interaction) {
    return null;
  }

  const canReply = interaction.status !== 'SPAM' && interaction.status !== 'DELETED';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='left' className='max-w-xl'>
        <SheetHeader>
          <SheetTitle>بررسی محتوا</SheetTitle>

          <SheetDescription>
            {getAdminInteractionTypeLabel(interaction.type)}
            {' · '}
            {interaction.target.title}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className='space-y-6'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant={getStatusVariant(interaction.status)} dot>
              {getAdminInteractionStatusLabel(interaction.status)}
            </Badge>

            <Badge variant='neutral'>{getAdminInteractionSourceLabel(interaction.source)}</Badge>

            {interaction.isVerifiedPurchase ? (
              <Badge variant='success' startIcon={<ShieldCheck />}>
                خریدار تأییدشده
              </Badge>
            ) : null}
          </div>

          <section className='rounded-card border border-border bg-surface-muted p-4'>
            <p className='text-xs font-bold text-foreground-muted'>نویسنده</p>

            <p className='mt-1 font-extrabold text-foreground'>{getAuthorName(interaction)}</p>

            {interaction.authorUser?.mobile ? (
              <p dir='ltr' className='mt-1 text-right text-xs text-foreground-muted'>
                {toPersianDigits(interaction.authorUser.mobile)}
              </p>
            ) : null}
          </section>

          <section>
            <p className='text-xs font-bold text-foreground-muted'>محتوا</p>

            {interaction.rating ? (
              <p className='mt-2 text-sm font-extrabold text-brand'>
                {toPersianDigits(String(interaction.rating))}
                {' از '}
                {toPersianDigits('5')} ★
              </p>
            ) : null}

            <div className='mt-2 rounded-card border border-border bg-surface p-4'>
              <p className='text-sm leading-8 whitespace-pre-line text-foreground-secondary'>
                {interaction.body ?? 'متن جداگانه‌ای ثبت نشده است.'}
              </p>
            </div>
          </section>

          <section className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-control border border-border p-3'>
              <p className='text-xs text-foreground-muted'>مقصد</p>

              <p className='mt-1 text-sm font-bold text-foreground'>{interaction.target.title}</p>

              {interaction.target.sku ? (
                <p dir='ltr' className='mt-1 text-right text-xs text-foreground-muted'>
                  SKU: {interaction.target.sku}
                </p>
              ) : null}
            </div>

            <div className='rounded-control border border-border p-3'>
              <p className='text-xs text-foreground-muted'>زمان ثبت</p>

              <p className='mt-1 text-sm font-semibold text-foreground'>
                {formatDateTime(interaction.createdAt)}
              </p>
            </div>
          </section>

          {canReply ? (
            <section className='rounded-card border border-brand/20 bg-brand-soft/20 p-4'>
              <div className='flex items-center gap-2'>
                <MessageSquareReply className='size-5 text-brand' />

                <div>
                  <p className='font-extrabold text-foreground'>پاسخ رسمی پارت‌سنج</p>

                  <p className='mt-1 text-xs leading-5 text-foreground-muted'>
                    پاسخ ادمین بدون انتظار برای تأیید منتشر می‌شود.
                  </p>
                </div>
              </div>

              <Textarea
                value={replyBody}
                rows={4}
                maxLength={3000}
                className='mt-4'
                placeholder='پاسخ رسمی را بنویسید...'
                disabled={isMutating}
                onChange={(event) => setReplyBody(event.target.value)}
              />

              <div className='mt-3 flex justify-end'>
                <Button
                  type='button'
                  size='sm'
                  disabled={replyBody.trim().length < 2 || isMutating}
                  isLoading={isMutating}
                  loadingLabel='در حال ثبت'
                  iconStart={<MessageSquareReply />}
                  onClick={async () => {
                    await onReply(interaction, replyBody.trim());

                    setReplyBody('');
                  }}
                >
                  ثبت پاسخ رسمی
                </Button>
              </div>
            </section>
          ) : null}
        </SheetBody>

        <SheetFooter className='flex-wrap'>
          {interaction.status !== 'APPROVED' ? (
            <Button
              type='button'
              size='sm'
              disabled={isMutating}
              iconStart={<Check />}
              onClick={() => void onModerate(interaction, 'APPROVED')}
            >
              تأیید
            </Button>
          ) : null}

          {interaction.status !== 'REJECTED' ? (
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={isMutating}
              iconStart={<X />}
              onClick={() => void onModerate(interaction, 'REJECTED')}
            >
              رد
            </Button>
          ) : null}

          {interaction.status !== 'SPAM' ? (
            <Button
              type='button'
              size='sm'
              variant='outline'
              disabled={isMutating}
              iconStart={<Ban />}
              onClick={() => void onModerate(interaction, 'SPAM')}
            >
              هرزنامه
            </Button>
          ) : null}

          {interaction.status !== 'DELETED' ? (
            <Button
              type='button'
              size='sm'
              variant='danger'
              disabled={isMutating}
              iconStart={<Trash2 />}
              onClick={() => {
                const confirmed = window.confirm('این محتوا حذف شود؟');

                if (confirmed) {
                  void onModerate(interaction, 'DELETED');
                }
              }}
            >
              حذف
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
