'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StorefrontProductImageGallery } from '@/components/storefront/catalog/storefront-product-image-gallery';
import { storefrontCatalogApi } from '@/lib/api/storefront-catalog-client';
import { storefrontVehiclesApi } from '@/lib/api/storefront-vehicles-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  StorefrontProductCompatibility,
  StorefrontProductDetail,
} from '@/lib/storefront/catalog/catalog.types';
import {
  readStorefrontVehicleSelection,
  saveStorefrontVehicleSelection,
} from '@/lib/storefront/vehicles/vehicle-selection-storage';
import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  Code2,
  FileText,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  TriangleAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ProductCompatibilityDialog } from '@/components/storefront/catalog/product-compatibility-dialog';
import type {
  StorefrontVehicleSelection,
  StorefrontVehicleVariant,
} from '@/lib/storefront/vehicles/vehicle.types';
import { useStorefrontCart } from '@/components/storefront/cart/storefront-cart-provider';
import { ProductPurchasePanel } from '@/components/storefront/catalog/product-purchase-panel';
import { toPersianDigits } from '@/lib/utils/digits';

type StorefrontProductDetailPageClientProps = {
  slug: string;
};

type VehicleSelectionContext = {
  makeSlug: string;
  modelSlug: string;
  variantId: string;
};

type ResolvedVehicle = {
  makeName: string;
  modelName: string;
  variant: StorefrontVehicleVariant;
};

type SpecificationEntry = {
  label: string;
  value: unknown;
};

