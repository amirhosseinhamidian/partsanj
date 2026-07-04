'use client';

import { PaymentAttemptStatusBadge } from '@/components/admin/orders/admin-order-badges';
import {
  formatDateTime,
  formatToman,
  getCustomerDisplayName,
} from '@/lib/admin/orders/admin-order-presentation';
import type {
  AdminOrderAuditLog,
  AdminOrderPaymentAttempt,
} from '@/lib/admin/orders/admin-order.types';
import { toPersianDigits } from '@/lib/utils/digits';
import { CircleAlert, CreditCard, History } from 'lucide-react';

type UnknownRecord = Record<string, unknown>;

type AuditFieldChange = {
  before: unknown;
  after: unknown;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: UnknownRecord | null, key: string): string | null {
  const currentValue = value?.[key];

  if (typeof currentValue === 'string' && currentValue.trim()) {
    return currentValue.trim();
  }

  if (typeof currentValue === 'number' && Number.isFinite(currentValue)) {
    return String(currentValue);
  }

  return null;
}

function readNumber(value: UnknownRecord | null, key: string): number | null {
  const currentValue = value?.[key];

  return typeof currentValue === 'number' && Number.isFinite(currentValue) ? currentValue : null;
}

function PaymentMetaRow({
  label,
  value,
  dir,
}: {
  label: string;
  value: string | null;
  dir?: 'ltr' | 'rtl';
}) {
  if (!value) {
    return null;
  }

  return (
    <div className='flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0'>
      <span className='shrink-0 text-xs text-foreground-muted'>{label}</span>

      <span
        dir={dir}
        className='min-w-0 text-end text-xs font-semibold break-all text-foreground-secondary'
      >
        {value}
      </span>
    </div>
  );
}

