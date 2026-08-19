'use client';

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

import type {
  AdminContentReport,
  AdminContentReportStatus,
} from '@/lib/admin/interactions/reports/admin-content-report.types';

import {
  getAdminContentReportReasonLabel,
  getAdminContentReportStatusLabel,
  getAdminContentReportTargetTypeLabel,
} from '@/lib/admin/interactions/reports/admin-content-report.types';

import { toPersianDigits } from '@/lib/utils/digits';

import { Ban, CheckCheck, ExternalLink, Flag, Star, UserRound } from 'lucide-react';

import Link from 'next/link';

type AdminContentReportDetailsSheetProps = {
  report: AdminContentReport | null;

  open: boolean;

  isMutating: boolean;

  onOpenChange: (open: boolean) => void;

  onUpdateStatus: (
    report: AdminContentReport,
    status: Exclude<AdminContentReportStatus, 'OPEN'>,
  ) => Promise<void>;
};

function getStatusVariant(status: AdminContentReportStatus) {
  switch (status) {
    case 'OPEN':
      return 'warning' as const;

    case 'RESOLVED':
      return 'success' as const;

    case 'DISMISSED':
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

function getReporterName(report: AdminContentReport) {
  const fullName = [report.reporter.firstName, report.reporter.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || report.reporter.mobile;
}

function getTargetHref(report: AdminContentReport) {
  if (report.target?.product?.slug) {
    return `/products/${report.target.product.slug}`;
  }

  if (report.target?.blogPost?.slug) {
    return `/blog/${report.target.blogPost.slug}`;
  }

  return null;
}

function getTargetTitle(report: AdminContentReport) {
  if (report.target?.product) {
    return report.target.product.name;
  }

  if (report.target?.blogPost) {
    return report.target.blogPost.title;
  }

  return 'محتوای مرتبط';
}

export function AdminContentReportDetailsSheet({
  report,
  open,
  isMutating,
  onOpenChange,
  onUpdateStatus,
}: AdminContentReportDetailsSheetProps) {
  if (!report) {
    return null;
  }

  const targetHref = getTargetHref(report);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='left' className='max-w-xl'>
        <SheetHeader>
          <SheetTitle>بررسی گزارش کاربر</SheetTitle>

          <SheetDescription>گزارش شماره {toPersianDigits(report.id.slice(0, 8))}</SheetDescription>
        </SheetHeader>

        <SheetBody className='space-y-6'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant={getStatusVariant(report.status)} dot>
              {getAdminContentReportStatusLabel(report.status)}
            </Badge>

            <Badge variant='info'>{getAdminContentReportTargetTypeLabel(report.targetType)}</Badge>

            <Badge variant='danger' startIcon={<Flag />}>
              {getAdminContentReportReasonLabel(report.reason)}
            </Badge>
          </div>

          <section className='rounded-card border border-border bg-surface-muted p-4'>
            <div className='flex items-start gap-3'>
              <span className='grid size-10 shrink-0 place-items-center rounded-full bg-surface text-foreground-muted'>
                <UserRound className='size-5' />
              </span>

              <div className='min-w-0'>
                <p className='text-xs font-bold text-foreground-muted'>گزارش‌دهنده</p>

                <p className='mt-1 font-extrabold text-foreground'>{getReporterName(report)}</p>

                <p dir='ltr' className='mt-1 text-right text-xs text-foreground-muted'>
                  {toPersianDigits(report.reporter.mobile)}
                </p>
              </div>
            </div>
          </section>

          <section>
            <p className='text-xs font-bold text-foreground-muted'>دلیل گزارش</p>

            <p className='mt-2 font-extrabold text-foreground'>
              {getAdminContentReportReasonLabel(report.reason)}
            </p>

            {report.details ? (
              <div className='mt-3 rounded-control border border-border bg-surface-muted p-4'>
                <p className='text-sm leading-7 whitespace-pre-line text-foreground-secondary'>
                  {report.details}
                </p>
              </div>
            ) : (
              <p className='mt-2 text-sm text-foreground-muted'>توضیح تکمیلی ثبت نشده است.</p>
            )}
          </section>

          <section>
            <div className='flex items-center justify-between gap-3'>
              <p className='text-xs font-bold text-foreground-muted'>محتوای گزارش‌شده</p>

              {targetHref ? (
                <Link
                  href={targetHref}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1.5 text-xs font-bold text-brand transition-opacity hover:opacity-70'
                >
                  مشاهده صفحه
                  <ExternalLink className='size-3.5' />
                </Link>
              ) : null}
            </div>

            <div className='mt-2 rounded-card border border-danger/20 bg-danger-soft/30 p-4'>
              {report.target?.rating ? (
                <div className='mb-3 flex items-center gap-1 text-brand'>
                  <Star className='size-4 fill-brand' />

                  <span className='text-sm font-extrabold'>
                    {toPersianDigits(String(report.target.rating))}
                    {' از '}
                    {toPersianDigits('5')}
                  </span>
                </div>
              ) : null}

              <p className='text-sm leading-8 whitespace-pre-line text-foreground-secondary'>
                {report.target?.body || 'متن این محتوا در دسترس نیست.'}
              </p>
            </div>
          </section>

          <section className='rounded-card border border-border bg-surface p-4'>
            <p className='text-xs font-bold text-foreground-muted'>صفحه مرتبط</p>

            <p className='mt-2 font-extrabold text-foreground'>{getTargetTitle(report)}</p>

            {report.target?.product?.sku ? (
              <p dir='ltr' className='mt-1 text-right text-xs text-foreground-muted'>
                SKU: {report.target.product.sku}
              </p>
            ) : null}
          </section>

          <section className='grid gap-3 sm:grid-cols-2'>
            <div className='rounded-control border border-border p-3'>
              <p className='text-xs text-foreground-muted'>زمان گزارش</p>

              <p className='mt-1 text-sm font-semibold text-foreground'>
                {formatDateTime(report.createdAt)}
              </p>
            </div>

            <div className='rounded-control border border-border p-3'>
              <p className='text-xs text-foreground-muted'>زمان رسیدگی</p>

              <p className='mt-1 text-sm font-semibold text-foreground'>
                {formatDateTime(report.resolvedAt)}
              </p>
            </div>
          </section>
        </SheetBody>

        <SheetFooter>
          {report.status !== 'DISMISSED' ? (
            <Button
              type='button'
              variant='outline'
              disabled={isMutating}
              iconStart={<Ban />}
              onClick={() => void onUpdateStatus(report, 'DISMISSED')}
            >
              رد گزارش
            </Button>
          ) : null}

          {report.status !== 'RESOLVED' ? (
            <Button
              type='button'
              disabled={isMutating}
              isLoading={isMutating}
              loadingLabel='در حال ثبت'
              iconStart={<CheckCheck />}
              onClick={() => void onUpdateStatus(report, 'RESOLVED')}
            >
              رسیدگی شد
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