type ProductLoadError = {
  message: string;
  status?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatYear(value: number): string {
  return toPersianDigits(value);
}

function getStockStatusLabel(stockStatus: StorefrontProductDetail['stockStatus']): string {
  const labels = {
    IN_STOCK: 'موجود',
    OUT_OF_STOCK: 'ناموجود',
    CHECK_AVAILABILITY: 'نیازمند استعلام',
  } as const;

  return labels[stockStatus];
}

function getStockStatusVariant(stockStatus: StorefrontProductDetail['stockStatus']) {
  if (stockStatus === 'IN_STOCK') {
    return 'success' as const;
  }

  if (stockStatus === 'CHECK_AVAILABILITY') {
    return 'warning' as const;
  }

  return 'neutral' as const;
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

function getVariantDetails(variant: StorefrontVehicleVariant): string {
  const details: string[] = [];

  if (variant.engineName) {
    details.push(variant.engineName);
  }

  if (variant.engineCode) {
    details.push(`کد موتور: ${variant.engineCode}`);
  }

  const calendarLabel = variant.yearCalendar === 'GREGORIAN' ? 'میلادی' : 'شمسی';

  if (variant.yearFrom !== null && variant.yearTo !== null) {
    details.push(
      `${formatYear(variant.yearFrom)} تا ${formatYear(variant.yearTo)} ${calendarLabel}`,
    );
  } else if (variant.yearFrom !== null) {
    details.push(`از ${formatYear(variant.yearFrom)} ${calendarLabel}`);
  } else if (variant.yearTo !== null) {
    details.push(`تا ${formatYear(variant.yearTo)} ${calendarLabel}`);
  }

  return details.join(' · ') || 'جزئیات فنی ثبت نشده است';
}

function getCompatibilityTitle(compatibility: StorefrontProductCompatibility): string {
  const variant = compatibility.vehicleVariant;

  return [variant.model.make.name, variant.model.name, variant.name].filter(Boolean).join(' · ');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'دریافت اطلاعات محصول با خطا مواجه شد';
}

function toSpecificationEntries(value: unknown): SpecificationEntry[] {
  if (isRecord(value)) {
    return Object.entries(value).map(([label, entryValue]) => ({
      label,
      value: entryValue,
    }));
  }

  if (Array.isArray(value)) {
    return value.map((entryValue, index) => {
      if (isRecord(entryValue) && typeof entryValue.label === 'string' && 'value' in entryValue) {
        return {
          label: entryValue.label,
          value: entryValue.value,
        };
      }

      return {
        label: `ویژگی ${index + 1}`,
        value: entryValue,
      };
    });
  }

  return [];
}

function formatSpecificationValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'بله' : 'خیر';
  }

  if (typeof value === 'number') {
    return toPersianDigits(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatSpecificationValue(item))
      .filter(Boolean)
      .join(' ، ');
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key}: ${formatSpecificationValue(nestedValue)}`)
      .join(' ، ');
  }

  return '—';
}

function ProductDetailSkeleton() {
  return (
    <div className='mx-auto w-full max-w-7xl px-4 pt-8 pb-44 sm:px-6 lg:px-8 lg:pb-8'>
      <div className='grid gap-8 lg:grid-cols-2'>
        <div className='aspect-square animate-pulse rounded-card bg-surface-muted' />

        <div className='space-y-5'>
          <div className='h-6 w-32 animate-pulse rounded bg-surface-muted' />
          <div className='h-10 w-4/5 animate-pulse rounded bg-surface-muted' />
          <div className='h-6 w-full animate-pulse rounded bg-surface-muted' />
          <div className='h-32 w-full animate-pulse rounded-card bg-surface-muted' />
        </div>
      </div>
    </div>
  );
}

function ProductCompatibilityStatus({
  product,
  selectedVehicle,
  onOpenCompatibilityDialog,
}: {
  product: StorefrontProductDetail;
  selectedVehicle: ResolvedVehicle | null;
  onOpenCompatibilityDialog: () => void;
}) {
  const selectedVariantId = selectedVehicle?.variant.id ?? null;

  const matchedCompatibility = selectedVariantId
    ? (product.compatibilities.find(
        (compatibility) => compatibility.vehicleVariant.id === selectedVariantId,
      ) ?? null)
    : null;

  if (!selectedVariantId) {
    return (
      <section id='compatibility' className='rounded-card border border-info/30 bg-info-soft p-5'>
        <div className='flex gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-control bg-surface text-info'>
            <CarFront className='size-5' />
          </span>

          <div className='min-w-0 flex-1'>
            <h2 className='text-base font-extrabold text-foreground'>
              سازگاری با خودرو را بررسی کنید
            </h2>

            <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
              برند، مدل و تیپ خودرو را انتخاب کنید تا تطابق این قطعه بررسی شود
            </p>

            <Button
              type='button'
              size='md'
              variant='secondary'
              iconStart={<CarFront />}
              iconEnd={<ChevronLeft />}
              className='mt-4'
              onClick={onOpenCompatibilityDialog}
            >
              بررسی سازگاری با خودروی من
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!matchedCompatibility) {
    return (
      <section
        id='compatibility'
        className='rounded-card border border-danger/30 bg-danger-soft p-5'
      >
        <div className='flex gap-3'>
          <span className='grid size-10 shrink-0 place-items-center rounded-control bg-surface text-danger'>
            <TriangleAlert className='size-5' />
          </span>

          <div className='min-w-0 flex-1'>
            <h2 className='text-base font-extrabold text-danger'>
              سازگاری این قطعه تأیید نشده است
            </h2>

            <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
              این قطعه برای خودرو و تیپ انتخاب‌شده شما در فهرست سازگاری‌ها ثبت نشده است
            </p>

            {selectedVehicle ? (
              <p className='mt-2 text-sm font-semibold text-foreground'>
                {selectedVehicle.makeName} · {selectedVehicle.modelName} ·{' '}
                {selectedVehicle.variant.name}
              </p>
            ) : null}

            <Button
              type='button'
              size='sm'
              variant='outline'
              iconStart={<CarFront />}
              className='mt-4'
              onClick={onOpenCompatibilityDialog}
            >
              تغییر خودرو و بررسی دوباره
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const needsVerification = matchedCompatibility.requiresVerification;

  return (
    <section
      id='compatibility'
      className={
        needsVerification
          ? 'rounded-card border border-warning/30 bg-warning-soft p-5'
          : 'rounded-card border border-success/30 bg-success-soft p-5'
      }
    >
      <div className='flex gap-3'>
        <span
          className={
            needsVerification
              ? 'grid size-10 shrink-0 place-items-center rounded-control bg-surface text-warning'
              : 'grid size-10 shrink-0 place-items-center rounded-control bg-surface text-success'
          }
        >
          {needsVerification ? (
            <ShieldCheck className='size-5' />
          ) : (
            <CheckCircle2 className='size-5' />
          )}
        </span>

        <div className='min-w-0 flex-1'>
          <h2
            className={
              needsVerification
                ? 'text-base font-extrabold text-warning'
                : 'text-base font-extrabold text-success'
            }
          >
            {needsVerification
              ? 'قطعه سازگار است، اما نیازمند بررسی پیش از ارسال است'
              : 'این قطعه با خودروی شما سازگار است'}
          </h2>

          <p className='mt-2 text-sm leading-6 text-foreground-secondary'>
            {needsVerification
              ? 'تطبیق اولیه ثبت شده است، اما مشخصات فنی باید پیش از ارسال کنترل شود'
              : 'سازگاری این قطعه برای خودرو و تیپ انتخاب‌شده شما ثبت شده است'}
          </p>

          {matchedCompatibility.notes ? (
            <p className='mt-3 rounded-control bg-surface/70 p-3 text-sm leading-6 text-foreground-secondary'>
              {matchedCompatibility.notes}
            </p>
          ) : null}

          <Button
            type='button'
            size='sm'
            variant='outline'
            iconStart={<CarFront />}
            className='mt-4'
            onClick={onOpenCompatibilityDialog}
          >
            تغییر خودرو
          </Button>
        </div>
      </div>
    </section>
  );
}

export function StorefrontProductDetailPageClient({
  slug,
}: StorefrontProductDetailPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { addItem, isMutating: isCartMutating } = useStorefrontCart();
  const { cart, isLoading: isCartLoading, reloadCart, updateItemVehicle } = useStorefrontCart();

  const [isCompatibilityDialogOpen, setIsCompatibilityDialogOpen] = useState(false);

  const [product, setProduct] = useState<StorefrontProductDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState<ProductLoadError | null>(null);

  const [selectedVehicle, setSelectedVehicle] = useState<ResolvedVehicle | null>(null);

  const vehicleVariantId = searchParams.get('vehicleVariantId') ?? '';

  const vehicleMake = searchParams.get('vehicleMake') ?? '';

  const vehicleModel = searchParams.get('vehicleModel') ?? '';

  const selectionContext = useMemo<VehicleSelectionContext | null>(() => {
    if (vehicleVariantId && vehicleMake && vehicleModel) {
      return {
        variantId: vehicleVariantId,
        makeSlug: vehicleMake,
        modelSlug: vehicleModel,
      };
    }

    const storedSelection = readStorefrontVehicleSelection();

    if (!storedSelection) {
      return null;
    }

    return storedSelection;
  }, [vehicleMake, vehicleModel, vehicleVariantId]);

  const handleVehicleConfirmed = useCallback(
    async (selection: StorefrontVehicleSelection) => {
      saveStorefrontVehicleSelection({
        makeSlug: selection.make.slug,
        modelSlug: selection.model.slug,
        variantId: selection.variant.id,
      });

      setSelectedVehicle({
        makeName: selection.make.name,
        modelName: selection.model.name,
        variant: selection.variant,
      });

      const cartSnapshot = cart ?? (isCartLoading ? await reloadCart() : null);

      const unassignedCartItem = product
        ? (cartSnapshot?.items.find(
            (item) => item.product.id === product.id && item.vehicle === null,
          ) ?? null)
        : null;

      if (unassignedCartItem) {
        try {
          await updateItemVehicle(unassignedCartItem.id, {
            vehicleVariantId: selection.variant.id,
          });
        } catch {
          // Toast در Cart Provider نمایش داده می‌شود
          // انتخاب خودرو برای صفحه محصول همچنان حفظ می‌شود
        }
      }

      const nextSearchParams = new URLSearchParams(searchParams.toString());

      nextSearchParams.set('vehicleVariantId', selection.variant.id);

      nextSearchParams.set('vehicleMake', selection.make.slug);

      nextSearchParams.set('vehicleModel', selection.model.slug);

      const nextQueryString = nextSearchParams.toString();

      const nextUrl = `${pathname}?${nextQueryString}`;

      const currentQueryString = searchParams.toString();

      const currentUrl = currentQueryString ? `${pathname}?${currentQueryString}` : pathname;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, {
          scroll: false,
        });
      }
    },
    [cart, isCartLoading, pathname, product, reloadCart, router, searchParams, updateItemVehicle],
  );

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await storefrontCatalogApi.getProductBySlug(slug);

      setProduct(response.data);
    } catch (error) {
      setLoadError({
        message: getErrorMessage(error),
        ...(error instanceof ClientApiError
          ? {
              status: error.status,
            }
          : {}),
      });
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    if (!selectionContext) {
      setSelectedVehicle(null);
      return;
    }

    const { modelSlug, variantId } = selectionContext;

    let isCurrent = true;

    async function resolveVehicle() {
      try {
        const response = await storefrontVehiclesApi.listVariantsByModelSlug(modelSlug);

        if (!isCurrent) {
          return;
        }

        const variant = response.data.variants.find((item) => item.id === variantId);

        if (!variant) {
          setSelectedVehicle(null);
          return;
        }

        setSelectedVehicle({
          makeName: response.data.model.make.name,
          modelName: response.data.model.name,
          variant,
        });
      } catch {
        if (isCurrent) {
          setSelectedVehicle(null);
        }
      }
    }

    void resolveVehicle();

    return () => {
      isCurrent = false;
    };
  }, [selectionContext]);

  const specificationEntries = useMemo(
    () => toSpecificationEntries(product?.specifications),
    [product?.specifications],
  );

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (loadError || !product) {
    const isNotFound = loadError?.status === 404;

    return (
      <div className='mx-auto w-full max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8'>
        <PackageOpen className='mx-auto size-10 text-foreground-muted' />

        <h1 className='mt-4 text-xl font-extrabold text-foreground'>
          {isNotFound ? 'این محصول پیدا نشد' : 'دریافت اطلاعات محصول انجام نشد'}
        </h1>

        <p className='mx-auto mt-3 max-w-lg text-sm leading-7 text-foreground-secondary'>
          {loadError?.message ?? 'اطلاعات محصول در دسترس نیست'}
        </p>

        <div className='mt-6 flex flex-wrap justify-center gap-3'>
          <Button
            type='button'
            variant='outline'
            iconStart={<RefreshCw />}
            onClick={() => void loadProduct()}
          >
            تلاش مجدد
          </Button>

          <Link
            href='/products'
            className='inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90'
          >
            بازگشت به محصولات
            <ChevronLeft className='size-4' />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
      <div className='mb-6 flex flex-wrap items-center gap-2 text-sm text-foreground-muted'>
        <Link href='/' className='transition-colors hover:text-brand'>
          خانه
        </Link>

        <ChevronLeft className='size-4' />

        <Link href='/products' className='transition-colors hover:text-brand'>
          قطعات
        </Link>

        <ChevronLeft className='size-4' />

        <Link
          href={`/products?category=${encodeURIComponent(product.category.slug)}`}
          className='transition-colors hover:text-brand'
        >
          {product.category.name}
        </Link>
      </div>

      <div className='grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]'>
        <StorefrontProductImageGallery
          images={product.images}
          productName={product.name}
          className='w-full max-w-full min-w-0'
        />

        <section>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant={getStockStatusVariant(product.stockStatus)} dot>
              {getStockStatusLabel(product.stockStatus)}
            </Badge>

            <Badge variant='neutral'>{product.brand.name}</Badge>
          </div>

          <h1 className='mt-4 text-2xl leading-10 font-extrabold text-foreground sm:text-3xl'>
            {product.name}
          </h1>

          {product.shortDescription ? (
            <p className='mt-3 text-sm leading-7 text-foreground-secondary'>
              {product.shortDescription}
            </p>
          ) : null}

          <div className='mt-5 flex flex-wrap gap-4 border-y border-border py-4 text-sm'>
            <div>
              <p className='text-xs font-semibold text-foreground-muted'>برند قطعه</p>

              <p className='mt-1 font-bold text-foreground'>{product.brand.name}</p>
            </div>

            <div>
              <p className='text-xs font-semibold text-foreground-muted'>دسته‌بندی</p>

              <p className='mt-1 font-bold text-foreground'>{product.category.name}</p>
            </div>

            <div>
              <p className='text-xs font-semibold text-foreground-muted'>SKU</p>

              <p dir='ltr' className='mt-1 font-bold text-foreground'>
                {product.sku}
              </p>
            </div>
          </div>

          <ProductPurchasePanel
            product={product}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={() => setIsCompatibilityDialogOpen(true)}
          />
        </section>
      </div>

      <div className='mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-8'>
          <ProductCompatibilityStatus
            product={product}
            selectedVehicle={selectedVehicle}
            onOpenCompatibilityDialog={() => setIsCompatibilityDialogOpen(true)}
          />

          {product.description ? (
            <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
              <div className='flex flex-col gap-4 border-b border-border bg-surface-muted px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                <div className='flex items-center gap-3'>
                  <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                    <FileText className='size-5' />
                  </span>

                  <div>
                    <h2 className='text-lg font-extrabold text-foreground'>
                      توضیحات و معرفی محصول
                    </h2>

                    <p className='mt-1 text-sm text-foreground-secondary'>
                      اطلاعات تکمیلی، کاربردها و نکات مهم این قطعه
                    </p>
                  </div>
                </div>
              </div>

              <div className='px-5 py-6 sm:px-6'>
                <div className='relative overflow-hidden rounded-control border border-border bg-surface-muted/60 p-5 sm:p-6'>
                  <span className='absolute inset-y-0 start-0 w-1 bg-brand' />

                  <p className='pe-2 text-sm leading-8 whitespace-pre-line text-foreground-secondary sm:text-[15px]'>
                    {product.description}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {specificationEntries.length > 0 ? (
            <section className='overflow-hidden rounded-card border border-border bg-surface shadow-panel'>
              <div className='flex flex-col gap-4 border-b border-border bg-surface-muted px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                <div className='flex items-center gap-3'>
                  <span className='grid size-11 shrink-0 place-items-center rounded-control bg-brand-soft text-brand'>
                    <SlidersHorizontal className='size-5' />
                  </span>

                  <div>
                    <h2 className='text-lg font-extrabold text-foreground'>
                      مشخصات فنی و ویژگی‌ها
                    </h2>

                    <p className='mt-1 text-sm text-foreground-secondary'>
                      اطلاعات فنی ثبت‌شده برای این قطعه
                    </p>
                  </div>
                </div>

                <span className='inline-flex w-fit items-center rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand'>
                  {toPersianDigits(specificationEntries.length)} ویژگی
                </span>
              </div>

              <dl className='grid gap-px bg-border sm:grid-cols-2'>
                {specificationEntries.map((entry, index) => (
                  <div
                    key={`${entry.label}-${index}`}
                    className='group min-h-24 bg-surface px-4 py-4 transition-colors hover:bg-brand-soft/40 sm:px-5'
                  >
                    <div className='flex items-start gap-3'>
                      <span className='grid size-9 shrink-0 place-items-center rounded-control bg-surface-muted text-xs font-extrabold text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground'>
                        {toPersianDigits(index + 1)}
                      </span>

                      <div className='min-w-0 flex-1'>
                        <dt className='text-xs font-bold text-foreground-muted'>{entry.label}</dt>

                        <dd className='mt-2 text-sm leading-7 font-extrabold break-words text-foreground'>
                          {formatSpecificationValue(entry.value)}
                        </dd>
                      </div>
                    </div>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
        </div>

        <aside className='space-y-6'>
          <section className='rounded-card border border-border bg-surface p-5'>
            <div className='flex items-center gap-2'>
              <Code2 className='size-5 text-brand' />

              <h2 className='text-base font-extrabold text-foreground'>کدهای محصول</h2>
            </div>

            {product.codes.length ? (
              <div className='mt-4 space-y-3'>
                {product.codes.map((code) => (
                  <div
                    key={`${code.type}-${code.value}`}
                    className='rounded-control border border-border bg-surface-muted p-3'
                  >
                    <p className='text-xs font-semibold text-foreground-muted'>
                      {getProductCodeTypeLabel(code.type)}
                    </p>

                    <p
                      dir='ltr'
                      className='numeric mt-1 text-sm font-bold break-all text-foreground'
                    >
                      {code.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className='mt-4 text-sm text-foreground-muted'>کدی برای این محصول ثبت نشده است</p>
            )}
          </section>

          <section className='rounded-card border border-border bg-surface p-5'>
            <div className='flex items-center gap-2'>
              <Tag className='size-5 text-brand' />

              <h2 className='text-base font-extrabold text-foreground'>خودروهای سازگار</h2>
            </div>

            {product.compatibilities.length ? (
              <div className='mt-4 space-y-3'>
                {product.compatibilities.map((compatibility) => (
                  <div
                    key={compatibility.vehicleVariant.id}
                    className='rounded-control border border-border bg-surface-muted p-3'
                  >
                    <div className='flex flex-wrap items-start justify-between gap-2'>
                      <p className='text-sm font-bold text-foreground'>
                        {getCompatibilityTitle(compatibility)}
                      </p>

                      <Badge
                        size='sm'
                        variant={compatibility.requiresVerification ? 'warning' : 'success'}
                      >
                        {compatibility.requiresVerification ? 'نیازمند بررسی' : 'تأییدشده'}
                      </Badge>
                    </div>

                    <p className='mt-2 text-xs leading-6 text-foreground-secondary'>
                      {getVariantDetails(compatibility.vehicleVariant)}
                    </p>

                    {compatibility.notes ? (
                      <p className='mt-2 text-xs leading-6 text-foreground-muted'>
                        {compatibility.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className='mt-4 rounded-control border border-dashed border-border bg-surface-muted p-4'>
                <p className='text-sm leading-6 text-foreground-secondary'>
                  هنوز سازگاری خودرویی برای این قطعه ثبت نشده است
                </p>
              </div>
            )}
          </section>

          <Link
            href='/products'
            className='inline-flex w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-3 text-sm font-bold text-foreground-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand'
          >
            <ArrowRight className='size-4' />
            بازگشت به لیست محصولات
          </Link>
        </aside>
      </div>
      <ProductCompatibilityDialog
        open={isCompatibilityDialogOpen}
        onOpenChange={setIsCompatibilityDialogOpen}
        productName={product.name}
        compatibilities={product.compatibilities}
        initialSelection={selectionContext ?? undefined}
        onVehicleConfirmed={handleVehicleConfirmed}
      />
    </div>
  );
}