function PaymentAttemptMetadataDetails({ attempt }: { attempt: AdminOrderPaymentAttempt }) {
  const requestMetadata = isRecord(attempt.requestMetadata) ? attempt.requestMetadata : null;

  const responseMetadata = isRecord(attempt.responseMetadata) ? attempt.responseMetadata : null;

  const callbackPayload = isRecord(attempt.callbackPayload) ? attempt.callbackPayload : null;

  const verificationPayload = isRecord(attempt.verificationPayload)
    ? attempt.verificationPayload
    : null;

  const requestCurrency = readText(requestMetadata, 'currency');

  const requestAmountToman = readNumber(requestMetadata, 'amountToman');

  const requestOrderNumber = readText(requestMetadata, 'orderNumber');

  const responseCode = readText(responseMetadata, 'code');

  const responseMessage = readText(responseMetadata, 'message');

  const callbackStatus = readText(callbackPayload, 'Status');

  const callbackAuthority = readText(callbackPayload, 'Authority');

  const verificationCode = readText(verificationPayload, 'code');

  const verificationMessage = readText(verificationPayload, 'message');

  const verificationReferenceId =
    readText(verificationPayload, 'refId') ??
    attempt.providerReferenceId ??
    attempt.providerReference;

  const verificationCardPan =
    readText(verificationPayload, 'cardPan') ?? attempt.providerCardPan ?? attempt.maskedCardNumber;

  const verificationFee = readNumber(verificationPayload, 'fee');

  const hasRequestDetails = Boolean(
    requestCurrency || requestAmountToman !== null || requestOrderNumber,
  );

  const hasResponseDetails = Boolean(responseCode || responseMessage);

  const hasCallbackDetails = Boolean(callbackStatus || callbackAuthority);

  const hasVerificationDetails = Boolean(
    verificationCode ||
    verificationMessage ||
    verificationReferenceId ||
    verificationCardPan ||
    verificationFee !== null,
  );

  if (!hasRequestDetails && !hasResponseDetails && !hasCallbackDetails && !hasVerificationDetails) {
    return null;
  }

  return (
    <details className='mt-4 rounded-control border border-border bg-surface-muted'>
      <summary className='cursor-pointer px-3 py-3 text-xs font-bold text-foreground-secondary'>
        مشاهده جزئیات تراکنش
      </summary>

      <div className='grid gap-4 border-t border-border p-3 lg:grid-cols-2'>
        {hasRequestDetails ? (
          <div className='rounded-control border border-border bg-surface p-3'>
            <p className='text-xs font-extrabold text-foreground'>اطلاعات درخواست پرداخت</p>

            <div className='mt-2'>
              <PaymentMetaRow label='واحد پول' value={requestCurrency} dir='ltr' />

              <PaymentMetaRow
                label='مبلغ درخواست'
                value={requestAmountToman !== null ? formatToman(requestAmountToman) : null}
              />

              <PaymentMetaRow label='شماره سفارش' value={requestOrderNumber} dir='ltr' />
            </div>
          </div>
        ) : null}

        {hasResponseDetails ? (
          <div className='rounded-control border border-border bg-surface p-3'>
            <p className='text-xs font-extrabold text-foreground'>پاسخ درگاه</p>

            <div className='mt-2'>
              <PaymentMetaRow label='کد پاسخ' value={responseCode} dir='ltr' />

              <PaymentMetaRow label='پیام درگاه' value={responseMessage} />
            </div>
          </div>
        ) : null}

        {hasCallbackDetails ? (
          <div className='rounded-control border border-border bg-surface p-3'>
            <p className='text-xs font-extrabold text-foreground'>بازگشت از درگاه</p>

            <div className='mt-2'>
              <PaymentMetaRow label='وضعیت بازگشت' value={callbackStatus} dir='ltr' />

              <PaymentMetaRow label='Authority' value={callbackAuthority} dir='ltr' />
            </div>
          </div>
        ) : null}

        {hasVerificationDetails ? (
          <div className='rounded-control border border-border bg-surface p-3'>
            <p className='text-xs font-extrabold text-foreground'>تأیید نهایی پرداخت</p>

            <div className='mt-2'>
              <PaymentMetaRow label='کد تأیید' value={verificationCode} dir='ltr' />

              <PaymentMetaRow label='پیام تأیید' value={verificationMessage} />

              <PaymentMetaRow label='شماره مرجع' value={verificationReferenceId} dir='ltr' />

              <PaymentMetaRow label='کارت پرداخت' value={verificationCardPan} dir='ltr' />

              <PaymentMetaRow
                label='کارمزد'
                value={verificationFee !== null ? formatToman(verificationFee) : null}
              />
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function getAuditFields(changes: unknown): UnknownRecord | null {
  if (!isRecord(changes) || !isRecord(changes.fields)) {
    return null;
  }

  return changes.fields;
}

function getAuditFieldChange(fields: UnknownRecord, key: string): AuditFieldChange | null {
  const value = fields[key];

  if (
    !isRecord(value) ||
    !Object.prototype.hasOwnProperty.call(value, 'before') ||
    !Object.prototype.hasOwnProperty.call(value, 'after')
  ) {
    return null;
  }

  return {
    before: value.before,
    after: value.after,
  };
}

const orderStatusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PAID: 'پرداخت‌شده',
  PROCESSING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال‌شده',
  DELIVERED: 'تحویل‌شده',
  CANCELLED: 'لغوشده',
  EXPIRED: 'منقضی‌شده',
};

function formatAuditValue(value: unknown, fieldKey: string): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (fieldKey === 'status' && typeof value === 'string') {
    return orderStatusLabels[value] ?? value;
  }

  if (fieldKey.endsWith('At') && typeof value === 'string') {
    return formatDateTime(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'بله' : 'خیر';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return 'ثبت شده';
}

function AuditChangeRow({
  label,
  fieldKey,
  change,
  dir,
}: {
  label: string;
  fieldKey: string;
  change: AuditFieldChange;
  dir?: 'ltr' | 'rtl';
}) {
  const before = formatAuditValue(change.before, fieldKey);

  const after = formatAuditValue(change.after, fieldKey);

  const hasBefore = change.before !== null && change.before !== undefined && change.before !== '';

  const hasAfter = change.after !== null && change.after !== undefined && change.after !== '';

  return (
    <div className='flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5'>
      <span className='shrink-0 text-xs font-bold text-foreground-muted'>{label}</span>

      <p dir={dir} className='text-sm leading-6 text-foreground-secondary sm:text-end'>
        {!hasBefore && hasAfter ? (
          <>
            ثبت شد: <span className='font-bold text-foreground'>{after}</span>
          </>
        ) : hasBefore && !hasAfter ? (
          <>
            حذف شد، مقدار قبلی: <span className='font-bold text-foreground'>{before}</span>
          </>
        ) : (
          <>
            از <span className='font-bold text-foreground'>{before}</span> به{' '}
            <span className='font-bold text-foreground'>{after}</span>
          </>
        )}
      </p>
    </div>
  );
}

function OrderAuditChangeDetails({ changes }: { changes: unknown }) {
  const fields = getAuditFields(changes);

  if (!fields) {
    return null;
  }

  const rows = [
    {
      key: 'status',
      label: 'وضعیت سفارش',
    },
    {
      key: 'shippingCarrier',
      label: 'شرکت حمل',
    },
    {
      key: 'trackingCode',
      label: 'کد رهگیری',
      dir: 'ltr' as const,
    },
    {
      key: 'shipmentNote',
      label: 'یادداشت ارسال',
    },
    {
      key: 'shippedAt',
      label: 'زمان ارسال',
    },
    {
      key: 'deliveredAt',
      label: 'زمان تحویل',
    },
    {
      key: 'cancelledAt',
      label: 'زمان لغو',
    },
    {
      key: 'cancellationReason',
      label: 'دلیل لغو',
    },
  ]
    .map((definition) => ({
      ...definition,
      change: getAuditFieldChange(fields, definition.key),
    }))
    .filter(
      (
        item,
      ): item is {
        key: string;
        label: string;
        dir?: 'ltr';
        change: AuditFieldChange;
      } => item.change !== null,
    );

  if (rows.length === 0) {
    return null;
  }

  return (
    <details className='mt-4 rounded-control border border-border bg-surface-muted'>
      <summary className='cursor-pointer px-3 py-3 text-xs font-bold text-foreground-secondary'>
        مشاهده جزئیات تغییر
      </summary>

      <div className='border-t border-border px-3'>
        {rows.map((row) => (
          <AuditChangeRow
            key={row.key}
            label={row.label}
            fieldKey={row.key}
            change={row.change}
            dir={row.dir}
          />
        ))}
      </div>
    </details>
  );
}

function getAuditTitle(log: AdminOrderAuditLog) {
  const changes =
    typeof log.changes === 'object' && log.changes !== null
      ? (log.changes as Record<string, unknown>)
      : null;

  const event = typeof changes?.event === 'string' ? changes.event : null;

  switch (event) {
    case 'admin_order_processing_started':
      return 'شروع آماده‌سازی سفارش';

    case 'admin_order_shipment_registered':
      return 'ثبت اطلاعات ارسال';

    case 'admin_order_delivered':
      return 'ثبت تحویل سفارش';

    case 'admin_order_cancelled':
      return 'لغو سفارش';

    default:
      return log.action;
  }
}

export function AdminOrderPaymentAttemptsSection({
  attempts,
}: {
  attempts: AdminOrderPaymentAttempt[];
}) {
  return (
    <section className='rounded-card border border-border bg-surface shadow-panel'>
      <header className='flex items-center gap-2 border-b border-border px-5 py-4'>
        <CreditCard className='size-5 text-brand' />

        <div>
          <h2 className='font-extrabold text-foreground'>سوابق پرداخت</h2>

          <p className='mt-1 text-sm text-foreground-secondary'>
            تلاش‌های ثبت‌شده برای پرداخت این سفارش
          </p>
        </div>
      </header>

      {attempts.length === 0 ? (
        <div className='px-5 py-10 text-center text-sm text-foreground-muted'>
          هنوز تلاش پرداختی برای این سفارش ثبت نشده است
        </div>
      ) : (
        <div className='divide-y divide-border'>
          {attempts.map((attempt) => (
            <article key={attempt.id} className='p-5'>
              <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-start'>
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='font-extrabold text-foreground'>
                      تلاش شماره {new Intl.NumberFormat('fa-IR').format(attempt.attemptNumber)}
                    </p>

                    <PaymentAttemptStatusBadge status={attempt.status} />
                  </div>

                  <p className='mt-2 text-sm text-foreground-secondary'>
                    {attempt.providerCode} · {formatToman(attempt.amountToman)}
                  </p>
                </div>

                <p className='text-xs text-foreground-muted'>{formatDateTime(attempt.createdAt)}</p>
              </div>

              <div className='mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4'>
                <div>
                  <p className='text-xs text-foreground-muted'>Authority / Session</p>

                  <p dir='ltr' className='mt-1 break-all text-foreground-secondary'>
                    {attempt.providerSessionId ?? '—'}
                  </p>
                </div>

                <div>
                  <p className='text-xs text-foreground-muted'>شماره مرجع</p>

                  <p dir='ltr' className='mt-1 break-all text-foreground-secondary'>
                    {attempt.providerReferenceId ?? attempt.providerReference ?? '—'}
                  </p>
                </div>

                <div>
                  <p className='text-xs text-foreground-muted'>زمان تأیید</p>

                  <p className='mt-1 text-foreground-secondary'>
                    {formatDateTime(attempt.verifiedAt)}
                  </p>
                </div>

                <div>
                  <p className='text-xs text-foreground-muted'>کارت پرداخت</p>

                  <p dir='ltr' className='mt-1 text-foreground-secondary'>
                    {attempt.providerCardPan ?? attempt.maskedCardNumber ?? '—'}
                  </p>
                </div>
              </div>

              {attempt.failureMessage ? (
                <div className='mt-4 flex gap-2 rounded-control border border-danger/30 bg-danger-soft p-3'>
                  <CircleAlert className='mt-0.5 size-4 shrink-0 text-danger' />

                  <div>
                    <p className='text-xs font-bold text-danger'>
                      {attempt.failureCode ?? 'PAYMENT_ERROR'}
                    </p>

                    <p className='mt-1 text-xs leading-6 text-foreground-secondary'>
                      {attempt.failureMessage}
                    </p>
                  </div>
                </div>
              ) : null}

              <PaymentAttemptMetadataDetails attempt={attempt} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminOrderAuditLogSection({ auditLogs }: { auditLogs: AdminOrderAuditLog[] }) {
  return (
    <section className='rounded-card border border-border bg-surface shadow-panel'>
      <header className='flex items-center gap-2 border-b border-border px-5 py-4'>
        <History className='size-5 text-brand' />

        <div>
          <h2 className='font-extrabold text-foreground'>سوابق عملیات مدیریتی</h2>

          <p className='mt-1 text-sm text-foreground-secondary'>
            تغییرات ثبت‌شده توسط مدیران سیستم
          </p>
        </div>
      </header>

      {auditLogs.length === 0 ? (
        <div className='px-5 py-10 text-center text-sm text-foreground-muted'>
          هنوز عملیات مدیریتی برای این سفارش ثبت نشده است
        </div>
      ) : (
        <div className='divide-y divide-border'>
          {auditLogs.map((log) => (
            <article key={log.id} className='p-5'>
              <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-start'>
                <div>
                  <p className='font-extrabold text-foreground'>{getAuditTitle(log)}</p>

                  <p className='mt-1 text-sm text-foreground-secondary'>
                    توسط {getCustomerDisplayName(log.actorUser)}
                    {' · '}
                    <span dir='ltr'>{toPersianDigits(log.actorUser.mobile)}</span>
                  </p>
                </div>

                <p className='text-xs text-foreground-muted'>{formatDateTime(log.createdAt)}</p>
              </div>

              <OrderAuditChangeDetails changes={log.changes} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
