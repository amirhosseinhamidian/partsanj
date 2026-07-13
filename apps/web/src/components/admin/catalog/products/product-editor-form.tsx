'use client';

import type { AdminBrand } from '@/lib/admin/catalog/brand.types';
import type { AdminCategory } from '@/lib/admin/catalog/category.types';
import type {
  AdminProductDetail,
  CreateProductPayload,
  ProductCodeType,
  ProductStatus,
  StockStatus,
  UpdateProductPayload,
} from '@/lib/admin/catalog/product.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { FormField } from '@/components/ui/form-field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Archive, Code2, Link2, ListPlus, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PriceInput } from '@/components/ui/price-input';
import { FileUpload, type FileUploadRejection } from '@/components/ui/file-upload';
import { SortableImageList, type SortableImageItem } from '@/components/ui/sortable-image-list';
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker';
import { toPersianDigits } from '@/lib/utils/digits';

const MAX_CODES = 20;
const MAX_IMAGES = 10;

type ProductCodeRow = {
  id: string;
  type: ProductCodeType;
  value: string;
};

type ProductImageRow = SortableImageItem;

export type ProductImageUploadResult = {
  url: string;
  alt?: string | null;
};

type SpecificationRow = {
  id: string;
  key: string;
  value: string;
};

type InventoryMode = 'TRACKED' | 'CHECK_AVAILABILITY';

type ProductFormValues = {
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  priceToman: number | null;
  saleEnabled: boolean;
  salePriceToman: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  inventoryMode: InventoryMode;
  stockQuantity: string;
  lowStockThreshold: string;
  status: ProductStatus;
  isPublished: boolean;
  isTorobEnabled: boolean;
  showOnHome: boolean;
  homeSortOrder: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphImageUrl: string;
  openGraphImageAlt: string;
  brandId: string;
  categoryId: string;
  codes: ProductCodeRow[];
  images: ProductImageRow[];
  specifications: SpecificationRow[];
};

type ProductFormErrors = Partial<
  Record<
    | 'sku'
    | 'slug'
    | 'name'
    | 'shortDescription'
    | 'description'
    | 'priceToman'
    | 'salePriceToman'
    | 'saleStartsAt'
    | 'saleEndsAt'
    | 'inventoryMode'
    | 'stockQuantity'
    | 'lowStockThreshold'
    | 'status'
    | 'brandId'
    | 'categoryId'
    | 'homeSortOrder'
    | 'seoTitle'
    | 'seoDescription'
    | 'canonicalUrl'
    | 'openGraphTitle'
    | 'openGraphDescription'
    | 'openGraphImageUrl'
    | 'openGraphImageAlt'
    | 'codes'
    | 'images'
    | 'specifications'
    | 'state',
    string
  >
>;

type ProductEditorFormProps = {
  mode: 'create' | 'edit';
  product: AdminProductDetail | null;
  brands: AdminBrand[];
  categories: AdminCategory[];
  optionsLoading?: boolean;
  onSubmit: (payload: CreateProductPayload | UpdateProductPayload) => Promise<AdminProductDetail>;
  onRequestArchive?: () => void;
  onUploadImages?: (files: File[]) => Promise<ProductImageUploadResult[]>;
};

let localRowSequence = 0;

function createLocalId(prefix: string): string {
  localRowSequence += 1;

  return `${prefix}-${Date.now()}-${localRowSequence}`;
}

