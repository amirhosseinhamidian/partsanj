'use client';

import type { AdminAuditLog } from '@/lib/admin/audit/audit-log.types';
import {
  getAdminAuditActionLabel,
  getAdminAuditEntityTypeLabel,
} from '@/lib/admin/audit/audit-log.types';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { ImageUrlPreview } from '@/components/ui/image-url-preview';
import { toPersianDigits } from '@/lib/utils/digits';

type AdminAuditLogDetailsSheetProps = {
  auditLog: AdminAuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const fieldLabels: Record<string, string> = {
  sku: 'SKU',
  slug: 'Slug',
  name: 'نام',
  shortDescription: 'توضیح کوتاه',
  description: 'توضیحات',
  specifications: 'مشخصات فنی',
  logoUrl: 'آدرس لوگو',
  imageUrl: 'آدرس تصویر',
  priceToman: 'قیمت پایه',
  salePriceToman: 'قیمت تخفیف',
  saleStartsAt: 'شروع تخفیف',
  saleEndsAt: 'پایان تخفیف',
  stockStatus: 'وضعیت موجودی',
  status: 'وضعیت',
  isPublished: 'انتشار در سایت',
  isTorobEnabled: 'فعال در ترب',
  isActive: 'وضعیت فعال',
  sortOrder: 'ترتیب نمایش',
  parentId: 'دسته‌بندی والد',
  brandId: 'برند',
  categoryId: 'دسته‌بندی',
  make: 'برند خودرو',
  model: 'مدل خودرو',
  engineCode: 'کد موتور',
  engineName: 'نام موتور',
  yearFrom: 'سال شروع',
  yearTo: 'سال پایان',
  yearCalendar: 'نوع تقویم',
  notes: 'یادداشت فنی',
  codes: 'کدهای محصول',
  images: 'تصاویر محصول',
};

const eventLabels: Record<string, string> = {
  admin_brand_created: 'برند جدید ایجاد شد',
  admin_brand_updated: 'اطلاعات برند ویرایش شد',

  admin_category_created: 'دسته‌بندی جدید ایجاد شد',
  admin_category_updated: 'اطلاعات دسته‌بندی ویرایش شد',

  admin_vehicle_make_created: 'برند خودرو ایجاد شد',
  admin_vehicle_make_updated: 'اطلاعات برند خودرو ویرایش شد',

  admin_vehicle_model_created: 'مدل خودرو ایجاد شد',
  admin_vehicle_model_updated: 'اطلاعات مدل خودرو ویرایش شد',

  admin_vehicle_variant_created: 'تیپ یا موتور خودرو ایجاد شد',
  admin_vehicle_variant_updated: 'اطلاعات تیپ یا موتور خودرو ویرایش شد',

  admin_product_created: 'محصول جدید ایجاد شد',
  admin_product_updated: 'اطلاعات محصول ویرایش شد',
  admin_product_archived: 'محصول آرشیو شد',
  admin_product_compatibilities_replaced: 'سازگاری خودروهای محصول تغییر کرد',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatDateTime(value: string): string {
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

function getActorName(auditLog: AdminAuditLog): string {
  const fullName = [auditLog.actorUser.firstName, auditLog.actorUser.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || auditLog.actorUser.mobile;
}

function getActionVariant(action: AdminAuditLog['action']) {
  if (action === 'CREATED') {
    return 'success' as const;
  }

  if (action === 'UPDATED') {
    return 'brand' as const;
  }

  if (action === 'COMPATIBILITIES_UPDATED') {
    return 'info' as const;
  }

  return 'neutral' as const;
}

function AuditValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <span className='text-foreground-muted'>—</span>;
  }

  if (typeof value === 'boolean') {
    return <span>{value ? 'بله' : 'خیر'}</span>;
  }

  if (typeof value === 'number') {
    return <span className='numeric'>{toPersianDigits(value)}</span>;
  }

  if (typeof value === 'string') {
    return <span className='break-words'>{value}</span>;
  }

  return (
    <pre
      dir='ltr'
      className='max-h-56 overflow-auto rounded-control bg-surface-muted p-3 text-xs leading-6 text-foreground-secondary'
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function getRecordString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];

  return typeof value === 'string' && value.trim() ? value : null;
}

function getRecordNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getRecordBoolean(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];

  return typeof value === 'boolean' ? value : null;
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord);
}

function getProductCodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    OEM: 'کد OEM',
    TECHNICAL: 'کد فنی',
    BARCODE: 'بارکد',
    INTERNAL: 'کد داخلی',
  };

  return labels[type] ?? type;
}

function ProductCodesAuditValue({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return <AuditValue value={value} />;
  }

  const codes = toRecordArray(value);

  if (codes.length === 0) {
    return <span className='text-sm text-foreground-muted'>کدی ثبت نشده است</span>;
  }

  return (
    <div className='space-y-2'>
      {codes.map((code, index) => {
        const type = getRecordString(code, 'type') ?? '—';
        const codeValue = getRecordString(code, 'value') ?? '—';

        return (
          <div
            key={`${type}-${codeValue}-${index}`}
            className='flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface p-3'
          >
            <Badge size='sm' variant='neutral'>
              {getProductCodeTypeLabel(type)}
            </Badge>

            <span dir='ltr' className='numeric text-sm font-bold break-all text-foreground'>
              {codeValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ProductImagesAuditValue({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return <AuditValue value={value} />;
  }

  const images = toRecordArray(value);

  if (images.length === 0) {
    return <span className='text-sm text-foreground-muted'>تصویری ثبت نشده است</span>;
  }

  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {images.map((image, index) => {
        const url = getRecordString(image, 'url');
        const alt = getRecordString(image, 'alt');
        const sortOrder = getRecordNumber(image, 'sortOrder');

        return (
          <div
            key={`${url ?? 'image'}-${sortOrder ?? index}`}
            className='overflow-hidden rounded-control border border-border bg-surface'
          >
            <ImageUrlPreview
              src={url}
              alt={alt ?? `تصویر محصول ${index + 1}`}
              emptyLabel='تصویر قابل نمایش نیست'
              className='aspect-[4/3] w-full rounded-none border-0'
            />

            <div className='space-y-1 p-3'>
              <p className='line-clamp-2 text-sm font-semibold text-foreground'>
                {alt || `تصویر ${index + 1}`}
              </p>

              <p className='text-xs text-foreground-muted'>
                ترتیب نمایش: <span className='numeric'>{toPersianDigits(sortOrder ?? index)}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatCompatibilityYearRange(vehicle: Record<string, unknown>): string | null {
  const yearFrom = getRecordNumber(vehicle, 'yearFrom');
  const yearTo = getRecordNumber(vehicle, 'yearTo');

  const calendar = getRecordString(vehicle, 'yearCalendar') === 'GREGORIAN' ? 'میلادی' : 'شمسی';

  if (yearFrom !== null && yearTo !== null) {
    return `${toPersianDigits(yearFrom)} تا ${toPersianDigits(yearTo)} · ${calendar}`;
  }

  if (yearFrom !== null) {
    return `از ${toPersianDigits(yearFrom)} · ${calendar}`;
  }

  if (yearTo !== null) {
    return `تا ${toPersianDigits(yearTo)} · ${calendar}`;
  }

  return null;
}

function CompatibilityAuditList({ value, emptyLabel }: { value: unknown; emptyLabel: string }) {
  if (!Array.isArray(value)) {
    return <AuditValue value={value} />;
  }

  const compatibilities = toRecordArray(value);

  if (compatibilities.length === 0) {
    return (
      <div className='rounded-control border border-dashed border-border bg-surface p-4 text-sm text-foreground-muted'>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      {compatibilities.map((compatibility, index) => {
        const vehicle = isRecord(compatibility.vehicle) ? compatibility.vehicle : null;

        const vehicleVariantId = getRecordString(compatibility, 'vehicleVariantId') ?? '';

        const makeName = vehicle ? getRecordString(vehicle, 'makeName') : null;

        const modelName = vehicle ? getRecordString(vehicle, 'modelName') : null;

        const variantName = vehicle ? getRecordString(vehicle, 'variantName') : null;

        const engineCode = vehicle ? getRecordString(vehicle, 'engineCode') : null;

        const engineName = vehicle ? getRecordString(vehicle, 'engineName') : null;

        const yearRange = vehicle ? formatCompatibilityYearRange(vehicle) : null;

        const notes = getRecordString(compatibility, 'notes');

        const requiresVerification =
          getRecordBoolean(compatibility, 'requiresVerification') ?? false;

        const title = [makeName, modelName, variantName].filter(Boolean).join(' · ');

        const technicalDetails = [
          engineName,
          engineCode ? `کد موتور: ${engineCode}` : null,
          yearRange,
        ].filter(Boolean);

        return (
          <div
            key={`${vehicleVariantId}-${index}`}
            className='rounded-control border border-border bg-surface p-4'
          >
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='min-w-0'>
                <p className='font-bold text-foreground'>{title || 'تیپ خودرو'}</p>

                {technicalDetails.length > 0 ? (
                  <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                    {technicalDetails.join(' · ')}
                  </p>
                ) : null}

                {!title && vehicleVariantId ? (
                  <p dir='ltr' className='mt-2 text-xs break-all text-foreground-muted'>
                    شناسه تیپ: {vehicleVariantId}
                  </p>
                ) : null}
              </div>

              <Badge size='sm' variant={requiresVerification ? 'brand' : 'success'}>
                {requiresVerification ? 'نیازمند بررسی پیش از ارسال' : 'بدون نیاز به بررسی'}
              </Badge>
            </div>

            {notes ? (
              <div className='mt-3 rounded-control bg-surface-muted p-3'>
                <p className='text-xs font-bold text-foreground-muted'>یادداشت فنی</p>

                <p className='mt-1 text-sm leading-6 text-foreground-secondary'>{notes}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AuditFieldValue({ field, value }: { field: string; value: unknown }) {
  if (field === 'codes') {
    return <ProductCodesAuditValue value={value} />;
  }

  if (field === 'images') {
    return <ProductImagesAuditValue value={value} />;
  }

  return <AuditFieldValue field={field} value={value} />;
}

function ChangedField({ field, value }: { field: string; value: unknown }) {
  const valueRecord = isRecord(value) ? value : null;

  const hasBeforeAfter = valueRecord && ('before' in valueRecord || 'after' in valueRecord);

  const hasFromTo = valueRecord && ('from' in valueRecord || 'to' in valueRecord);

  const label = fieldLabels[field] ?? field;

  if (hasBeforeAfter) {
    return (
      <div className='rounded-control border border-border p-4'>
        <p className='mb-3 text-sm font-bold text-foreground'>{label}</p>

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='rounded-control bg-danger-soft p-3'>
            <p className='mb-1 text-xs font-bold text-danger'>قبل</p>
            <div className='text-sm text-foreground'>
              <AuditFieldValue field={field} value={valueRecord.before} />
            </div>
          </div>

          <div className='rounded-control bg-success-soft p-3'>
            <p className='mb-1 text-xs font-bold text-success'>بعد</p>
            <div className='text-sm text-foreground'>
              <AuditFieldValue field={field} value={valueRecord.after} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasFromTo) {
    return (
      <div className='rounded-control border border-border p-4'>
        <p className='mb-3 text-sm font-bold text-foreground'>{label}</p>

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='rounded-control bg-danger-soft p-3'>
            <p className='mb-1 text-xs font-bold text-danger'>قبل</p>
            <div className='text-sm text-foreground'>
              <AuditValue value={valueRecord.from} />
            </div>
          </div>

          <div className='rounded-control bg-success-soft p-3'>
            <p className='mb-1 text-xs font-bold text-success'>بعد</p>
            <div className='text-sm text-foreground'>
              <AuditValue value={valueRecord.to} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-control border border-border p-4'>
      <p className='mb-2 text-sm font-bold text-foreground'>{label}</p>

      <div className='text-sm text-foreground-secondary'>
        <AuditFieldValue field={field} value={value} />
      </div>
    </div>
  );
}

export function AdminAuditLogDetailsSheet({
  auditLog,
  open,
  onOpenChange,
}: AdminAuditLogDetailsSheetProps) {
  if (!auditLog) {
    return null;
  }

  const changes = isRecord(auditLog.changes) ? auditLog.changes : null;
  const event = typeof changes?.event === 'string' ? changes.event : null;

  const snapshot = isRecord(changes?.snapshot) ? changes.snapshot : null;
  const fields = isRecord(changes?.fields) ? changes.fields : null;

  const hasCompatibilityBeforeAfter = changes && ('before' in changes || 'after' in changes);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='left' className='!h-dvh !w-full !max-w-2xl !overflow-hidden !p-0'>
        <div className='flex h-full min-h-0 flex-col'>
          <div className='shrink-0 border-b border-border px-5 py-5 pe-12 sm:px-6 sm:py-6'>
            <div className='flex flex-wrap items-center gap-2'>
              <SheetTitle>جزئیات تغییر</SheetTitle>

              <Badge variant={getActionVariant(auditLog.action)}>
                {getAdminAuditActionLabel(auditLog.action)}
              </Badge>
            </div>

            <SheetDescription className='mt-2'>
              {getAdminAuditEntityTypeLabel(auditLog.entityType)} ·{' '}
              {auditLog.entityLabel ?? auditLog.entityId}
            </SheetDescription>
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6'>
            <div className='space-y-6'>
              <section className='grid gap-3 rounded-card border border-border bg-surface-muted p-4 sm:grid-cols-2'>
                <div>
                  <p className='text-xs font-semibold text-foreground-muted'>انجام‌دهنده</p>

                  <p className='mt-1 text-sm font-bold text-foreground'>{getActorName(auditLog)}</p>

                  <p dir='ltr' className='mt-1 text-xs text-foreground-muted'>
                    {auditLog.actorUser.mobile}
                  </p>
                </div>

                <div>
                  <p className='text-xs font-semibold text-foreground-muted'>زمان ثبت</p>

                  <p className='mt-1 text-sm font-bold text-foreground'>
                    {formatDateTime(auditLog.createdAt)}
                  </p>
                </div>

                <div>
                  <p className='text-xs font-semibold text-foreground-muted'>نوع موجودیت</p>

                  <p className='mt-1 text-sm font-bold text-foreground'>
                    {getAdminAuditEntityTypeLabel(auditLog.entityType)}
                  </p>
                </div>

                <div>
                  <p className='text-xs font-semibold text-foreground-muted'>شناسه موجودیت</p>

                  <p dir='ltr' className='mt-1 text-xs break-all text-foreground-secondary'>
                    {auditLog.entityId}
                  </p>
                </div>
              </section>

              {event ? (
                <section>
                  <h3 className='text-sm font-bold text-foreground'>شرح رویداد</h3>

                  <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
                    {eventLabels[event] ?? event}
                  </p>
                </section>
              ) : null}

              {snapshot ? (
                <section>
                  <h3 className='mb-3 text-sm font-bold text-foreground'>اطلاعات ثبت‌شده</h3>

                  <div className='space-y-3'>
                    {Object.entries(snapshot).map(([field, value]) => (
                      <ChangedField key={field} field={field} value={value} />
                    ))}
                  </div>
                </section>
              ) : null}

              {fields ? (
                <section>
                  <h3 className='mb-3 text-sm font-bold text-foreground'>فیلدهای تغییرکرده</h3>

                  <div className='space-y-3'>
                    {Object.entries(fields).map(([field, value]) => (
                      <ChangedField key={field} field={field} value={value} />
                    ))}
                  </div>
                </section>
              ) : null}

              {hasCompatibilityBeforeAfter ? (
                <section>
                  <h3 className='mb-3 text-sm font-bold text-foreground'>تغییر سازگاری خودرو</h3>

                  <div className='grid gap-3 lg:grid-cols-2'>
                    <div className='rounded-control border border-danger/30 bg-danger-soft p-4'>
                      <p className='mb-3 text-sm font-bold text-danger'>پیش از تغییر</p>

                      <CompatibilityAuditList
                        value={changes.before}
                        emptyLabel='سازگاری قبلی ثبت نشده بود'
                      />
                    </div>

                    <div className='rounded-control border border-success/30 bg-success-soft p-4'>
                      <p className='mb-3 text-sm font-bold text-success'>پس از تغییر</p>

                      <CompatibilityAuditList
                        value={changes.after}
                        emptyLabel='هیچ سازگاری فعالی ثبت نشده است'
                      />
                    </div>
                  </div>
                </section>
              ) : null}

              {!snapshot && !fields && !hasCompatibilityBeforeAfter ? (
                <section>
                  <h3 className='mb-3 text-sm font-bold text-foreground'>داده ثبت‌شده</h3>

                  <AuditValue value={auditLog.changes} />
                </section>
              ) : null}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