function toDateOrNull(value: Date | string | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (!value || typeof value !== 'string') {
    return null;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getSpecificationRows(specifications: Record<string, unknown> | null): SpecificationRow[] {
  if (!specifications) {
    return [];
  }

  return Object.entries(specifications).map(([key, value]) => ({
    id: createLocalId('spec'),
    key,
    value: typeof value === 'string' ? value : (JSON.stringify(value) ?? ''),
  }));
}

function getInitialValues(product: AdminProductDetail | null): ProductFormValues {
  return {
    sku: product?.sku ?? '',
    slug: product?.slug ?? '',
    name: product?.name ?? '',
    shortDescription: product?.shortDescription ?? '',
    description: product?.description ?? '',
    priceToman: product?.priceToman ?? null,
    saleEnabled: product?.salePriceToman !== null,
    salePriceToman: product?.salePriceToman ?? null,
    saleStartsAt: product?.saleStartsAt ? toDateOrNull(product.saleStartsAt) : null,

    saleEndsAt: product?.saleEndsAt ? toDateOrNull(product.saleEndsAt) : null,
    inventoryMode: product?.stockStatus === 'CHECK_AVAILABILITY' ? 'CHECK_AVAILABILITY' : 'TRACKED',

    stockQuantity: String(product?.stockQuantity ?? 0),

    lowStockThreshold: String(product?.lowStockThreshold ?? 5),
    status: product?.status ?? 'DRAFT',
    isPublished: product?.isPublished ?? false,
    isTorobEnabled: product?.isTorobEnabled ?? false,
    showOnHome: product?.showOnHome ?? false,
    homeSortOrder: String(product?.homeSortOrder ?? 0),
    seoTitle: product?.seoTitle ?? '',
    seoDescription: product?.seoDescription ?? '',
    canonicalUrl: product?.canonicalUrl ?? '',
    noIndex: product?.noIndex ?? false,
    openGraphTitle: product?.openGraphTitle ?? '',
    openGraphDescription: product?.openGraphDescription ?? '',
    openGraphImageUrl: product?.openGraphImageUrl ?? '',
    openGraphImageAlt: product?.openGraphImageAlt ?? '',
    brandId: product?.brand.id ?? '',
    categoryId: product?.category.id ?? '',
    codes:
      product?.codes.map((code) => ({
        id: createLocalId('code'),
        type: code.type,
        value: code.value,
      })) ?? [],
    images:
      product?.images
        .slice()
        .sort((first, second) => first.sortOrder - second.sortOrder)
        .map((image) => ({
          id: createLocalId('image'),
          url: image.url,
          alt: image.alt ?? '',
        })) ?? [],
    specifications: getSpecificationRows(product?.specifications ?? null),
  };
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isValidOptionalUrl(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  try {
    const url = new URL(trimmed);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatOptionDescription(
  slug: string,
  isActive: boolean,
  parentName?: string | null,
): string {
  return [parentName, slug, isActive ? 'فعال' : 'غیرفعال'].filter(Boolean).join(' · ');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'ذخیره محصول با خطا مواجه شد';
}

function resolveStockStatus(inventoryMode: InventoryMode, stockQuantity: number): StockStatus {
  if (inventoryMode === 'CHECK_AVAILABILITY') {
    return 'CHECK_AVAILABILITY';
  }

  return stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
}

function EditorSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className='rounded-card border border-border bg-surface p-4 shadow-panel sm:p-5'>
      <div className='flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='type-section-title text-foreground'>{title}</h2>

          {description ? <p className='mt-1 text-sm text-foreground-muted'>{description}</p> : null}
        </div>

        {action}
      </div>

      <div className='pt-5'>{children}</div>
    </section>
  );
}

export function ProductEditorForm({
  mode,
  product,
  brands,
  categories,
  optionsLoading = false,
  onSubmit,
  onRequestArchive,
  onUploadImages,
}: ProductEditorFormProps) {
  const isEditing = mode === 'edit';
  const [values, setValues] = useState<ProductFormValues>(() => getInitialValues(product));

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isUploadingImages, setIsUploadingImages] = useState(false);

  useEffect(() => {
    setValues(getInitialValues(product));
    setErrors({});
    setSubmitError(null);
    setIsUploadingImages(false);
  }, [product]);

  const isArchived = values.status === 'ARCHIVED';

  const brandOptions = useMemo(
    () =>
      brands.map((brand) => ({
        value: brand.id,
        label: brand.name,
        description: formatOptionDescription(brand.slug, brand.isActive),
      })),
    [brands],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
        description: formatOptionDescription(
          category.slug,
          category.isActive,
          category.parent?.name ?? null,
        ),
      })),
    [categories],
  );

  function setField<TKey extends keyof ProductFormValues>(
    key: TKey,
    value: ProductFormValues[TKey],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
      state:
        key === 'status' ||
        key === 'isPublished' ||
        key === 'isTorobEnabled' ||
        key === 'showOnHome' ||
        key === 'homeSortOrder' ||
        key === 'brandId' ||
        key === 'categoryId' ||
        key === 'priceToman' ||
        key === 'inventoryMode' ||
        key === 'stockQuantity' ||
        key === 'lowStockThreshold'
          ? undefined
          : current.state,
    }));
  }

  function updateCode(rowId: string, patch: Partial<ProductCodeRow>) {
    setValues((current) => ({
      ...current,
      codes: current.codes.map((code) =>
        code.id === rowId
          ? {
              ...code,
              ...patch,
            }
          : code,
      ),
    }));

    setErrors((current) => ({
      ...current,
      codes: undefined,
      state: undefined,
    }));
  }

  function updateImage(rowId: string, patch: Partial<ProductImageRow>) {
    setValues((current) => ({
      ...current,
      images: current.images.map((image) =>
        image.id === rowId
          ? {
              ...image,
              ...patch,
            }
          : image,
      ),
    }));

    setErrors((current) => ({
      ...current,
      images: undefined,
      state: undefined,
    }));
  }

  function updateSpecification(rowId: string, patch: Partial<SpecificationRow>) {
    setValues((current) => ({
      ...current,
      specifications: current.specifications.map((specification) =>
        specification.id === rowId
          ? {
              ...specification,
              ...patch,
            }
          : specification,
      ),
    }));

    setErrors((current) => ({
      ...current,
      specifications: undefined,
    }));
  }

  function getFileAltFallback(file: File): string {
    return file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .trim();
  }

  function isPublicImageUrl(value: string): boolean {
    try {
      const url = new URL(value);

      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function addImageUrlRow() {
    if (values.images.length >= MAX_IMAGES) {
      setErrors((current) => ({
        ...current,
        images: `حداکثر ${toPersianDigits(MAX_IMAGES)} تصویر قابل ثبت است`,
      }));

      return;
    }

    setValues((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          id: createLocalId('image'),
          url: '',
          alt: '',
        },
      ],
    }));

    setErrors((current) => ({
      ...current,
      images: undefined,
    }));
  }

  function handleImageFilesRejected(rejections: FileUploadRejection[]) {
    const firstRejection = rejections[0];

    setErrors((current) => ({
      ...current,
      images: firstRejection?.message ?? 'برخی از فایل‌ها قابل استفاده نیستند',
    }));
  }

  async function handleImageFilesSelected(files: File[]) {
    if (!onUploadImages) {
      setErrors((current) => ({
        ...current,
        images: 'سرویس بارگذاری تصویر هنوز به فرم محصول متصل نشده است',
      }));

      return;
    }

    const availableSlots = MAX_IMAGES - values.images.length;

    const filesToUpload = files.slice(0, Math.max(availableSlots, 0));

    if (filesToUpload.length === 0) {
      return;
    }

    setIsUploadingImages(true);

    setErrors((current) => ({
      ...current,
      images: undefined,
    }));

    try {
      const uploadedImages = await onUploadImages(filesToUpload);

      if (uploadedImages.length === 0) {
        throw new Error('سرویس بارگذاری تصویر هیچ URL معتبری برنگرداند');
      }

      const normalizedImages = uploadedImages.map((image, index) => {
        const url = image.url.trim();

        if (!isPublicImageUrl(url)) {
          throw new Error('سرویس بارگذاری باید URL عمومی http یا https برگرداند');
        }

        return {
          id: createLocalId('image'),
          url,
          alt: image.alt?.trim() || getFileAltFallback(filesToUpload[index]),
        };
      });

      setValues((current) => {
        const remainingSlots = MAX_IMAGES - current.images.length;

        return {
          ...current,
          images: [...current.images, ...normalizedImages.slice(0, Math.max(remainingSlots, 0))],
        };
      });
    } catch (error) {
      setErrors((current) => ({
        ...current,
        images: getErrorMessage(error),
      }));
    } finally {
      setIsUploadingImages(false);
    }
  }

  function validateAndBuildPayload(): CreateProductPayload | UpdateProductPayload | null {
    const nextErrors: ProductFormErrors = {};

    const sku = values.sku.trim();
    const slug = normalizeSlug(values.slug);
    const name = values.name.trim();

    const basePriceToman = values.priceToman;

    const homeSortOrder = Number(values.homeSortOrder);

    const stockQuantity = Number(values.stockQuantity);

    const lowStockThreshold = Number(values.lowStockThreshold);

    const selectedBrand = brands.find((brand) => brand.id === values.brandId);

    const selectedCategory = categories.find((category) => category.id === values.categoryId);

    let salePriceToman: number | null = null;
    let saleStartsAt = values.saleEnabled ? (values.saleStartsAt?.toISOString() ?? null) : null;

    let saleEndsAt = values.saleEnabled ? (values.saleEndsAt?.toISOString() ?? null) : null;

    if (!sku) {
      nextErrors.sku = 'SKU الزامی است';
    }

    if (!slug) {
      nextErrors.slug = 'Slug الزامی است';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = 'Slug فقط باید شامل حروف انگلیسی کوچک، عدد و خط تیره باشد';
    }

    if (!name) {
      nextErrors.name = 'نام محصول الزامی است';
    }

    if (!values.brandId) {
      nextErrors.brandId = 'انتخاب برند الزامی است';
    }

    if (!values.categoryId) {
      nextErrors.categoryId = 'انتخاب دسته‌بندی الزامی است';
    }

    if (basePriceToman !== null && (!Number.isSafeInteger(basePriceToman) || basePriceToman <= 0)) {
      nextErrors.priceToman = 'قیمت اصلی باید یک عدد صحیح بزرگ‌تر از صفر باشد';
    }

    if (!values.homeSortOrder.trim() || !Number.isInteger(homeSortOrder) || homeSortOrder < 0) {
      nextErrors.homeSortOrder = 'ترتیب نمایش در صفحه اصلی باید عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (!values.stockQuantity.trim() || !Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
      nextErrors.stockQuantity = 'تعداد موجودی باید عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (
      !values.lowStockThreshold.trim() ||
      !Number.isSafeInteger(lowStockThreshold) ||
      lowStockThreshold < 0
    ) {
      nextErrors.lowStockThreshold = 'حد هشدار موجودی باید عدد صحیح صفر یا بزرگ‌تر باشد';
    }

    if (values.saleEnabled) {
      salePriceToman = values.salePriceToman;

      if (
        salePriceToman !== null &&
        (!Number.isSafeInteger(salePriceToman) || salePriceToman <= 0)
      ) {
        nextErrors.salePriceToman = 'قیمت تخفیفی باید یک عدد صحیح بزرگ‌تر از صفر باشد';
      }

      if (values.saleStartsAt) {
        if (Number.isNaN(values.saleStartsAt.getTime())) {
          nextErrors.saleStartsAt = 'زمان شروع تخفیف معتبر نیست';
        } else {
          saleStartsAt = values.saleStartsAt.toISOString();
        }
      }

      if (values.saleEndsAt) {
        if (Number.isNaN(values.saleEndsAt.getTime())) {
          nextErrors.saleEndsAt = 'زمان پایان تخفیف معتبر نیست';
        } else {
          saleEndsAt = values.saleEndsAt.toISOString();
        }
      }

      if (basePriceToman === null) {
        nextErrors.priceToman = 'برای ثبت تخفیف، قیمت اصلی الزامی است';
      }

      if (salePriceToman === null) {
        nextErrors.salePriceToman = 'قیمت تخفیفی الزامی است';
      }

      if (basePriceToman !== null && salePriceToman !== null && salePriceToman >= basePriceToman) {
        nextErrors.salePriceToman = 'قیمت تخفیفی باید کمتر از قیمت اصلی باشد';
      }

      if (values.saleStartsAt && values.saleEndsAt && values.saleStartsAt >= values.saleEndsAt) {
        nextErrors.saleEndsAt = 'زمان پایان باید بعد از زمان شروع باشد';
      }
    }

    const resolvedStockStatus = resolveStockStatus(
      values.inventoryMode,
      Number.isSafeInteger(stockQuantity) ? stockQuantity : 0,
    );

    const normalizedCodes = values.codes.map((code) => ({
      type: code.type,
      value: code.value.trim(),
    }));

    if (normalizedCodes.some((code) => !code.value)) {
      nextErrors.codes = 'مقدار تمام کدهای ثبت‌شده باید تکمیل شود';
    } else {
      const codeKeys = normalizedCodes.map(
        (code) => `${code.type}:${code.value.toLocaleUpperCase('en-US')}`,
      );

      if (new Set(codeKeys).size !== codeKeys.length) {
        nextErrors.codes = 'ترکیب نوع و مقدار هر کد باید یکتا باشد';
      }
    }

    const normalizedImages = values.images.map((image, index) => ({
      url: image.url.trim(),
      alt: image.alt.trim() || null,
      sortOrder: index,
    }));

    for (const image of normalizedImages) {
      if (!image.url) {
        nextErrors.images = 'آدرس تمام تصاویر ثبت‌شده باید تکمیل شود';
        break;
      }

      try {
        const parsedUrl = new URL(image.url);

        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          nextErrors.images = 'آدرس تصویر باید با http یا https شروع شود';
          break;
        }
      } catch {
        nextErrors.images = 'آدرس تصویر معتبر نیست';
        break;
      }
    }

    const specifications: Record<string, string> = {};

    for (const specification of values.specifications) {
      const key = specification.key.trim();
      const value = specification.value.trim();

      if (!key && !value) {
        continue;
      }

      if (!key || !value) {
        nextErrors.specifications = 'عنوان و مقدار هر مشخصه باید هم‌زمان تکمیل شود';
        break;
      }

      if (specifications[key] !== undefined) {
        nextErrors.specifications = 'عنوان مشخصات فنی نباید تکراری باشد';
        break;
      }

      specifications[key] = value;
    }

    const now = new Date();

    const isSaleActiveNow =
      values.saleEnabled &&
      salePriceToman !== null &&
      !nextErrors.salePriceToman &&
      !nextErrors.saleStartsAt &&
      !nextErrors.saleEndsAt &&
      (!saleStartsAt || new Date(saleStartsAt) <= now) &&
      (!saleEndsAt || new Date(saleEndsAt) >= now);

    const effectivePriceToman = isSaleActiveNow ? salePriceToman : basePriceToman;

    if (values.isPublished && values.status !== 'ACTIVE') {
      nextErrors.state = 'محصول منتشرشده باید وضعیت فعال داشته باشد';
    }

    if (values.isPublished && (!selectedBrand?.isActive || !selectedCategory?.isActive)) {
      nextErrors.state = 'محصول منتشرشده باید برند و دسته‌بندی فعال داشته باشد';
    }

    if (values.isTorobEnabled) {
      if (values.status !== 'ACTIVE') {
        nextErrors.state = 'فعال‌سازی ترب فقط برای محصول فعال امکان‌پذیر است';
      } else if (!values.isPublished) {
        nextErrors.state = 'برای فعال‌سازی ترب، محصول باید منتشر شده باشد';
      } else if (!selectedBrand?.isActive || !selectedCategory?.isActive) {
        nextErrors.state = 'برای فعال‌سازی ترب، برند و دسته‌بندی باید فعال باشند';
      } else if (
        effectivePriceToman === null ||
        !Number.isSafeInteger(effectivePriceToman) ||
        effectivePriceToman <= 0
      ) {
        nextErrors.priceToman = 'برای فعال‌سازی ترب، قیمت مؤثر معتبر الزامی است';
      } else if (resolvedStockStatus !== 'IN_STOCK') {
        if (values.inventoryMode === 'CHECK_AVAILABILITY') {
          nextErrors.inventoryMode = 'برای فعال‌سازی ترب، محصول باید دارای موجودی عددی باشد';
        } else {
          nextErrors.stockQuantity = 'برای فعال‌سازی ترب، تعداد موجودی باید بیشتر از صفر باشد';
        }
      } else if (normalizedCodes.length === 0) {
        nextErrors.codes = 'برای فعال‌سازی ترب، حداقل یک کد محصول الزامی است';
      } else if (normalizedImages.length === 0) {
        nextErrors.images = 'برای فعال‌سازی ترب، حداقل یک تصویر محصول الزامی است';
      }
    }

    if (values.showOnHome) {
      if (values.status !== 'ACTIVE') {
        nextErrors.state = 'برای نمایش در صفحه اصلی، محصول باید وضعیت فعال داشته باشد';
      } else if (!values.isPublished) {
        nextErrors.state = 'برای نمایش در صفحه اصلی، محصول باید در فروشگاه منتشر شده باشد';
      } else if (!selectedBrand?.isActive || !selectedCategory?.isActive) {
        nextErrors.state = 'برای نمایش در صفحه اصلی، برند و دسته‌بندی محصول باید فعال باشند';
      } else if (
        effectivePriceToman === null ||
        !Number.isSafeInteger(effectivePriceToman) ||
        effectivePriceToman <= 0
      ) {
        nextErrors.priceToman = 'برای نمایش در صفحه اصلی، قیمت مؤثر معتبر الزامی است';
      } else if (normalizedImages.length === 0) {
        nextErrors.images = 'برای نمایش در صفحه اصلی، حداقل یک تصویر محصول الزامی است';
      }
    }

    if (values.seoTitle.trim().length > 120) {
      nextErrors.seoTitle = 'عنوان سئو حداکثر ۱۲۰ کاراکتر باشد';
    }

    if (values.seoDescription.trim().length > 320) {
      nextErrors.seoDescription = 'توضیحات سئو حداکثر ۳۲۰ کاراکتر باشد';
    }

    if (values.canonicalUrl.trim().length > 0 && !isValidOptionalUrl(values.canonicalUrl)) {
      nextErrors.canonicalUrl = 'آدرس Canonical باید یک URL معتبر با http یا https باشد';
    }

    if (values.openGraphTitle.trim().length > 160) {
      nextErrors.openGraphTitle = 'عنوان Open Graph حداکثر ۱۶۰ کاراکتر باشد';
    }

    if (values.openGraphDescription.trim().length > 500) {
      nextErrors.openGraphDescription = 'توضیحات Open Graph حداکثر ۵۰۰ کاراکتر باشد';
    }

    if (
      values.openGraphImageUrl.trim().length > 0 &&
      !isValidOptionalUrl(values.openGraphImageUrl)
    ) {
      nextErrors.openGraphImageUrl =
        'آدرس تصویر Open Graph باید یک URL معتبر با http یا https باشد';
    }

    if (values.openGraphImageAlt.trim().length > 255) {
      nextErrors.openGraphImageAlt = 'متن جایگزین تصویر Open Graph حداکثر ۲۵۵ کاراکتر باشد';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return null;
    }

    const commonPayload = {
      sku,
      slug,
      name,
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      specifications,
      stockStatus: resolvedStockStatus,
      stockQuantity,
      lowStockThreshold,
      status: values.status,
      isPublished: values.isPublished,
      isTorobEnabled: values.isTorobEnabled,
      showOnHome: values.showOnHome,
      homeSortOrder,
      seoTitle: nullableText(values.seoTitle),
      seoDescription: nullableText(values.seoDescription),
      canonicalUrl: nullableText(values.canonicalUrl),
      noIndex: values.noIndex,
      openGraphTitle: nullableText(values.openGraphTitle),
      openGraphDescription: nullableText(values.openGraphDescription),
      openGraphImageUrl: nullableText(values.openGraphImageUrl),
      openGraphImageAlt: nullableText(values.openGraphImageAlt),
      brandId: values.brandId,
      categoryId: values.categoryId,
      codes: normalizedCodes,
      images: normalizedImages,
    };

    if (!isEditing) {
      return {
        ...commonPayload,

        ...(basePriceToman !== null
          ? {
              priceToman: basePriceToman,
            }
          : {}),

        ...(values.saleEnabled && salePriceToman !== null
          ? {
              salePriceToman,

              ...(saleStartsAt
                ? {
                    saleStartsAt,
                  }
                : {}),

              ...(saleEndsAt
                ? {
                    saleEndsAt,
                  }
                : {}),
            }
          : {}),
      };
    }

    return {
      ...commonPayload,

      // در Edit ارسال null اهمیت دارد؛
      // چون با خاموش‌کردن تخفیف، Backend باید داده‌های قبلی را پاک کند
      priceToman: basePriceToman,
      salePriceToman,
      saleStartsAt,
      saleEndsAt,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = validateAndBuildPayload();

    if (!payload) {
      return;
    }

    setSubmitError(null);
    setIsSaving(true);

    try {
      await onSubmit(payload);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className='space-y-6' onSubmit={handleSubmit}>
      {submitError ? (
        <div
          role='alert'
          className='rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger'
        >
          {submitError}
        </div>
      ) : null}

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]'>
        <div className='space-y-6'>
          <EditorSection
            title='اطلاعات پایه'
            description='این اطلاعات در جستجو، کاتالوگ و صفحه محصول استفاده می‌شوند'
          >
            <div className='grid gap-5 md:grid-cols-2'>
              <FormField label='نام محصول' required error={errors.name} className='md:col-span-2'>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    required={required}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={250}
                    value={values.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder='مثلاً سنسور اکسیژن بوش کد 0258006028'
                  />
                )}
              </FormField>

              <FormField
                label='SKU'
                required
                helperText='شناسه داخلی یکتای محصول'
                error={errors.sku}
              >
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    required={required}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={120}
                    value={values.sku}
                    onChange={(event) => setField('sku', event.target.value)}
                    placeholder='BOSCH-O2-0258006028'
                  />
                )}
              </FormField>

              <FormField
                label='Slug'
                required
                helperText='آدرس یکتای محصول در سایت'
                error={errors.slug}
              >
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Input
                    id={id}
                    required={required}
                    dir='ltr'
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={180}
                    value={values.slug}
                    onChange={(event) => setField('slug', event.target.value)}
                    onBlur={() => setField('slug', normalizeSlug(values.slug))}
                    placeholder='bosch-oxygen-sensor-0258006028'
                  />
                )}
              </FormField>

              <FormField label='برند' required error={errors.brandId}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Combobox
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    aria-required={required}
                    value={values.brandId}
                    onValueChange={(value) => setField('brandId', value)}
                    options={brandOptions}
                    loading={optionsLoading}
                    disabled={isSaving}
                    clearable
                    placeholder='انتخاب برند'
                    searchPlaceholder='جستجو در برندها'
                    emptyMessage='برندی پیدا نشد'
                  />
                )}
              </FormField>

              <FormField label='دسته‌بندی' required error={errors.categoryId}>
                {({ id, labelId, describedBy, invalid, required }) => (
                  <Combobox
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    aria-required={required}
                    value={values.categoryId}
                    onValueChange={(value) => setField('categoryId', value)}
                    options={categoryOptions}
                    loading={optionsLoading}
                    disabled={isSaving}
                    clearable
                    placeholder='انتخاب دسته‌بندی'
                    searchPlaceholder='جستجو در دسته‌بندی‌ها'
                    emptyMessage='دسته‌بندی پیدا نشد'
                  />
                )}
              </FormField>

              <FormField
                label='توضیح کوتاه'
                helperText='خلاصه‌ای کوتاه برای کارت محصول و نتیجه جستجو'
                error={errors.shortDescription}
                className='md:col-span-2'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={500}
                    rows={3}
                    value={values.shortDescription}
                    onChange={(event) => setField('shortDescription', event.target.value)}
                    placeholder='مثلاً مناسب خودروهای منتخب با سوکت چهار پین'
                  />
                )}
              </FormField>

              <FormField
                label='توضیحات کامل'
                helperText='کاربرد قطعه، نکات نصب، علائم خرابی و جزئیات فنی را وارد کنید'
                error={errors.description}
                className='md:col-span-2'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    maxLength={20000}
                    rows={8}
                    value={values.description}
                    onChange={(event) => setField('description', event.target.value)}
                    placeholder='توضیحات کامل محصول...'
                  />
                )}
              </FormField>
            </div>
          </EditorSection>

          <EditorSection
            title='کدهای محصول'
            description='OEM، کد فنی یا کد تأمین‌کننده را ثبت کنید'
            action={
              <Button
                type='button'
                size='sm'
                variant='outline'
                iconStart={<Plus />}
                disabled={isSaving || values.codes.length >= MAX_CODES}
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    codes: [
                      ...current.codes,
                      {
                        id: createLocalId('code'),
                        type: 'OEM',
                        value: '',
                      },
                    ],
                  }))
                }
              >
                افزودن کد
              </Button>
            }
          >
            <div className='space-y-3'>
              {values.codes.length === 0 ? (
                <div className='flex items-center gap-3 rounded-control border border-dashed border-border bg-surface-muted px-4 py-5 text-sm text-foreground-muted'>
                  <Code2 className='size-5 shrink-0' />
                  هنوز کدی ثبت نشده است
                </div>
              ) : (
                values.codes.map((code, index) => (
                  <div
                    key={code.id}
                    className='grid gap-3 rounded-control border border-border bg-surface-muted p-3 sm:grid-cols-[10rem_minmax(0,1fr)_auto]'
                  >
                    <Select
                      aria-label={`نوع کد شماره ${index + 1}`}
                      value={code.type}
                      disabled={isSaving}
                      onValueChange={(value) =>
                        updateCode(code.id, {
                          type: value as ProductCodeType,
                        })
                      }
                      options={[
                        {
                          value: 'OEM',
                          label: 'OEM',
                        },
                        {
                          value: 'TECHNICAL',
                          label: 'فنی',
                        },
                        {
                          value: 'SUPPLIER',
                          label: 'تأمین‌کننده',
                        },
                      ]}
                    />

                    <Input
                      aria-label={`مقدار کد شماره ${index + 1}`}
                      dir='rtl'
                      disabled={isSaving}
                      value={code.value}
                      onChange={(event) =>
                        updateCode(code.id, {
                          value: event.target.value,
                        })
                      }
                      placeholder='0258006028'
                    />

                    <IconButton
                      type='button'
                      aria-label={`حذف کد شماره ${index + 1}`}
                      icon={<Trash2 />}
                      variant='danger'
                      size='md'
                      disabled={isSaving}
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          codes: current.codes.filter((item) => item.id !== code.id),
                        }))
                      }
                    />
                  </div>
                ))
              )}

              {errors.codes ? (
                <p role='alert' className='type-caption font-medium text-danger'>
                  {errors.codes}
                </p>
              ) : null}
            </div>
          </EditorSection>

          <EditorSection
            title='تصاویر محصول'
            description='اولین تصویر در لیست، تصویر اصلی محصول محسوب می‌شود'
            action={
              <Button
                type='button'
                size='sm'
                variant='outline'
                iconStart={<Link2 />}
                disabled={isSaving || isArchived || values.images.length >= MAX_IMAGES}
                onClick={addImageUrlRow}
              >
                افزودن با URL
              </Button>
            }
          >
            <div className='space-y-4'>
              <FormField
                label='بارگذاری فایل تصویر'
                helperText={`فرمت‌های مجاز JPG، PNG و WebP · حداکثر ${toPersianDigits(MAX_IMAGES)} تصویر · هر فایل حداکثر ۵ مگابایت`}
                error={errors.images}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <FileUpload
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    accept='image/jpeg,image/png,image/webp'
                    multiple
                    maxFiles={MAX_IMAGES - values.images.length}
                    maxSize={5 * 1024 * 1024}
                    disabled={
                      isSaving ||
                      isArchived ||
                      isUploadingImages ||
                      !onUploadImages ||
                      values.images.length >= MAX_IMAGES
                    }
                    title={
                      onUploadImages
                        ? 'تصاویر محصول را اینجا رها کنید'
                        : 'اتصال بارگذاری فایل هنوز انجام نشده است'
                    }
                    description={
                      onUploadImages
                        ? 'برای انتخاب فایل کلیک کنید یا فایل‌ها را اینجا رها کنید'
                        : 'تا اتصال Storage، از گزینه «افزودن با URL» استفاده کنید'
                    }
                    onFilesSelected={handleImageFilesSelected}
                    onFilesRejected={handleImageFilesRejected}
                  />
                )}
              </FormField>

              {!onUploadImages ? (
                <div className='rounded-control border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning'>
                  API ذخیره‌سازی تصویر هنوز متصل نشده است. فعلاً URL عمومی تصویر را وارد کنید
                </div>
              ) : null}

              <SortableImageList
                items={values.images}
                disabled={isSaving || isArchived || isUploadingImages}
                showUrlInput
                showAltInput
                emptyState='هنوز تصویری ثبت نشده است'
                onReorder={(images) => {
                  setValues((current) => ({
                    ...current,
                    images,
                  }));

                  setErrors((current) => ({
                    ...current,
                    images: undefined,
                  }));
                }}
                onRemove={(imageId) => {
                  setValues((current) => ({
                    ...current,
                    images: current.images.filter((image) => image.id !== imageId),
                  }));

                  setErrors((current) => ({
                    ...current,
                    images: undefined,
                  }));
                }}
                onUrlChange={(imageId, url) => {
                  updateImage(imageId, {
                    url,
                  });
                }}
                onAltChange={(imageId, alt) => {
                  updateImage(imageId, {
                    alt,
                  });
                }}
              />
            </div>
          </EditorSection>
          <EditorSection
            title='مشخصات فنی'
            description='برای هر ویژگی، یک عنوان و مقدار ثبت کنید'
            action={
              <Button
                type='button'
                size='sm'
                variant='outline'
                iconStart={<ListPlus />}
                disabled={isSaving}
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    specifications: [
                      ...current.specifications,
                      {
                        id: createLocalId('spec'),
                        key: '',
                        value: '',
                      },
                    ],
                  }))
                }
              >
                افزودن مشخصه
              </Button>
            }
          >
            <div className='space-y-3'>
              {values.specifications.length === 0 ? (
                <div className='rounded-control border border-dashed border-border bg-surface-muted px-4 py-5 text-sm text-foreground-muted'>
                  هنوز مشخصه فنی ثبت نشده است
                </div>
              ) : (
                values.specifications.map((specification, index) => (
                  <div
                    key={specification.id}
                    className='grid gap-3 rounded-control border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)_auto]'
                  >
                    <Input
                      aria-label={`عنوان مشخصه شماره ${index + 1}`}
                      disabled={isSaving}
                      value={specification.key}
                      onChange={(event) =>
                        updateSpecification(specification.id, {
                          key: event.target.value,
                        })
                      }
                      placeholder='مثلاً تعداد پین'
                    />

                    <Input
                      aria-label={`مقدار مشخصه شماره ${index + 1}`}
                      disabled={isSaving}
                      value={specification.value}
                      onChange={(event) =>
                        updateSpecification(specification.id, {
                          value: event.target.value,
                        })
                      }
                      placeholder='مثلاً 4'
                    />

                    <IconButton
                      type='button'
                      aria-label={`حذف مشخصه شماره ${index + 1}`}
                      icon={<Trash2 />}
                      variant='danger'
                      size='md'
                      disabled={isSaving}
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          specifications: current.specifications.filter(
                            (item) => item.id !== specification.id,
                          ),
                        }))
                      }
                    />
                  </div>
                ))
              )}

              {errors.specifications ? (
                <p role='alert' className='type-caption font-medium text-danger'>
                  {errors.specifications}
                </p>
              ) : null}
            </div>
          </EditorSection>

          <EditorSection
            title='سئو و Open Graph'
            description='این بخش برای کنترل عنوان، توضیحات و تصویر محصول در موتورهای جستجو و شبکه‌های اجتماعی استفاده می‌شود'
          >
            <div className='grid gap-5'>
              <div className='grid gap-5 md:grid-cols-2'>
                <FormField
                  label='عنوان سئو'
                  helperText={`حداکثر ۱۲۰ کاراکتر. مقدار فعلی: ${toPersianDigits(values.seoTitle.length)}`}
                  error={errors.seoTitle}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Input
                      id={id}
                      dir='rtl'
                      maxLength={120}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.seoTitle}
                      onChange={(event) => setField('seoTitle', event.target.value)}
                      placeholder='مثلاً: خرید سنسور اکسیژن بوش اصل'
                    />
                  )}
                </FormField>

                <FormField
                  label='Canonical URL'
                  helperText='اگر خالی باشد، آدرس خود محصول به‌عنوان canonical استفاده می‌شود'
                  error={errors.canonicalUrl}
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Input
                      id={id}
                      dir='ltr'
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving}
                      value={values.canonicalUrl}
                      onChange={(event) => setField('canonicalUrl', event.target.value)}
                      placeholder='https://partsanj.com/products/product-slug'
                    />
                  )}
                </FormField>
              </div>

              <FormField label='توضیحات سئو' error={errors.seoDescription}>
                {({ id, labelId, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    maxLength={320}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.seoDescription}
                    helperText={`حداکثر ۳۲۰ کاراکتر. مقدار فعلی`}
                    onChange={(event) => setField('seoDescription', event.target.value)}
                    placeholder='توضیح کوتاه و دقیق برای نمایش در نتایج جستجو'
                  />
                )}
              </FormField>

              <FormField
                label='عدم ایندکس توسط موتورهای جستجو'
                helperText='اگر فعال باشد، صفحه محصول با robots noindex منتشر می‌شود'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    checked={values.noIndex}
                    onCheckedChange={(checked) => setField('noIndex', checked)}
                  />
                )}
              </FormField>

              <div className='rounded-2xl border border-border bg-background/60 p-5'>
                <div className='mb-5'>
                  <h3 className='text-base font-extrabold text-foreground'>Open Graph</h3>
                  <p className='mt-1 text-sm leading-6 text-foreground-secondary'>
                    این اطلاعات هنگام اشتراک‌گذاری لینک محصول در شبکه‌های اجتماعی و پیام‌رسان‌ها
                    استفاده می‌شود.
                  </p>
                </div>

                <div className='grid gap-5 md:grid-cols-2'>
                  <FormField
                    label='عنوان Open Graph'
                    helperText={`حداکثر ۱۶۰ کاراکتر. مقدار فعلی: ${toPersianDigits(values.openGraphTitle.length)}`}
                    error={errors.openGraphTitle}
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        dir='rtl'
                        maxLength={160}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving}
                        value={values.openGraphTitle}
                        onChange={(event) => setField('openGraphTitle', event.target.value)}
                        placeholder='عنوان مناسب برای اشتراک‌گذاری محصول'
                      />
                    )}
                  </FormField>

                  <FormField
                    label='تصویر Open Graph'
                    helperText='URL تصویر عمومی با http یا https'
                    error={errors.openGraphImageUrl}
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        dir='ltr'
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving}
                        value={values.openGraphImageUrl}
                        onChange={(event) => setField('openGraphImageUrl', event.target.value)}
                        placeholder='https://cdn.partsanj.com/products/product-og.jpg'
                      />
                    )}
                  </FormField>
                </div>

                <div className='mt-5'>
                  <FormField label='توضیحات Open Graph' error={errors.openGraphDescription}>
                    {({ id, labelId, describedBy, invalid }) => (
                      <Textarea
                        id={id}
                        rows={3}
                        maxLength={500}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving}
                        value={values.openGraphDescription}
                        helperText={`حداکثر ۵۰۰ کاراکتر. مقدار فعلی`}
                        onChange={(event) => setField('openGraphDescription', event.target.value)}
                        placeholder='توضیح مناسب برای پیش‌نمایش شبکه‌های اجتماعی'
                      />
                    )}
                  </FormField>
                </div>

                <div className='mt-5'>
                  <FormField
                    label='Alt تصویر Open Graph'
                    helperText={`حداکثر ۲۵۵ کاراکتر. مقدار فعلی: ${toPersianDigits(values.openGraphImageAlt.length)}`}
                    error={errors.openGraphImageAlt}
                  >
                    {({ id, labelId, describedBy, invalid }) => (
                      <Input
                        id={id}
                        dir='rtl'
                        maxLength={255}
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving}
                        value={values.openGraphImageAlt}
                        onChange={(event) => setField('openGraphImageAlt', event.target.value)}
                        placeholder='مثلاً: تصویر سنسور اکسیژن بوش'
                      />
                    )}
                  </FormField>
                </div>
              </div>
            </div>
          </EditorSection>
        </div>

        <aside className='space-y-6 xl:sticky xl:top-24 xl:self-start'>
          <EditorSection
            title='قیمت و وضعیت'
            description='انتشار و ترب فقط با اطلاعات کامل فعال می‌شوند'
          >
            <div className='space-y-5'>
              <FormField
                label='قیمت اصلی'
                helperText='قیمت قبل از تخفیف را به تومان وارد کنید'
                error={errors.priceToman}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <PriceInput
                    id={id}
                    unit='toman'
                    digits='fa'
                    showConversion
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving || isArchived}
                    value={values.priceToman}
                    onValueChange={(value) => setField('priceToman', value)}
                    placeholder='۰'
                  />
                )}
              </FormField>

              <FormField
                label='تخفیف محصول'
                helperText='قیمت تخفیفی فقط در بازه زمانی تعیین‌شده فعال می‌شود'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    checked={values.saleEnabled}
                    disabled={isSaving || isArchived}
                    onCheckedChange={(checked) => {
                      setValues((current) => ({
                        ...current,
                        saleEnabled: checked,
                        salePriceToman: checked ? current.salePriceToman : null,
                        saleStartsAt: checked ? toDateOrNull(current.saleStartsAt) : null,
                        saleEndsAt: checked ? toDateOrNull(current.saleEndsAt) : null,
                      }));
                    }}
                  />
                )}
              </FormField>

              {values.saleEnabled ? (
                <>
                  <FormField label='قیمت تخفیفی' required error={errors.salePriceToman}>
                    {({ id, labelId, describedBy, invalid, required }) => (
                      <PriceInput
                        id={id}
                        required={required}
                        unit='toman'
                        digits='fa'
                        showConversion
                        aria-labelledby={labelId}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                        disabled={isSaving || isArchived}
                        value={values.salePriceToman}
                        onValueChange={(value) => setField('salePriceToman', value)}
                        placeholder='۰'
                      />
                    )}
                  </FormField>

                  <div className='flex flex-col gap-2 border-b border-border pb-3'>
                    <FormField
                      label='شروع تخفیف'
                      helperText='خالی یعنی تخفیف از همین حالا فعال است'
                      error={errors.saleStartsAt}
                    >
                      {({ id, labelId, describedBy, invalid }) => (
                        <JalaliDatePicker
                          id={id}
                          withTime
                          timeZone='Asia/Tehran'
                          value={values.saleStartsAt}
                          onValueChange={(value) => setField('saleStartsAt', value)}
                          aria-labelledby={labelId}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                          placeholder='تاریخ و ساعت شروع'
                        />
                      )}
                    </FormField>

                    <FormField
                      label='پایان تخفیف'
                      helperText='خالی یعنی تخفیف بدون تاریخ پایان است'
                      error={errors.saleEndsAt}
                    >
                      {({ id, labelId, describedBy, invalid }) => (
                        <JalaliDatePicker
                          id={id}
                          withTime
                          timeZone='Asia/Tehran'
                          value={values.saleEndsAt}
                          onValueChange={(value) => setField('saleEndsAt', value)}
                          aria-labelledby={labelId}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                          placeholder='تاریخ و ساعت پایان'
                        />
                      )}
                    </FormField>
                  </div>
                </>
              ) : null}

              {isArchived ? (
                <div className='rounded-control border border-border bg-surface-muted p-3'>
                  <p className='type-label text-foreground'>وضعیت محصول</p>

                  <div className='mt-2'>
                    <Badge variant='neutral' dot>
                      آرشیو
                    </Badge>
                  </div>
                </div>
              ) : (
                <FormField label='وضعیت محصول' error={errors.status}>
                  {({ id, labelId, describedBy, invalid }) => (
                    <Select
                      id={id}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      value={values.status}
                      disabled={isSaving}
                      onValueChange={(value) => {
                        const nextStatus = value as ProductStatus;

                        setValues((current) => ({
                          ...current,
                          status: nextStatus,
                          isPublished: nextStatus === 'ACTIVE' ? current.isPublished : false,
                          isTorobEnabled: nextStatus === 'ACTIVE' ? current.isTorobEnabled : false,
                        }));

                        setErrors((current) => ({
                          ...current,
                          status: undefined,
                          state: undefined,
                        }));
                      }}
                      options={[
                        {
                          value: 'DRAFT',
                          label: 'پیش‌نویس',
                        },
                        {
                          value: 'ACTIVE',
                          label: 'فعال',
                        },
                      ]}
                    />
                  )}
                </FormField>
              )}

              <FormField
                label='نمایش در فروشگاه'
                helperText='فقط محصول فعال با برند و دسته فعال قابل انتشار است'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving || isArchived}
                    checked={values.isPublished}
                    onCheckedChange={(checked) => {
                      setValues((current) => ({
                        ...current,
                        isPublished: checked,
                        isTorobEnabled: checked ? current.isTorobEnabled : false,
                      }));

                      setErrors((current) => ({
                        ...current,
                        state: undefined,
                      }));
                    }}
                  />
                )}
              </FormField>

              <div className='rounded-control border border-border bg-surface-muted p-4'>
                <FormField
                  label='نمایش در محصولات ویژه صفحه اصلی'
                  helperText='اگر فعال باشد، این محصول در سکشن محصولات ویژه صفحه خانه نمایش داده می‌شود'
                >
                  {({ id, labelId, describedBy, invalid }) => (
                    <Switch
                      id={id}
                      aria-labelledby={labelId}
                      aria-describedby={describedBy}
                      aria-invalid={invalid}
                      disabled={isSaving || isArchived}
                      checked={values.showOnHome}
                      onCheckedChange={(checked) => {
                        setField('showOnHome', checked);
                      }}
                    />
                  )}
                </FormField>

                {values.showOnHome ? (
                  <div className='mt-4'>
                    <FormField
                      label='ترتیب نمایش در صفحه اصلی'
                      helperText='عدد کمتر زودتر نمایش داده می‌شود'
                      error={errors.homeSortOrder}
                    >
                      {({ id, labelId, describedBy, invalid }) => (
                        <Input
                          id={id}
                          type='number'
                          min={0}
                          inputMode='numeric'
                          dir='ltr'
                          aria-labelledby={labelId}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                          disabled={isSaving || isArchived}
                          value={values.homeSortOrder}
                          onChange={(event) => {
                            setField('homeSortOrder', event.target.value);
                          }}
                          placeholder='0'
                        />
                      )}
                    </FormField>
                  </div>
                ) : null}
              </div>

              <FormField
                label='ارسال به ترب'
                helperText='نیازمند محصول فعال، منتشرشده، موجود، دارای قیمت، کد و تصویر است'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Switch
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving || isArchived}
                    checked={values.isTorobEnabled}
                    onCheckedChange={(checked) => {
                      setField('isTorobEnabled', checked);
                    }}
                  />
                )}
              </FormField>

              {errors.state ? (
                <div
                  role='alert'
                  className='rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger'
                >
                  {errors.state}
                </div>
              ) : null}
            </div>
          </EditorSection>

          <EditorSection
            title='موجودی و انبار'
            description='تعداد قابل فروش محصول و حد هشدار کمبود موجودی را مشخص کنید'
          >
            <div className='grid gap-5 md:grid-cols-2'>
              <FormField
                label='روش مدیریت موجودی'
                helperText='محصولات استعلامی مستقیماً قابل سفارش نیستند'
                error={errors.inventoryMode}
                className='md:col-span-2'
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Select
                    id={id}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving}
                    value={values.inventoryMode}
                    onValueChange={(value) => setField('inventoryMode', value as InventoryMode)}
                    options={[
                      {
                        value: 'TRACKED',
                        label: 'مدیریت موجودی عددی',
                      },
                      {
                        value: 'CHECK_AVAILABILITY',
                        label: 'نیازمند استعلام موجودی',
                      },
                    ]}
                  />
                )}
              </FormField>

              <FormField
                label='تعداد موجودی'
                helperText={
                  values.inventoryMode === 'CHECK_AVAILABILITY'
                    ? 'در حالت استعلام، این مقدار در سفارش استفاده نمی‌شود'
                    : 'حداکثر تعداد قابل فروش این محصول'
                }
                error={errors.stockQuantity}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type='number'
                    inputMode='numeric'
                    min={0}
                    step={1}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving || values.inventoryMode === 'CHECK_AVAILABILITY'}
                    value={values.stockQuantity}
                    onChange={(event) => setField('stockQuantity', event.target.value)}
                    placeholder='0'
                  />
                )}
              </FormField>

              <FormField
                label='حد هشدار موجودی'
                helperText='در این تعداد یا کمتر، محصول کم‌موجود محسوب می‌شود'
                error={errors.lowStockThreshold}
              >
                {({ id, labelId, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type='number'
                    inputMode='numeric'
                    min={0}
                    step={1}
                    aria-labelledby={labelId}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    disabled={isSaving || values.inventoryMode === 'CHECK_AVAILABILITY'}
                    value={values.lowStockThreshold}
                    onChange={(event) => setField('lowStockThreshold', event.target.value)}
                    placeholder='5'
                  />
                )}
              </FormField>
            </div>

            {values.inventoryMode === 'TRACKED' ? (
              <div className='mt-4 rounded-control border border-border bg-surface-muted px-4 py-3 text-sm text-foreground-secondary'>
                وضعیت محاسبه‌شده:{' '}
                <strong className='text-foreground'>
                  {Number(values.stockQuantity) > 0 ? 'موجود' : 'ناموجود'}
                </strong>
              </div>
            ) : null}
          </EditorSection>

          <div className='rounded-card border border-border bg-surface p-4 shadow-panel'>
            <Button
              type='submit'
              iconStart={<Save />}
              isLoading={isSaving}
              disabled={isSaving || optionsLoading}
              className='w-full'
            >
              {isEditing ? 'ذخیره تغییرات' : 'ایجاد محصول'}
            </Button>

            <p className='mt-3 text-center text-xs leading-5 text-foreground-muted'>
              هر تغییر محصول در تاریخچه عملیاتی ثبت می‌شود
            </p>

            {isEditing && !isArchived && onRequestArchive ? (
              <Button
                type='button'
                variant='danger'
                iconStart={<Archive />}
                disabled={isSaving}
                onClick={onRequestArchive}
                className='mt-3 w-full'
              >
                آرشیو محصول
              </Button>
            ) : null}
          </div>
        </aside>
      </div>
    </form>
  );
}
